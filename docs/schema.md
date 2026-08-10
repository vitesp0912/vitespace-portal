# Portal schema (current)

Tables after the slim redesign. Run in order:

1. `supabase/migrations/001_clients.sql`
2. `supabase/migrations/002_seed_client.sql` (optional seed client)
3. `supabase/migrations/003_core_tables.sql`

Auth sessions: use built-in Supabase Auth — no custom sessions table.

---

## Tables

### `clients` / `client_users`

See `docs/client-fields.md`.

### `tasks`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `service` | text | Yes | Free-form string, e.g. `Development`, `SEO` (not an enum) |
| `parent_id` | text | No | → `tasks.id` (subtask). Null = top-level |
| `title` | text | Yes | |
| `description` | text | No | |
| `status` | text | Yes | See below |
| `created_by` | text | Yes | `client` \| `vitespace` |
| `deadline` | date | No | |
| `timeline_start` | date | No | |
| `timeline_end` | date | No | |
| `created_at` | timestamptz | Yes | |
| `updated_at` | timestamptz | Yes | |

**Status:** `requested` · `pending_approval` · `approved` · `in_progress` · `completed` · `rejected` · `cancelled`

Client-created work = `created_by = 'client'` (often `status = 'requested'`).

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
| `uploaded_at` | timestamptz | Yes | |
| `edited_at` | timestamptz | No | Set when title is edited |
| `created_at` | timestamptz | Yes | |

### `messages`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | Yes | PK |
| `client_id` | text | Yes | → `clients.id` |
| `sender` | text | Yes | `client` \| `vitespace` |
| `sender_name` | text | Yes | |
| `content` | text | Yes | |
| `created_at` | timestamptz | Yes | |
| `edited_at` | timestamptz | No | Set when the sender edits the message |

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
