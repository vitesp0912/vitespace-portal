# Client Fields (Supabase)

What you need to create and manage a **client** in this portal. Only client-related tables — no work items, invoices, etc.

## Tables involved

| Table | Purpose |
|-------|---------|
| `clients` | The agency client account (company / project profile) |
| `client_users` | Links a Supabase Auth user to a client (portal login) |

---

## 1. `clients`

One row = one client account (e.g. Celeste Abode).

| Column (DB) | TypeScript field | Type | Required | Notes |
|-------------|------------------|------|----------|-------|
| `id` | `id` | `text` | Yes | Primary key. Use a slug like `celeste-abode` |
| `name` | `name` | `text` | Yes | Contact / display name (e.g. `Vaibhav`) |
| `company` | `company` | `text` | Yes | Company name (e.g. `Celeste Abode`) |
| `email` | `email` | `text` | Yes | Primary contact email |
| `avatar` | `avatar` | `text` | No | Avatar URL or path |
| `monthly_retainer` | `monthlyRetainer` | `integer` | Yes | Amount in smallest currency unit (e.g. paise/cents). Default `0` |
| `status` | `status` | `text` | Yes | Account status — see values below |
| `project_status` | `projectStatus` | `text` | Yes | Project health — see values below |
| `project_name` | `projectName` | `text` | Yes | Active project label (e.g. `Website + SEO`) |
| `last_updated_at` | `lastUpdatedAt` | `timestamptz` | Yes | Last meaningful update. Default `now()` |
| `created_at` | — | `timestamptz` | Yes | Row created. Default `now()` (DB-only; not on the TS `Client` type) |

### Allowed values

**`status`** (account)

| Value | Meaning |
|-------|---------|
| `active` | Currently engaged |
| `paused` | Temporarily on hold |
| `completed` | Engagement finished |

**`project_status`** (health)

| Value | Meaning |
|-------|---------|
| `on_track` | Healthy |
| `at_risk` | Needs attention |
| `blocked` | Blocked |
| `completed` | Project done |

### Example row

```json
{
  "id": "celeste-abode",
  "name": "Vaibhav",
  "company": "Celeste Abode",
  "email": "admin@celesteabode.com",
  "avatar": null,
  "monthly_retainer": 47200,
  "status": "active",
  "project_status": "on_track",
  "project_name": "Website + SEO",
  "last_updated_at": "2026-08-09T10:00:00Z"
}
```

### SQL (create table)

```sql
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
```

---

## 2. `client_users`

Needed so someone can log into the **client portal** for that client. Not filled when you only create the company profile — add when you invite a portal user.

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | Yes | Auto-generated primary key |
| `user_id` | `uuid` | Yes | References `auth.users(id)` (Supabase Auth user) |
| `client_id` | `text` | Yes | References `clients(id)` |
| `role` | `text` | Yes | `owner` or `member`. Default `member` |
| `name` | `text` | No | Portal user's display name (shown in client portal) |

Constraint: unique pair `(user_id, client_id)`.

### SQL (create table)

```sql
create table client_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_id text references clients(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  name text,
  unique(user_id, client_id)
);
```

Run `016_client_users_name.sql` if the table already exists without `name`.

---

## Minimum to create a client

When adding a new client in admin, you need at least:

1. `id`
2. `name`
3. `company`
4. `email`
5. `monthly_retainer` (can be `0`)
6. `status` (usually `active`)
7. `project_status` (usually `on_track`)
8. `project_name`

Optional: `avatar`.

Portal login for that client: use **Client Settings → Portal users** (creates/links Auth + `client_users`), or do it manually in Supabase as below.

---

## Source of truth

- TypeScript: `src/types/index.ts` → `Client`
- Seed examples: `src/lib/seed-data.ts` → `INITIAL_CLIENTS`
- Full schema: `backend.md`
