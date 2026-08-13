# Auth setup (Supabase)

## Client portal

1. Run SQL: `001_clients.sql`, `002_seed_client.sql`, `003_core_tables.sql`
2. **Authentication → Users → Add user** (email + password, Auto Confirm on)
3. Link them in `client_users`:

```sql
insert into client_users (user_id, client_id, role)
values ('YOUR_AUTH_USER_UUID', 'test-client', 'owner')
on conflict (user_id, client_id) do nothing;
```

4. Sign in at `/login` → client portal at `/`

## Admin (Vitespace team)

Only **`admin@vitespace.com`** can use the admin portal. Same `/login` page as clients.

1. Run `004_admin_users.sql` (needed for admin RLS on all client data)
2. Create Auth user **`admin@vitespace.com`** (password of your choice, Auto Confirm on)
3. Link admin role:

```sql
insert into admin_users (user_id)
values ('YOUR_ADMIN_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

4. Sign in at **`/login`** with `admin@vitespace.com` → `/admin`

App enforcement: admin routes only accept `admin@vitespace.com`. Other emails are rejected even if present in `admin_users`.

## What clients can see

- Client profile (`clients`)
- Invoices / documents (R2 links when present)
- Messages / notifications
- Tasks (via data layer)
