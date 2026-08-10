-- Admin users + policies so Vitespace can read/write all client data.
-- Run after 001 + 003.

create table if not exists admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- Users can see their own admin row (needed for role checks in the app)
create policy "admin_users_select_own"
  on admin_users for select
  using (user_id = auth.uid());

-- Helper: is current user an admin?
-- Policies below use exists (select 1 from admin_users where user_id = auth.uid())

-- clients
create policy "admin_all_clients"
  on clients for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- client_users (admin can link users)
create policy "admin_all_client_users"
  on client_users for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- tasks
create policy "admin_all_tasks"
  on tasks for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- invoices
create policy "admin_all_invoices"
  on invoices for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- documents
create policy "admin_all_documents"
  on documents for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- messages
create policy "admin_all_messages"
  on messages for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- notifications
create policy "admin_all_notifications"
  on notifications for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- notifications: client can create alerts for Vitespace when they message
create policy "client_insert_notifications_for_admin"
  on notifications for insert
  with check (
    recipient = 'vitespace'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- After creating your Auth user, make them admin:
-- insert into admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
