import { createClient } from "@/lib/supabase/client";
import type {
  FinanceAccount,
  FinanceDirection,
  FinanceTransaction,
} from "@/types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
type EmptyResult = { ok: true } | { ok: false; error: string };

function uid(prefix: string) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function mapAccount(row: {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}): FinanceAccount {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: {
  id: string;
  account_id: string;
  direction: FinanceDirection;
  amount: number;
  description: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}): FinanceTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    direction: row.direction,
    amount: row.amount,
    description: row.description,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFinanceAccounts(): Promise<Result<FinanceAccount[]>> {
  const { data, error } = await createClient()
    .from("accounts")
    .select("*")
    .order("name");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(mapAccount) };
}

export async function listFinanceTransactions(): Promise<
  Result<FinanceTransaction[]>
> {
  const { data, error } = await createClient()
    .from("transactions")
    .select("*")
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(mapTransaction) };
}

export async function createFinanceAccount(input: {
  name: string;
  balance: number;
}): Promise<Result<FinanceAccount>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Account name is required." };

  const now = new Date().toISOString();
  const row = {
    id: uid("acc_"),
    name,
    balance: input.balance,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await createClient()
    .from("accounts")
    .insert(row)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: mapAccount(data) };
}

export async function updateFinanceAccount(
  id: string,
  input: { name: string }
): Promise<EmptyResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Account name is required." };

  const { error } = await createClient()
    .from("accounts")
    .update({ name })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFinanceAccount(id: string): Promise<EmptyResult> {
  const { error } = await createClient().from("accounts").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Remove this account's transactions before deleting it.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function createFinanceTransaction(input: {
  accountId: string;
  direction: FinanceDirection;
  amount: number;
  description: string;
  occurredAt: string;
}): Promise<Result<FinanceTransaction>> {
  if (!input.accountId) return { ok: false, error: "Choose an account." };
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const now = new Date().toISOString();
  const row = {
    id: uid("txn_"),
    account_id: input.accountId,
    direction: input.direction,
    amount: input.amount,
    description: input.description.trim() || null,
    occurred_at: input.occurredAt,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await createClient()
    .from("transactions")
    .insert(row)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: mapTransaction(data) };
}

export async function updateFinanceTransaction(
  id: string,
  input: {
    accountId: string;
    direction: FinanceDirection;
    amount: number;
    description: string;
    occurredAt: string;
  }
): Promise<EmptyResult> {
  if (!input.accountId) return { ok: false, error: "Choose an account." };
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const { error } = await createClient()
    .from("transactions")
    .update({
      account_id: input.accountId,
      direction: input.direction,
      amount: input.amount,
      description: input.description.trim() || null,
      occurred_at: input.occurredAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFinanceTransaction(id: string): Promise<EmptyResult> {
  const { error } = await createClient()
    .from("transactions")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
