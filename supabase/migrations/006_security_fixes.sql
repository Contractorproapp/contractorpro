-- ============================================================
-- 006 — Security fixes
--
-- Replaces over-permissive "public read by token" RLS policies with
-- security-definer RPC functions that only return ONE row per token.
--
-- The previous policies (`using (public_token is not null)`) allowed any
-- caller with the anon key to SELECT every row in invoices/projects, since
-- nothing in the policy enforced the WHERE clause. Now public reads are
-- routed through a function whose body filters by the token argument.
--
-- Also adds the missing public-read flow for estimates, plus the existing
-- sign_estimate RPC's first registration if not already present.
-- ============================================================

-- Drop the over-permissive policies. Owner-only "manage own" policies stay.
drop policy if exists "Public read invoices by token" on invoices;
drop policy if exists "Public read projects by token" on projects;

-- ─────────────────────────────────────────────
-- PROFILES — limited public read (business identity only) for public docs
--
-- Returns only the fields a customer viewing an invoice/estimate/project
-- needs to see (business name, phone, email, logo). NEVER returns the
-- Claude API key, subscription status, stripe IDs, etc.
-- ─────────────────────────────────────────────
create or replace function public.get_public_profile(uid uuid)
returns table (
  business_name text,
  phone         text,
  email         text,
  logo_url      text
)
language sql
security definer
set search_path = public
stable
as $$
  select business_name, phone, email, logo_url
  from profiles
  where id = uid
  limit 1;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────
-- INVOICES — public fetch via token
-- ─────────────────────────────────────────────
create or replace function public.get_public_invoice(token_param text)
returns invoices
language sql
security definer
set search_path = public
stable
as $$
  select * from invoices
  where public_token = token_param
  limit 1;
$$;

revoke all on function public.get_public_invoice(text) from public;
grant execute on function public.get_public_invoice(text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- PROJECTS — public fetch via token
-- ─────────────────────────────────────────────
create or replace function public.get_public_project(token_param text)
returns projects
language sql
security definer
set search_path = public
stable
as $$
  select * from projects
  where public_token = token_param
  limit 1;
$$;

revoke all on function public.get_public_project(text) from public;
grant execute on function public.get_public_project(text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- ESTIMATES — public fetch via token (was completely missing before)
-- ─────────────────────────────────────────────
-- First make sure the column exists; older deployments may not have it.
alter table estimates
  add column if not exists public_token text unique
  default encode(gen_random_bytes(16), 'hex');

-- Backfill any null public_tokens for old rows
update estimates set public_token = encode(gen_random_bytes(16), 'hex')
where public_token is null;

-- Signature columns used by the public sign flow
alter table estimates
  add column if not exists signature_data text,
  add column if not exists signed_at      timestamptz;

create or replace function public.get_public_estimate(token_param text)
returns estimates
language sql
security definer
set search_path = public
stable
as $$
  select * from estimates
  where public_token = token_param
  limit 1;
$$;

revoke all on function public.get_public_estimate(text) from public;
grant execute on function public.get_public_estimate(text) to anon, authenticated;

-- sign_estimate: lets a public signer attach a signature to an estimate
-- looked up by its public_token. Returns the updated row.
create or replace function public.sign_estimate(
  token_param     text,
  signature_param text
)
returns estimates
language plpgsql
security definer
set search_path = public
as $$
declare
  updated estimates;
begin
  update estimates
     set signature_data = signature_param,
         signed_at      = now()
   where public_token   = token_param
     and signed_at      is null   -- one-shot — can't re-sign
  returning * into updated;

  if updated.id is null then
    raise exception 'Invalid token or already signed';
  end if;

  return updated;
end;
$$;

revoke all on function public.sign_estimate(text, text) from public;
grant execute on function public.sign_estimate(text, text) to anon, authenticated;
