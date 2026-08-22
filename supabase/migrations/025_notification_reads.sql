-- Per-user last-read cursor for client bell notifications (mirrors message_reads).
-- Shared notifications rows stay; each portal user has their own last_read_at.

create table if not exists notification_reads (
  client_id text not null references clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create index if not exists idx_notification_reads_user
  on notification_reads (user_id);

alter table notification_reads enable row level security;

drop policy if exists "notification_reads_select_own" on notification_reads;
create policy "notification_reads_select_own"
  on notification_reads for select
  using (
    user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

drop policy if exists "notification_reads_insert_own" on notification_reads;
create policy "notification_reads_insert_own"
  on notification_reads for insert
  with check (
    user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

drop policy if exists "notification_reads_update_own" on notification_reads;
create policy "notification_reads_update_own"
  on notification_reads for update
  using (
    user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- Admins can inspect / manage read cursors if needed
drop policy if exists "admin_all_notification_reads" on notification_reads;
create policy "admin_all_notification_reads"
  on notification_reads for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- Existing users: don't flood the bell with historical alerts
insert into notification_reads (client_id, user_id, last_read_at)
select cu.client_id, cu.user_id, now()
from client_users cu
on conflict do nothing;

-- Live multi-tab badge updates (optional; app also patches locally)
do $$
begin
  alter publication supabase_realtime add table notification_reads;
exception
  when duplicate_object then null;
end $$;
