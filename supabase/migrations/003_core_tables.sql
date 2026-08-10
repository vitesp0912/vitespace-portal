-- Core portal tables (run after 001_clients.sql)
-- tasks (+ subtasks), invoices, documents, messages, notifications
-- service on tasks is free-form text (not an enum / lookup table)

-- ---------------------------------------------------------------------------
-- Tasks (optional parent_id = subtask)
-- ---------------------------------------------------------------------------
create table if not exists tasks (
  id text primary key,
  client_id text not null references clients (id) on delete cascade,
  service text not null,
  parent_id text references tasks (id) on delete cascade,
  title text not null,
  description text,
  status text not null check (
    status in (
      'requested',
      'pending_approval',
      'approved',
      'in_progress',
      'completed',
      'rejected',
      'cancelled'
    )
  ),
  created_by text not null check (created_by in ('client', 'vitespace')),
  deadline date,
  timeline_start date,
  timeline_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_parent_not_self check (parent_id is null or parent_id <> id)
);

create index if not exists idx_tasks_client on tasks (client_id);
create index if not exists idx_tasks_service on tasks (service);
create index if not exists idx_tasks_parent on tasks (parent_id);
create index if not exists idx_tasks_status on tasks (status);

-- ---------------------------------------------------------------------------
-- Invoices (file stored on Cloudflare R2; we keep the URL)
-- ---------------------------------------------------------------------------
create table if not exists invoices (
  id text primary key,
  client_id text not null references clients (id) on delete cascade,
  number text not null,
  title text not null,
  amount integer not null default 0,
  status text not null check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  issued_at date not null default current_date,
  due_at date,
  file_name text,
  file_url text,
  file_size text,
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, number)
);

create index if not exists idx_invoices_client on invoices (client_id);

-- ---------------------------------------------------------------------------
-- Documents (same Cloudflare pattern as invoices)
-- ---------------------------------------------------------------------------
create table if not exists documents (
  id text primary key,
  client_id text not null references clients (id) on delete cascade,
  name text not null,
  description text,
  category text,
  file_url text not null,
  file_size text,
  mime_type text,
  uploaded_by text not null default 'vitespace'
    check (uploaded_by in ('client', 'vitespace')),
  uploaded_by_user_id uuid references auth.users (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_client on documents (client_id);

-- ---------------------------------------------------------------------------
-- Messages (in-app only for now; email later)
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id text primary key,
  client_id text not null references clients (id) on delete cascade,
  sender text not null check (sender in ('client', 'vitespace')),
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists idx_messages_client on messages (client_id);
create index if not exists idx_messages_created on messages (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications (in-app; email later)
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id text primary key,
  client_id text not null references clients (id) on delete cascade,
  recipient text not null check (recipient in ('client', 'vitespace')),
  title text not null,
  message text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_client on notifications (client_id);
create index if not exists idx_notifications_unread
  on notifications (client_id, recipient, read)
  where read = false;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table tasks enable row level security;
alter table invoices enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- Helper pattern: user belongs to client
-- Tasks
create policy "tasks_select_own"
  on tasks for select
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy "tasks_insert_own_as_client"
  on tasks for insert
  with check (
    created_by = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- Invoices / documents: client read-only
create policy "invoices_select_own"
  on invoices for select
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy "documents_select_own"
  on documents for select
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy "documents_update_own_as_client"
  on documents for update
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- Messages: read own thread; client can send as client
create policy "messages_select_own"
  on messages for select
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy "messages_insert_own_as_client"
  on messages for insert
  with check (
    sender = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

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

-- Notifications: client sees recipient = client; can mark read
create policy "notifications_select_own_client"
  on notifications for select
  using (
    recipient = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy "notifications_update_own_client"
  on notifications for update
  using (
    recipient = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  )
  with check (
    recipient = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- Note: Vitespace admin writes (create tasks, upload invoices/docs, reply messages)
-- should use the service role key from Next.js server code (bypasses RLS),
-- or add an admin_users table + policies later.
