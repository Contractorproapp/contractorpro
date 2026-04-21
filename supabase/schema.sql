-- ============================================================
-- ContractorPro — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for gen_random_bytes
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id                        uuid references auth.users on delete cascade primary key,
  business_name             text,
  phone                     text,
  email                     text,
  logo_url                  text,
  claude_api_key            text,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  subscription_status       text not null default 'inactive',
  onboarding_complete       boolean not null default false,
  created_at                timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users manage own profile"
  on profiles for all using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────
-- ESTIMATES
-- ─────────────────────────────────────────────
create table if not exists estimates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  client_name text,
  phone       text,
  email       text,
  job_title   text,
  trade       text,
  address     text,
  notes       text,
  markup      numeric default 20,
  status      text default 'Draft',
  line_items  jsonb default '[]',
  subtotal    numeric default 0,
  total       numeric default 0,
  output      text,
  created_at  timestamptz not null default now()
);

alter table estimates enable row level security;
create policy "Users manage own estimates"
  on estimates for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────
create table if not exists leads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  phone        text,
  email        text,
  job_type     text,
  notes        text,
  status       text default 'New',
  last_contact date,
  created_at   timestamptz not null default now()
);

alter table leads enable row level security;
create policy "Users manage own leads"
  on leads for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users on delete cascade not null,
  client_name    text,
  client_email   text,
  client_phone   text,
  job_title      text,
  invoice_number text,
  issue_date     date,
  due_date       date,
  line_items     jsonb default '[]',
  subtotal       numeric default 0,
  tax_rate       numeric default 0,
  tax            numeric default 0,
  total          numeric default 0,
  status         text default 'Draft',
  notes          text,
  public_token   text unique default encode(gen_random_bytes(16), 'hex'),
  created_at     timestamptz not null default now()
);

alter table invoices enable row level security;
create policy "Users manage own invoices"
  on invoices for all using (auth.uid() = user_id);

-- Public read via token (for shareable links)
create policy "Public read invoices by token"
  on invoices for select using (public_token is not null);

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
create table if not exists projects (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users on delete cascade not null,
  name           text not null,
  client         text,
  address        text,
  start_date     date,
  end_date       date,
  status         text default 'Planning',
  description    text,
  notes          jsonb default '[]',
  change_orders  jsonb default '[]',
  public_token   text unique default encode(gen_random_bytes(16), 'hex'),
  created_at     timestamptz not null default now()
);

alter table projects enable row level security;
create policy "Users manage own projects"
  on projects for all using (auth.uid() = user_id);

-- Public read via token
create policy "Public read projects by token"
  on projects for select using (public_token is not null);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET for logos
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('logos', 'logos', true)
  on conflict do nothing;

create policy "Users upload own logo"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update own logo"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read logos"
  on storage.objects for select
  using (bucket_id = 'logos');
