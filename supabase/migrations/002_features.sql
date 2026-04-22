-- ============================================================
-- Feature additions: photos, payment links, e-signatures
-- Idempotent — safe to re-run
-- ============================================================

-- Projects: photos array
alter table projects add column if not exists photos jsonb default '[]';

-- Invoices: payment link + deposit
alter table invoices add column if not exists payment_link text;
alter table invoices add column if not exists deposit_amount numeric;

-- Estimates: public sharing + signature
alter table estimates add column if not exists public_token text unique default encode(gen_random_bytes(16), 'hex');
alter table estimates add column if not exists signature_data text;
alter table estimates add column if not exists signed_at timestamptz;
alter table estimates add column if not exists client_email text;

-- Backfill tokens for existing estimates
update estimates set public_token = encode(gen_random_bytes(16), 'hex') where public_token is null;

-- Public read for estimates by token
drop policy if exists "Public read estimates by token" on estimates;
create policy "Public read estimates by token"
  on estimates for select using (public_token is not null);

-- Signing function (SECURITY DEFINER so anon can sign without being able to edit anything else)
create or replace function public.sign_estimate(token_param text, signature_param text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.estimates
  set signature_data = signature_param, signed_at = now()
  where public_token = token_param and signed_at is null;
end;
$$;

grant execute on function public.sign_estimate(text, text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- Project photos storage bucket
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('project-photos', 'project-photos', true)
  on conflict do nothing;

drop policy if exists "Users upload own project photos" on storage.objects;
create policy "Users upload own project photos"
  on storage.objects for insert
  with check (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete own project photos" on storage.objects;
create policy "Users delete own project photos"
  on storage.objects for delete
  using (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);
