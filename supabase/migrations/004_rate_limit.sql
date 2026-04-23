-- ============================================================
-- AI usage tracking + 350/day rate limit
-- Idempotent — safe to re-run
-- ============================================================

create table if not exists ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  called_at   timestamptz not null default now()
);

create index if not exists ai_usage_user_day_idx on ai_usage (user_id, called_at desc);

alter table ai_usage enable row level security;
drop policy if exists "Users read own usage" on ai_usage;
create policy "Users read own usage"
  on ai_usage for select using (auth.uid() = user_id);

-- Edge function uses service role to insert; no insert policy for anon/auth users.

-- Returns count of AI calls in the trailing 24h for the given user.
create or replace function public.ai_usage_today(uid uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from ai_usage
  where user_id = uid and called_at > now() - interval '24 hours';
$$;

grant execute on function public.ai_usage_today(uuid) to anon, authenticated;
