-- Notify all client portal users when Vitespace uploads a document.
-- Also enable Realtime on documents so the Documents list updates live.

create or replace function notify_clients_on_vitespace_document_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_label text;
begin
  -- Only admin / Vitespace uploads (not client self-uploads)
  if coalesce(new.uploaded_by, '') <> 'vitespace' then
    return new;
  end if;

  category_label := case coalesce(new.category, '')
    when 'contracts' then 'Contracts'
    when 'invoices' then 'Invoices'
    when 'seo_reports' then 'SEO Reports'
    when 'property_data' then 'Property Data'
    when 'creative_assets' then 'Creative Assets'
    when 'project_documents' then 'Project Documents'
    when 'minutes_of_meeting' then 'Minutes of Meeting'
    when '' then null
    else initcap(replace(new.category, '_', ' '))
  end;

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
    'n_doc_' || new.id,
    new.client_id,
    'client',
    'all',
    'New document',
    coalesce(nullif(trim(new.name), ''), 'Document') ||
      case
        when category_label is not null then ' · ' || category_label
        else ''
      end,
    '/documents',
    false,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_notify_clients_on_vitespace_document_insert on documents;
create trigger trg_notify_clients_on_vitespace_document_insert
  after insert on documents
  for each row
  execute function notify_clients_on_vitespace_document_insert();

-- Live document list (client + admin) via Realtime
do $$
begin
  alter publication supabase_realtime add table documents;
exception
  when duplicate_object then null;
end $$;
