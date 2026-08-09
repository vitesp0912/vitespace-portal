# Vitespace Portal — Backend Wiring Guide

Step-by-step guide to connect the frontend to Supabase + Cloudflare. Follow after the admin UI and client portal are complete (current phase).

## Stack

| Layer | Technology | Role |
|-------|------------|------|
| Database + Auth | Supabase (Postgres) | Entities, RLS, user auth |
| File storage | Supabase Storage | Documents, invoice PDFs |
| API | Next.js Route Handlers | Webhooks, payment, signed URLs |
| Edge / CDN | Cloudflare | DNS, caching, WAF (production) |
| Payments | Razorpay or Stripe | Invoice pay flow |

## Supabase Schema

Run in Supabase SQL editor. Tables mirror `src/types/index.ts`.

```sql
-- Clients (agency accounts)
create table clients (
  id text primary key,
  name text not null,
  company text not null,
  email text not null,
  avatar text,
  monthly_retainer integer not null default 0,
  status text not null check (status in ('active','paused','completed')),
  project_status text not null check (project_status in ('on_track','at_risk','blocked','completed')),
  project_name text not null,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Link auth users to clients (client portal login)
create table client_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_id text references clients(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  unique(user_id, client_id)
);

-- Admin users (Vitespace team)
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Work items
create table work_items (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  title text not null,
  status text not null,
  project text not null,
  description text,
  stages jsonb,
  current_stage integer,
  progress integer,
  completed_at date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Action items (dashboard "Action Required")
create table action_items (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  title text not null,
  type text not null,
  linked_entity_id text,
  priority text not null default 'normal',
  requested_at timestamptz not null default now()
);

-- Progress areas (overview % bars)
create table progress_areas (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  label text not null,
  value integer not null check (value >= 0 and value <= 100),
  sort_order integer not null default 0
);

-- Change requests
create table change_requests (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  number text not null,
  title text not null,
  description text not null,
  project text not null,
  status text not null,
  requested_by text not null,
  requested_at date not null,
  estimated_hours numeric,
  additional_cost numeric,
  priority text not null default 'normal'
);

-- Approvals
create table approvals (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  title text not null,
  description text not null,
  status text not null,
  items jsonb not null default '[]',
  requested_at date not null,
  due_date date
);

-- Invoices
create table invoices (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  number text not null,
  title text not null,
  amount integer not null,
  issued_at date not null,
  due_at date not null,
  paid_at date,
  status text not null,
  payment_url text,
  pdf_path text
);

-- Documents
create table documents (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  name text not null,
  category text not null,
  uploaded_at date not null,
  size text not null,
  project text,
  storage_path text
);

-- Messages
create table messages (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  sender text not null check (sender in ('client','vitespace')),
  sender_name text not null,
  content text not null,
  timestamp timestamptz not null default now(),
  context text not null,
  context_label text not null,
  context_href text
);

-- Roadmap
create table roadmap_items (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  title text not null,
  category text not null,
  status text not null,
  month text not null
);

-- Notifications
create table notifications (
  id text primary key,
  client_id text references clients(id) on delete cascade not null,
  title text not null,
  message text not null,
  timestamp timestamptz not null default now(),
  read boolean not null default false,
  href text not null
);

-- Indexes
create index idx_work_items_client on work_items(client_id);
create index idx_messages_client on messages(client_id);
create index idx_notifications_client on notifications(client_id);
```

## Row Level Security (RLS)

```sql
alter table clients enable row level security;
-- Repeat for all tables

-- Client users: read own client + related entities
create policy "client_read_own" on clients for select
  using (id in (select client_id from client_users where user_id = auth.uid()));

create policy "client_read_work_items" on work_items for select
  using (client_id in (select client_id from client_users where user_id = auth.uid()));

-- Client users: insert messages (as client), update approvals, insert change_requests
create policy "client_insert_messages" on messages for insert
  with check (
    client_id in (select client_id from client_users where user_id = auth.uid())
    and sender = 'client'
  );

-- Admins: full access
create policy "admin_all" on clients for all
  using (exists (select 1 from admin_users where user_id = auth.uid()));
-- Mirror admin_all policy on each table
```

## Frontend → Backend Mapping

Replace each `portal-store.tsx` method with Supabase calls:

| Store method | Supabase operation |
|--------------|-------------------|
| `addClient` | `insert into clients` |
| `getWorkItemsForClient` | `select * from work_items where client_id = ? order by updated_at desc` |
| `addWorkItem` | `insert into work_items` |
| `submitChangeRequest` | `insert into change_requests` + optional notification insert |
| `respondToApproval` | `update approvals set status = ?` |
| `markInvoicePaid` | `update invoices` (admin) or webhook (payment provider) |
| `addMessage` | `insert into messages` |
| `markNotificationRead` | `update notifications set read = true` |

### Suggested API routes

```
POST   /api/clients/[id]/change-requests     # Client submit
PATCH  /api/approvals/[id]                   # Client respond
POST   /api/clients/[id]/messages            # Client send
GET    /api/documents/[id]/download          # Signed URL
POST   /api/invoices/[id]/pay                # Create payment session
POST   /api/webhooks/razorpay                # Payment confirmation
```

## Storage Buckets

```
documents/{client_id}/{document_id}/{filename}
invoices/{client_id}/{invoice_id}.pdf
uploads/{client_id}/{work_item_id}/{filename}   # Client "Provide" uploads
```

Bucket policy: client users read/write own prefix; admins read/write all.

## Wiring Checklist

### Phase 1 — Read path
- [ ] Create Supabase project, run schema + RLS
- [ ] Seed production clients from `src/lib/seed-data.ts`
- [ ] Add `@supabase/supabase-js` + env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Create `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [ ] Replace `loadState()` with initial fetch in `PortalProvider`
- [ ] Add loading skeletons while fetching

### Phase 2 — Auth
- [ ] Supabase Auth magic link or Google SSO
- [ ] Middleware: `/admin/*` requires `admin_users`; client routes require `client_users`
- [ ] Remove `activeClientId` manual switch — derive from logged-in user
- [ ] Admin preview mode: impersonate client (admin-only)

### Phase 3 — Write path
- [ ] Wire each admin manager to Supabase mutations (optimistic UI optional)
- [ ] Wire client actions: approvals, requests, messages
- [ ] Real-time: Supabase Realtime on `messages` and `notifications`

### Phase 4 — Files & payments
- [ ] Document upload in admin → Supabase Storage
- [ ] Download signed URLs on client Documents page
- [ ] Invoice PDF generation + storage
- [ ] Razorpay/Stripe checkout for "Pay Now"
- [ ] Webhook marks invoice paid, creates notification

### Phase 5 — Production (Cloudflare)
- [ ] Point domain to Cloudflare → Vercel/origin
- [ ] Cache static assets; bypass cache for `/api/*`
- [ ] Rate limit auth and webhook endpoints

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server only — admin ops, webhooks
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Store Removal

Once backend is live:

1. Delete `localStorage` persistence from `portal-store.tsx`
2. Convert store to thin cache layer OR replace with React Query + Supabase
3. Remove `resetToSeed()` from admin (replace with dev-only script)
4. Delete `src/lib/mock-data.ts` if no longer referenced

## Testing Each Entity

For each admin section, verify:

1. Create in admin → appears on client page
2. Edit in admin → client reflects change
3. Delete in admin → removed from client
4. Client action (if applicable) → persists and admin can see result

Use "Preview Portal" on client overview to switch `activeClientId` during development without auth.
