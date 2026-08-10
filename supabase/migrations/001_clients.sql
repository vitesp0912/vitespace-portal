-- Clients + client_users (run in Supabase → SQL Editor → New query → Run)

-- 1. Tables
create table if not exists clients (
  id text primary key,
  name text not null,
  company text not null,
  email text not null,
  avatar text,
  monthly_retainer integer not null default 0,
  status text not null check (status in ('active', 'paused', 'completed')),
  project_status text not null check (project_status in ('on_track', 'at_risk', 'blocked', 'completed')),
  project_name text not null,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists client_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null references clients (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  unique (user_id, client_id)
);

create index if not exists idx_client_users_user on client_users (user_id);
create index if not exists idx_client_users_client on client_users (client_id);

-- 2. RLS
alter table clients enable row level security;
alter table client_users enable row level security;

-- Logged-in client users can read their own client row
create policy "clients_select_own"
  on clients for select
  using (
    id in (select client_id from client_users where user_id = auth.uid())
  );

-- Logged-in users can read their own membership row
create policy "client_users_select_own"
  on client_users for select
  using (user_id = auth.uid());
