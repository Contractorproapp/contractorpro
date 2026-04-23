-- ============================================================
-- Email send tracking + 50/day rate limit per user
-- Idempotent — safe to re-run
-- ============================================================

create table if not exists email_sends (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  recipient  text not null,
  subject    text,
  kind       text,
  sent_at    timestamptz not null default now()
);

create index if not exists email_sends_user_day_idx on email_sends (user_id, sent_at desc);

alter table email_sends enable row level security;
drop policy if exists "Users read own emails" on email_sends;
create policy "Users read own emails"
  on email_sends for select using (auth.uid() = user_id);

-- Edge function uses service role to insert; no insert policy for anon/auth users.

-- Returns count of emails sent in the trailing 24h for the given user.
create or replace function public.email_sends_today(uid uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from email_sends
  where user_id = uid and sent_at > now() - interval '24 hours';
$$;

grant execute on function public.email_sends_today(uuid) to anon, authenticated;
