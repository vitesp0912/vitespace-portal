-- Invoices: client owners only (members cannot read billing rows).
-- Admin access remains via admin_all_invoices (004).
-- Invoice notifications stay owners-only via audience='owners' (019) + notifications RLS.

drop policy if exists "invoices_select_own" on invoices;
drop policy if exists "invoices_select_owners" on invoices;

create policy "invoices_select_owners"
  on invoices for select
  using (
    client_id in (
      select client_id
      from client_users
      where user_id = auth.uid()
        and role = 'owner'
    )
  );
