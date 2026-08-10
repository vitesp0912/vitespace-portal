-- Document captions, mime type, and uploader user id
-- Run after 003_core_tables.sql

alter table documents
  add column if not exists description text;

alter table documents
  add column if not exists mime_type text;

alter table documents
  add column if not exists uploaded_by_user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_documents_uploader
  on documents (uploaded_by_user_id);
