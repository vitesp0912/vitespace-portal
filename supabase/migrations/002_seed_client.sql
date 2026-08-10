-- Seed one testing client (run after 001_clients.sql)
-- Safe to re-run: upserts by id

insert into clients (
  id,
  name,
  company,
  email,
  monthly_retainer,
  status,
  project_status,
  project_name,
  last_updated_at
) values (
  'test-client',
  'Test User',
  'Test Company',
  'test@example.com',
  0,
  'active',
  'on_track',
  'Portal Testing',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  company = excluded.company,
  email = excluded.email,
  monthly_retainer = excluded.monthly_retainer,
  status = excluded.status,
  project_status = excluded.project_status,
  project_name = excluded.project_name,
  last_updated_at = excluded.last_updated_at;

-- Link an Auth user AFTER you create them in Authentication → Users.
-- Replace YOUR_AUTH_USER_UUID with the user's UUID from the Auth dashboard.
--
-- insert into client_users (user_id, client_id, role)
-- values ('YOUR_AUTH_USER_UUID', 'test-client', 'owner')
-- on conflict (user_id, client_id) do nothing;
