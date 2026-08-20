-- Per-thread last-read cursors for unread badges (client + Vitespace admin).
-- Also enable Supabase Realtime on messages.

create table if not exists message_reads (
  client_id text not null references clients (id) on delete cascade,
  thread_user_id uuid not null references auth.users (id) on delete cascade,
  reader text not null check (reader in ('client', 'vitespace')),
  last_read_at timestamptz not null default now(),
  primary key (client_id, thread_user_id, reader)
);

create index if not exists idx_message_reads_lookup
  on message_reads (client_id, reader);

alter table message_reads enable row level security;

-- Portal users: only their own thread read state as "client"
drop policy if exists "message_reads_select_own" on message_reads;
create policy "message_reads_select_own"
  on message_reads for select
  using (
    (
      reader = 'client'
      and thread_user_id = auth.uid()
      and client_id in (select client_id from client_users where user_id = auth.uid())
    )
    or exists (select 1 from admin_users where user_id = auth.uid())
  );

drop policy if exists "message_reads_upsert_own" on message_reads;
create policy "message_reads_insert_own"
  on message_reads for insert
  with check (
    (
      reader = 'client'
      and thread_user_id = auth.uid()
      and client_id in (select client_id from client_users where user_id = auth.uid())
    )
    or (
      reader = 'vitespace'
      and exists (select 1 from admin_users where user_id = auth.uid())
    )
  );

create policy "message_reads_update_own"
  on message_reads for update
  using (
    (
      reader = 'client'
      and thread_user_id = auth.uid()
      and client_id in (select client_id from client_users where user_id = auth.uid())
    )
    or (
      reader = 'vitespace'
      and exists (select 1 from admin_users where user_id = auth.uid())
    )
  )
  with check (
    (
      reader = 'client'
      and thread_user_id = auth.uid()
      and client_id in (select client_id from client_users where user_id = auth.uid())
    )
    or (
      reader = 'vitespace'
      and exists (select 1 from admin_users where user_id = auth.uid())
    )
  );

-- Seed so existing history is not all "unread"
insert into message_reads (client_id, thread_user_id, reader, last_read_at)
select distinct m.client_id, m.user_id, 'client', now()
from messages m
where m.user_id is not null
on conflict do nothing;

insert into message_reads (client_id, thread_user_id, reader, last_read_at)
select distinct m.client_id, m.user_id, 'vitespace', now()
from messages m
where m.user_id is not null
on conflict do nothing;

-- Realtime for live chat (ignore if already added)
do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when duplicate_object then null;
end $$;
