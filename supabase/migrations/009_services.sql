-- Global services; tasks.service text → tasks.service_id FK
-- Run after 003_core_tables.sql (+ 004 if you use admin policies)

-- ---------------------------------------------------------------------------
-- services (global catalog — not per client)
-- ---------------------------------------------------------------------------
create table if not exists services (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table services enable row level security;

-- Any signed-in user can read services (needed to show names on tasks)
create policy "services_select_authenticated"
  on services for select
  using (auth.uid() is not null);

-- Admin write policies (no-op if admin_users missing)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_users'
  ) then
    execute $p$
      create policy "admin_all_services"
        on services for all
        using (exists (select 1 from admin_users where user_id = auth.uid()))
        with check (exists (select 1 from admin_users where user_id = auth.uid()))
    $p$;
  end if;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Migrate tasks.service (text) → tasks.service_id
-- ---------------------------------------------------------------------------
alter table tasks add column if not exists service_id text;

-- Backfill global services from distinct service text values
insert into services (id, name)
select
  'svc_' || md5(lower(btrim(t.service))),
  btrim(t.service)
from (
  select distinct btrim(service) as service
  from tasks
  where service is not null and btrim(service) <> ''
) t
on conflict (name) do nothing;

-- Point tasks at the matching global service
update tasks t
set service_id = s.id
from services s
where t.service_id is null
  and btrim(t.service) = s.name;

-- Fallback "General" for any remaining tasks
insert into services (id, name)
values ('svc_' || md5('general'), 'General')
on conflict (name) do nothing;

update tasks t
set service_id = s.id
from services s
where t.service_id is null
  and s.name = 'General';

-- Drop old text column + index
drop index if exists idx_tasks_service;
alter table tasks drop column if exists service;

alter table tasks
  alter column service_id set not null;

alter table tasks
  drop constraint if exists tasks_service_id_fkey;

alter table tasks
  add constraint tasks_service_id_fkey
  foreign key (service_id) references services (id) on delete restrict;

create index if not exists idx_tasks_service_id on tasks (service_id);
