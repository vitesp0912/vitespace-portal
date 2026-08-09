# Vitespace Portal — Architecture

Frontend-first client operating portal for Vitespace agency clients. All data currently lives in a React Context store persisted to `localStorage`; backend wiring is documented in `backend.md`.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
├──────────────────────────────┬──────────────────────────────────┤
│      Client Portal (/)       │         Admin (/admin)            │
│  Overview, Progress, etc.    │  Per-client CRUD for all entities │
└──────────────┬───────────────┴──────────────────┬───────────────┘
               │                                   │
               └─────────────┬─────────────────────┘
                             ▼
                  ┌─────────────────────┐
                  │   PortalProvider    │
                  │  (portal-store.tsx) │
                  │   localStorage key: │
                  │ vitespace-portal-   │
                  │       state         │
                  └─────────────────────┘
```

## Entity Model

Every entity (except `Client`) is scoped by `clientId`. One client account owns all related records.

| Entity | Admin route | Client route | Purpose |
|--------|-------------|--------------|---------|
| `Client` | `/admin` + Settings | Header, Overview | Account profile, project health |
| `WorkItem` | Work Items | Progress | Deliverables & status tracking |
| `ProgressArea` | Settings | Overview panel | % completion by area |
| `ActionItem` | Settings | Overview panel | Urgent client actions |
| `ChangeRequest` | Requests | Requests | Scope change tracking |
| `Approval` | Approvals | Approvals | Sign-off workflows |
| `Invoice` | Invoices | Invoices | Billing |
| `Document` | Documents | Documents | File library |
| `Message` | Messages | Messages | Context-threaded chat |
| `RoadmapItem` | Roadmap | Progress (bottom) | Directional planning |
| `Notification` | Notifications | Header bell | Alerts |

### Client

```typescript
interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  monthlyRetainer: number;
  status: "active" | "paused" | "completed";
  projectStatus: "on_track" | "at_risk" | "blocked" | "completed";
  projectName: string;
  lastUpdatedAt: string;
}
```

### Relationships

- **WorkItem** → drives Activity Feed (recent items by `updatedAt`)
- **ActionItem** → links to portal pages via `type` (see `lib/action-item-utils.ts`)
- **Message** → grouped by `contextLabel` on Messages page
- **Notification** → `href` points to relevant client page

## Data Flow

### Admin → Client (immediate)

1. Admin edits entity in `/admin/clients/[id]/...`
2. `portal-store` updates state → persists to localStorage
3. Client portal reads same store via `useClientPortal()` filtered by `activeClientId`
4. UI re-renders instantly

### Client actions (local)

| Action | Store method |
|--------|--------------|
| Approve / Request changes | `respondToApproval` |
| Raise change request | `submitChangeRequest` |
| Send message | `addMessage(..., "client")` |
| Mark notification read | `markNotificationRead` |
| Pay / Download / Upload | Stub alert (backend in Phase 2) |

### Active client selection

- `activeClientId` in store determines which client's data the portal shows
- Default: `celeste-abode` (seed data)
- Admin "Preview Portal" sets `activeClientId` and opens `/` in new tab

## Key Files

```
src/
├── types/index.ts           # All entity interfaces
├── lib/
│   ├── seed-data.ts         # Initial seed (single source of truth)
│   ├── portal-store.tsx     # State + CRUD + hooks
│   ├── constants.ts         # Labels, formatCurrency
│   └── action-item-utils.ts # ActionItem → href mapping
├── components/
│   ├── portal/              # Client design system
│   └── admin/               # Admin managers + shell
└── app/
    ├── (client pages)/      # /, /progress, /requests, ...
    └── admin/               # Dashboard + per-client sections
```

## Hooks

| Hook | Scope | Use in |
|------|-------|--------|
| `usePortal()` | Full state + all CRUD | Admin dashboard, shared |
| `useClientPortal()` | `activeClientId` + filtered lists | All client pages |
| `useAdminClient(id)` | Specific client + filtered lists | Admin managers |

## Admin Navigation

Per client (`/admin/clients/[id]/`):

1. **Overview** — metrics + links to all sections
2. **Settings** — profile, progress areas, action items
3. **Work Items** — progress page CRUD
4. **Requests** — change requests
5. **Approvals** — sign-off items
6. **Invoices** — billing records
7. **Documents** — file metadata
8. **Messages** — conversation threads
9. **Roadmap** — planned work
10. **Notifications** — bell alerts

## Migration Path (Store → Supabase)

See `backend.md` for schema and wiring checklist. High-level:

1. Replace `loadState`/`localStorage` with Supabase queries
2. Map each store CRUD method to API route or direct Supabase client call
3. Add RLS: clients see only their `client_id`; admins see all
4. Replace stub alerts (pay, download, upload) with real integrations
5. Add auth (Supabase Auth) — client users linked to `clients.id`

## Design Principles

- **Admin controls everything the client sees** — no hidden mock data
- **Client portal is read-mostly** — except approvals, requests, messages, notifications
- **No Slack/Jira patterns** — context-linked messages, not channels
- **Premium feel** — restrained typography, indigo brand, dark admin shell
