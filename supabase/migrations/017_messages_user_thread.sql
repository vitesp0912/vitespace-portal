-- Per-portal-user message threads (DM with Vitespace)
-- user_id = auth.users.id of the client portal user who owns the thread
-- (also used on Vitespace replies so they stay in that user's thread)

alter table messages
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_messages_thread
  on messages (client_id, user_id, created_at);

-- Best-effort backfill: assign orphaned rows to the first linked portal user
update messages m
set user_id = (
  select cu.user_id
  from client_users cu
  where cu.client_id = m.client_id
  order by cu.role desc, cu.id
  limit 1
)
where m.user_id is null;

-- Tighten client RLS to own thread only
drop policy if exists "messages_select_own" on messages;
drop policy if exists "messages_insert_own_as_client" on messages;
drop policy if exists "messages_update_own_as_client" on messages;

create policy "messages_select_own"
  on messages for select
  using (
    user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy "messages_insert_own_as_client"
  on messages for insert
  with check (
    sender = 'client'
    and user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

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
