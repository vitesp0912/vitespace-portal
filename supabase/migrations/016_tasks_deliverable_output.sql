-- Proof-of-work links on tasks (Progress page "View Page →")
alter table tasks
  add column if not exists deliverable_url text,
  add column if not exists deliverable_label text,
  add column if not exists delivered_items jsonb not null default '[]'::jsonb;

comment on column tasks.deliverable_url is 'Public URL to shipped output';
comment on column tasks.deliverable_label is 'Client CTA label e.g. View Page';
comment on column tasks.delivered_items is 'JSON array of work-delivered bullet strings';
