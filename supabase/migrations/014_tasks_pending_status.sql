-- Add pending task status

alter table tasks
  drop constraint if exists tasks_status_check;

alter table tasks
  add constraint tasks_status_check
  check (
    status in (
      'pending',
      'requested',
      'pending_approval',
      'approved',
      'in_progress',
      'completed',
      'rejected',
      'cancelled'
    )
  );
