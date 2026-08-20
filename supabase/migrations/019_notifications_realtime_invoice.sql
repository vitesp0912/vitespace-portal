-- Realtime notifications + invoice → owner-only alert trigger.

-- Who should see this client notification: all portal users, or owners only
alter table notifications
  add column if not exists audience text not null default 'all'
    check (audience in ('all', 'owners'));

create index if not exists idx_notifications_audience
  on notifications (client_id, recipient, audience)
  where read = false;

-- Tighten client SELECT/UPDATE: owners-only rows hidden from members
drop policy if exists "notifications_select_own_client" on notifications;
create policy "notifications_select_own_client"
  on notifications for select
  using (
    recipient = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
    and (
      audience = 'all'
      or (
        audience = 'owners'
        and exists (
          select 1
          from client_users cu
          where cu.user_id = auth.uid()
            and cu.client_id = notifications.client_id
            and cu.role = 'owner'
        )
      )
    )
  );

drop policy if exists "notifications_update_own_client" on notifications;
create policy "notifications_update_own_client"
  on notifications for update
  using (
    recipient = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
    and (
      audience = 'all'
      or (
        audience = 'owners'
        and exists (
          select 1
          from client_users cu
          where cu.user_id = auth.uid()
            and cu.client_id = notifications.client_id
            and cu.role = 'owner'
        )
      )
    )
  )
  with check (
    recipient = 'client'
    and client_id in (select client_id from client_users where user_id = auth.uid())
    and (
      audience = 'all'
      or (
        audience = 'owners'
        and exists (
          select 1
          from client_users cu
          where cu.user_id = auth.uid()
            and cu.client_id = notifications.client_id
            and cu.role = 'owner'
        )
      )
    )
  );

-- When a new invoice is added, notify client owners only (SECURITY DEFINER bypasses RLS insert)
create or replace function notify_owners_on_invoice_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only create if this client has at least one owner (still insert one shared row;
  -- RLS + Realtime deliver it only to owners)
  if exists (
    select 1
    from client_users
    where client_id = new.client_id
      and role = 'owner'
  ) then
    insert into notifications (
      id,
      client_id,
      recipient,
      audience,
      title,
      message,
      href,
      read,
      created_at
    ) values (
      'n_inv_' || new.id,
      new.client_id,
      'client',
      'owners',
      'New invoice',
      coalesce(nullif(trim(new.title), ''), 'Invoice') ||
        case
          when nullif(trim(new.number), '') is not null
            then ' · ' || trim(new.number)
          else ''
        end,
      '/invoices',
      false,
      now()
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_owners_on_invoice_insert on invoices;
create trigger trg_notify_owners_on_invoice_insert
  after insert on invoices
  for each row
  execute function notify_owners_on_invoice_insert();

-- Realtime for live bell updates
do $$
begin
  alter publication supabase_realtime add table notifications;
exception
  when duplicate_object then null;
end $$;
