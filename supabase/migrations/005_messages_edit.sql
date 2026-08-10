-- Message edits + client update policy
-- Run after 003_core_tables.sql

alter table messages
  add column if not exists edited_at timestamptz;

-- Clients can edit their own messages
create policy "messages_update_own_as_client"
  on messages for update
  using (
    sender = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    sender = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );
