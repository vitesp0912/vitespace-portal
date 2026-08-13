-- Inclusive day count + creator email on tasks

alter table tasks
  add column if not exists created_by_email text;

-- Fix any existing rows where end < start before adding the check
update tasks
set timeline_end = timeline_start
where timeline_start is not null
  and timeline_end is not null
  and timeline_end < timeline_start;

-- days = inclusive calendar days (same start/end = 1)
alter table tasks drop column if exists days;

alter table tasks
  add column days integer
  generated always as (
    case
      when timeline_start is not null and timeline_end is not null
      then (timeline_end - timeline_start) + 1
      else null
    end
  ) stored;

alter table tasks
  drop constraint if exists tasks_timeline_order;

alter table tasks
  add constraint tasks_timeline_order
  check (
    timeline_start is null
    or timeline_end is null
    or timeline_end >= timeline_start
  );
