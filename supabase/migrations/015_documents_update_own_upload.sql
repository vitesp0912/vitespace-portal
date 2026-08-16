-- Clients may only edit documents they uploaded
-- Run after 006_documents_meta.sql (needs uploaded_by_user_id)

drop policy if exists "documents_update_own_as_client" on documents;

create policy "documents_update_own_as_client"
  on documents for update
  using (
    uploaded_by_user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    uploaded_by_user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );
