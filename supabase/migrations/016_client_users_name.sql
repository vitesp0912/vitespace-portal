-- Display name for each portal user linked to a client

alter table client_users
  add column if not exists name text;
