-- ============================================================
-- Expenses + Mileage tracking
-- Idempotent — safe to re-run
-- ============================================================

create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  project_id  uuid references projects on delete set null,
  date        date not null default current_date,
  category    text,
  vendor      text,
  amount      numeric not null default 0,
  notes       text,
  receipt_url text,
  created_at  timestamptz not null default now()
);

alter table expenses enable row level security;
drop policy if exists "Users manage own expenses" on expenses;
create policy "Users manage own expenses"
  on expenses for all using (auth.uid() = user_id);

create table if not exists mileage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  project_id  uuid references projects on delete set null,
  date        date not null default current_date,
  from_location text,
  to_location   text,
  miles       numeric not null default 0,
  purpose     text,
  created_at  timestamptz not null default now()
);

alter table mileage enable row level security;
drop policy if exists "Users manage own mileage" on mileage;
create policy "Users manage own mileage"
  on mileage for all using (auth.uid() = user_id);

-- Receipt photos bucket
insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', true)
  on conflict do nothing;

drop policy if exists "Users upload own receipts" on storage.objects;
create policy "Users upload own receipts"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete own receipts" on storage.objects;
create policy "Users delete own receipts"
  on storage.objects for delete
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
