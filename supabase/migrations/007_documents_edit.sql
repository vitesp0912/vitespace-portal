-- Document title edits + client update policy
-- Run after 006_documents_meta.sql

alter table documents
  add column if not exists edited_at timestamptz;

create policy "documents_update_own_as_client"
  on documents for update
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );
