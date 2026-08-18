# Progress deliverable links — backend wiring

Add **proof-of-work links** to tasks so the client Progress page can show actions like **View Page →** instead of only describing work.

## Goal

Each task (deliverable) can optionally expose:

| Field | Purpose |
|-------|---------|
| `deliverable_url` | Public URL the client can open (live page, PDF, module, inventory, etc.) |
| `deliverable_label` | Button text — `View Page`, `View Property`, `Open Module`, … |
| `delivered_items` | JSON array of bullet points for the detail panel audit trail |

---

## 1. Database migration

Run **`supabase/migrations/016_tasks_deliverable_output.sql`** in the Supabase SQL editor (or via CLI).

```sql
alter table tasks
  add column if not exists deliverable_url text,
  add column if not exists deliverable_label text,
  add column if not exists delivered_items jsonb default '[]'::jsonb;

comment on column tasks.deliverable_url is 'Public URL to shipped output (live page, doc, module)';
comment on column tasks.deliverable_label is 'Client CTA label, e.g. View Page';
comment on column tasks.delivered_items is 'Array of strings: work-delivered bullet points';
```

No RLS change needed — same policies as `tasks` SELECT for clients, admin ALL for admins.

---

## 2. TypeScript types

**File:** `src/types/index.ts` — already includes:

```typescript
deliverableUrl?: string;
deliverableLabel?: string;
deliveredItems?: string[];
```

---

## 3. Supabase row mapping

**File:** `src/lib/supabase/data.ts` — in `mapTask()`:

```typescript
deliverableUrl: row.deliverable_url ? String(row.deliverable_url) : undefined,
deliverableLabel: row.deliverable_label ? String(row.deliverable_label) : undefined,
deliveredItems: Array.isArray(row.delivered_items)
  ? (row.delivered_items as string[])
  : undefined,
```

**File:** `src/lib/tasks.ts` — pass through in `taskToWorkItem()`.

---

## 4. Portal store writes

**File:** `src/lib/portal-store.tsx`

In `addWorkItem` / `updateWorkItem` Supabase payloads, include:

```typescript
deliverable_url: input.deliverableUrl || null,
deliverable_label: input.deliverableLabel || null,
delivered_items: input.deliveredItems?.length ? input.deliveredItems : [],
```

Extend `WorkItemInput` with optional `deliverableUrl`, `deliverableLabel`, `deliveredItems`.

---

## 5. Admin UI

**File:** `src/components/admin/work-items-manager.tsx` — wired.

Create/edit dialog includes:

- **Output URL** (optional) — `deliverableUrl`
- **Link label** — `View Page`, `View Property`, `Open Module`, `View Inventory`, `Download Report`
- **Work delivered** — textarea, one bullet per line → `deliveredItems`

The admin task list also shows the output link when set.

---

## 6. Client Progress UI

**File:** `src/components/progress/progress-page.tsx`

- Shows the CTA (**View Page →** or custom label) when `deliverableUrl` is set
- Expanding a row shows description + `deliveredItems`
- Without URL, only expand details appears

---

## 7. Example seed / manual update

```sql
update tasks
set
  deliverable_url = 'https://celesteabode.com/blog/yamuna-expressway-investment',
  deliverable_label = 'View Page',
  delivered_items = '[
    "SEO content structure",
    "Blog page development",
    "Internal linking",
    "Responsive implementation"
  ]'::jsonb
where id = 'YOUR_TASK_ID';
```

---

## 8. Validation rules (recommended)

- `deliverable_url` must be `https://` (or allow relative paths only if you host previews internally)
- Max length: URL 2048, label 64 chars, max 20 delivered_items bullets
- Only admins can set/edit; clients read-only via RLS

---

## 9. Checklist

- [ ] Run migration `016_tasks_deliverable_output.sql` in the Supabase SQL editor
- [x] Update `mapTask` in `data.ts`
- [x] Update `taskToWorkItem` / `workItemToTaskInsert` in `tasks.ts`
- [x] Extend portal-store insert/update payloads
- [x] Add admin form fields in work-items-manager
- [ ] Backfill URLs for completed deliverables
- [ ] Verify Progress page shows links for Celeste Abode tasks

---

## 10. Optional later enhancements

- **Link type enum** (`page` | `document` | `module`) for icon selection
- **Internal preview** via signed R2 URLs (like documents)
- **Analytics** — track client link clicks (PostHog / simple events table)
