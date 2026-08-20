-- Message edits + client update policy
-- Run after 003_core_tables.sql

alter table messages
  add column if not exists edited_at timestamptz;

drop policy if exists "messages_update_own_as_client" on messages;

-- Clients can edit their own messages in their thread
create policy "messages_update_own_as_client"
  on messages for update
  using (
    sender = 'client'
    and user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    sender = 'client'
    and user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );
