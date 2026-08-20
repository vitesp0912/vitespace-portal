# Portal schema (current)

Tables after the slim redesign. Run in order:

1. `supabase/migrations/001_clients.sql`
2. `supabase/migrations/002_seed_client.sql` (optional seed client)
3. `supabase/migrations/003_core_tables.sql`
4. `supabase/migrations/004_admin_users.sql` (admin RLS)
5. `supabase/migrations/009_services.sql` (global services + tasks.service_id)
6. `supabase/migrations/010_services_global.sql` (only if you already ran an older per-client 009)
7. `supabase/migrations/011_tasks_timeline_creator.sql` (drop deadline; add created_by_user_id)
8. `supabase/migrations/012_tasks_days_creator_email.sql` (days + created_by_email)
9. `supabase/migrations/013_documents_uploader_email.sql` (uploaded_by_email)
10. `supabase/migrations/014_tasks_pending_status.sql` (pending status)
11. `supabase/migrations/015_documents_update_own_upload.sql` (client can only edit own uploads)
12. `supabase/migrations/016_client_users_name.sql` (portal user display name)
13. `supabase/migrations/017_messages_user_thread.sql` (per-user DM threads)


Auth sessions: use built-in Supabase Auth — no custom sessions table.

---

## Tables

### `clients` / `client_users`

See `docs/client-fields.md`.

### `services`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `name` | text | Yes | Global unique free-text label |
| `created_at` | timestamptz | Yes | |

Global catalog (not per client). Managed on the **admin home** page. Assign any service to tasks for any client.

Run `009_services.sql` (and `010_services_global.sql` if you already had per-client services).

### `tasks`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `service_id` | text | Yes | → `services.id` (global) |
| `parent_id` | text | No | → `tasks.id` (subtask). Null = top-level |
| `title` | text | Yes | |
| `description` | text | No | |
| `status` | text | Yes | See below |
| `created_by` | text | Yes | `client` \| `vitespace` (auto from logged-in role) |
| `created_by_user_id` | uuid | No | → `auth.users.id` of creator |
| `created_by_email` | text | No | Creator email (display) |
| `timeline_start` | date | No | Start date |
| `timeline_end` | date | No | End date (≥ start) |
| `days` | integer | No | Generated: inclusive days (same day = 1) |
| `created_at` | timestamptz | Yes | |
| `updated_at` | timestamptz | Yes | |

**Status:** `pending` · `in_progress` · `requested` · `pending_approval` · `approved` · `completed` · `rejected` · `cancelled`

Run `014_tasks_pending_status.sql` to allow `pending`.

Client-created work = `created_by = 'client'` (often `status = 'requested'`).

Run `011_tasks_timeline_creator.sql` to drop `deadline` and add `created_by_user_id`.

### `invoices`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `number` | text | Yes | Unique per client |
| `title` | text | Yes | |
| `amount` | integer | Yes | Default 0 |
| `status` | text | Yes | `pending` · `paid` · `overdue` · `cancelled` |
| `issued_at` | date | Yes | |
| `due_at` | date | No | |
| `file_name` | text | No | Original filename |
| `file_url` | text | No | Cloudflare R2 (or public) URL |
| `file_size` | text | No | e.g. `245 KB` |
| `uploaded_at` | timestamptz | No | |
| `created_at` | timestamptz | Yes | |

Admin uploads to R2, then saves `file_url`. Client downloads via that link.

### `documents`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `name` | text | Yes | Display title |
| `description` | text | No | Optional note / caption |
| `category` | text | No | Free text for now |
| `file_url` | text | Yes | Cloudflare URL |
| `file_size` | text | No | |
| `mime_type` | text | No | Used for image/video preview |
| `uploaded_by` | text | Yes | `client` \| `vitespace` (default vitespace) |
| `uploaded_by_user_id` | uuid | No | → `auth.users.id` who uploaded |
| `uploaded_by_email` | text | No | Uploader email (display) |
| `uploaded_at` | timestamptz | Yes | |
| `edited_at` | timestamptz | No | Set when title is edited |
| `created_at` | timestamptz | Yes | |

Run `013_documents_uploader_email.sql` for `uploaded_by_email`.
Run `015_documents_update_own_upload.sql` so clients can only update files they uploaded (admins still have full access).

### `messages`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `user_id` | uuid | No* | → `auth.users.id` — portal user who owns this DM thread (*required for new messages) |
| `sender` | text | Yes | `client` \| `vitespace` |
| `sender_name` | text | Yes | |
| `content` | text | Yes | |
| `created_at` | timestamptz | Yes | |
| `edited_at` | timestamptz | No | Set when the sender edits the message |

Each portal user has their own thread with Vitespace. Client RLS: `user_id = auth.uid()`. Vitespace replies use the **same** `user_id` as that portal user. Run `017_messages_user_thread.sql`.

Email (Resend) deferred — in-app only.

### `notifications`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `recipient` | text | Yes | `client` \| `vitespace` |
| `title` | text | Yes | |
| `message` | text | Yes | |
| `href` | text | No | Deep link in portal |
| `read` | boolean | Yes | Default false |
| `created_at` | timestamptz | Yes | |

On new message: insert a notification for the other side (`recipient`).

---

## Cloudflare R2 (env)

Put these in `.env.local` (see `.env.example`):

| Variable | What it is |
|----------|------------|
| `CLOUDFLARE_ACCOUNT_ID` | R2 → account id |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Bucket name (one bucket is fine) |
| `R2_PUBLIC_BASE_URL` | Public URL for downloads (custom domain or `*.r2.dev`) |

### Object key layout

R2 has **no real folders** — prefixes appear when the first object is uploaded. We never mkdir.

```
{clients.company}/invoices/{original-filename}
{clients.company}/documents/{original-filename}
```

Example: `Celeste Abode/invoices/INV-2026-019.pdf`

Upload API: `POST /api/clients/[id]/upload` (admin UI uses this).
Same key again = overwrite that file (not a new folder).
