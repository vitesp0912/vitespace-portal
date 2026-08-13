-- Uploader email for display (mirrors tasks.created_by_email)

alter table documents
  add column if not exists uploaded_by_email text;
