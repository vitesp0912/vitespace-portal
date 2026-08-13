-- Convert per-client services → global services (if 009 was run with client_id).
-- Safe to run even if services are already global.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'client_id'
  ) then
    raise notice 'services already global — skipping 010';
    return;
  end if;

  -- Drop policies that reference client_id BEFORE dropping the column
  drop policy if exists "services_select_own" on services;
  drop policy if exists "admin_all_services" on services;

  -- Canonical service per distinct name (keep one id)
  create temporary table svc_map as
  select
    name,
    min(id) as keep_id
  from services
  group by name;

  -- Remap tasks to the kept service id for each name
  update tasks t
  set service_id = m.keep_id
  from services s
  join svc_map m on m.name = s.name
  where t.service_id = s.id
    and t.service_id <> m.keep_id;

  -- Drop duplicate service rows
  delete from services s
  using svc_map m
  where s.name = m.name
    and s.id <> m.keep_id;

  -- Drop client-scoped constraint/index/column
  alter table services drop constraint if exists services_client_id_name_key;
  drop index if exists idx_services_client;
  alter table services drop column client_id;

  -- Enforce global unique name
  alter table services drop constraint if exists services_name_key;
  begin
    alter table services add constraint services_name_key unique (name);
  exception
    when duplicate_object then null;
  end;

  -- Re-create policies for global services
  create policy "services_select_authenticated"
    on services for select
    using (auth.uid() is not null);

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_users'
  ) then
    create policy "admin_all_services"
      on services for all
      using (exists (select 1 from admin_users where user_id = auth.uid()))
      with check (exists (select 1 from admin_users where user_id = auth.uid()));
  end if;

  drop table if exists svc_map;
end $$;
