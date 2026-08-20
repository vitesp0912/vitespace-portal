-- Enable Realtime on documents (safe to re-run if 020 already applied without this).

do $$
begin
  alter publication supabase_realtime add table documents;
exception
  when duplicate_object then null;
end $$;
