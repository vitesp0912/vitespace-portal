# Client portal auth (Supabase)

Admin / Vitespace role is deferred. For now only client users can sign in.

## SQL needed

1. `001_clients.sql`
2. `002_seed_client.sql` — creates `test-client` / Test Company  
3. `003_core_tables.sql` — invoices, documents, messages, notifications, tasks  

`004_admin_users.sql` is **optional** for now (skip unless you need admin later).

## Link a client user

1. **Authentication → Users → Add user** (email + password, Auto Confirm on)  
2. Copy the User UID  
3. Run:

```sql
insert into client_users (user_id, client_id, role)
values ('YOUR_AUTH_USER_UUID', 'test-client', 'owner')
on conflict (user_id, client_id) do nothing;
```

4. Sign in at `/login` → client portal at `/`

## What the client can see (from DB)

- Client profile (`clients`)
- Invoices / documents (with R2 download links when present)
- Messages / notifications
- Tasks (loaded in data layer; UI pages for old “work items” may still look empty)

Use Supabase Table Editor or SQL to insert sample invoices/documents/messages for `test-client` while admin UI is on hold.
