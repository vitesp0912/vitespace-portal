-- Drop tasks.deadline; keep timeline_start / timeline_end only.
-- Track which auth user created the task.

alter table tasks drop column if exists deadline;

alter table tasks
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_tasks_created_by_user on tasks (created_by_user_id);
