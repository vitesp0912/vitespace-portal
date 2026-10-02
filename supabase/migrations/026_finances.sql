-- Internal finances: accounts (with stored balance) and transactions.
-- Admin only. Balance changes only through the transaction trigger.
-- Run after 004_admin_users.sql.

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  id text primary key,
  name text not null,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounts_name on accounts (name);

-- ---------------------------------------------------------------------------
-- Transactions (incoming / outgoing, each tied to one account)
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id text primary key,
  account_id text not null references accounts (id) on delete restrict,
  direction text not null check (direction in ('incoming', 'outgoing')),
  amount integer not null check (amount > 0),
  description text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_account on transactions (account_id);
create index if not exists idx_transactions_occurred on transactions (occurred_at desc);
create index if not exists idx_transactions_direction on transactions (direction);

-- ---------------------------------------------------------------------------
-- Keep accounts.balance in sync with transactions
-- ---------------------------------------------------------------------------
create or replace function protect_account_balance()
returns trigger
language plpgsql
as $$
begin
  if new.balance is distinct from old.balance
     and current_setting('vitespace.finance_balance_write', true) is distinct from 'on' then
    raise exception 'Account balance changes only through transactions';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists accounts_protect_balance on accounts;
create trigger accounts_protect_balance
  before update on accounts
  for each row
  execute function protect_account_balance();

create or replace function sync_account_balance_from_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer;
begin
  perform set_config('vitespace.finance_balance_write', 'on', true);

  if tg_op = 'UPDATE' or tg_op = 'DELETE' then
    delta := case
      when old.direction = 'incoming' then -old.amount
      else old.amount
    end;
    update accounts
    set balance = balance + delta
    where id = old.account_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  delta := case
    when new.direction = 'incoming' then new.amount
    else -new.amount
  end;
  update accounts
  set balance = balance + delta
  where id = new.account_id;

  return new;
end;
$$;

drop trigger if exists transactions_sync_account_balance on transactions;
create trigger transactions_sync_account_balance
  after insert or update or delete on transactions
  for each row
  execute function sync_account_balance_from_transaction();

-- ---------------------------------------------------------------------------
-- RLS: Vitespace admins only (same admin_users check as other internal tables)
-- ---------------------------------------------------------------------------
alter table accounts enable row level security;
alter table transactions enable row level security;

drop policy if exists "admin_all_accounts" on accounts;
create policy "admin_all_accounts"
  on accounts for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

drop policy if exists "admin_all_transactions" on transactions;
create policy "admin_all_transactions"
  on transactions for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
