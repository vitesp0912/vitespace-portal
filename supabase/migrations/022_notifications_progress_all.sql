-- Progress (tasks) → alerts for all portal users (owners + members).
-- Invoice alerts stay owners-only; progress is visible to everyone on the client.

-- New top-level work item published by Vitespace
create or replace function notify_clients_on_task_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Subtasks stay quiet; client self-created tasks stay quiet
  if new.parent_id is not null then
    return new;
  end if;
  if coalesce(new.created_by, '') <> 'vitespace' then
    return new;
  end if;

  if exists (
    select 1
    from client_users
    where client_id = new.client_id
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
      'n_task_' || new.id,
      new.client_id,
      'client',
      'all',
      'Progress update',
      coalesce(nullif(trim(new.title), ''), 'New work item'),
      '/progress',
      false,
      now()
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_owners_on_task_insert on tasks;
drop trigger if exists trg_notify_clients_on_task_insert on tasks;
create trigger trg_notify_clients_on_task_insert
  after insert on tasks
  for each row
  execute function notify_clients_on_task_insert();

-- Status moved to completed → all portal users (deliverable / shipped)
create or replace function notify_clients_on_task_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_id is not null then
    return new;
  end if;
  if new.status is not distinct from old.status then
    return new;
  end if;
  if new.status <> 'completed' then
    return new;
  end if;

  if exists (
    select 1
    from client_users
    where client_id = new.client_id
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
      'n_task_done_' || new.id,
      new.client_id,
      'client',
      'all',
      'Work completed',
      coalesce(nullif(trim(new.title), ''), 'Work item') || ' is ready',
      '/progress',
      false,
      now()
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_owners_on_task_completed on tasks;
drop trigger if exists trg_notify_clients_on_task_completed on tasks;
create trigger trg_notify_clients_on_task_completed
  after update of status on tasks
  for each row
  execute function notify_clients_on_task_completed();
