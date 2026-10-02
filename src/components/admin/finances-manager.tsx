"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { AdminMetric } from "@/components/admin/admin-metric";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/constants";
import {
  createFinanceAccount,
  createFinanceTransaction,
  deleteFinanceAccount,
  deleteFinanceTransaction,
  listFinanceAccounts,
  listFinanceTransactions,
  updateFinanceAccount,
  updateFinanceTransaction,
} from "@/lib/finances";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FinanceAccount, FinanceDirection, FinanceTransaction } from "@/types";

type DirectionFilter = "all" | FinanceDirection;

const DIRECTION_LABELS: Record<FinanceDirection, string> = {
  incoming: "Incoming",
  outgoing: "Outgoing",
};

function todayInputValue() {
  return new Date().toISOString().split("T")[0];
}

function parseMoney(raw: string, allowZero: boolean): number | null {
  const trimmed = raw.replace(/,/g, "").trim();
  if (!trimmed) return allowZero ? 0 : null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (allowZero) return rounded;
  if (rounded <= 0) return null;
  return rounded;
}

export function FinancesManager() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DirectionFilter>("all");

  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  const [txnOpen, setTxnOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<FinanceTransaction | null>(null);
  const [txnForm, setTxnForm] = useState({
    accountId: "",
    direction: "incoming" as FinanceDirection,
    amount: "",
    description: "",
    occurredAt: todayInputValue(),
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const [accountsResult, transactionsResult] = await Promise.all([
      listFinanceAccounts(),
      listFinanceTransactions(),
    ]);
    if (!accountsResult.ok) {
      setError(accountsResult.error);
      return;
    }
    if (!transactionsResult.ok) {
      setError(transactionsResult.error);
      return;
    }
    setAccounts(accountsResult.data);
    setTransactions(transactionsResult.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accounts) map.set(account.id, account.name);
    return map;
  }, [accounts]);

  const totals = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    for (const txn of transactions) {
      if (txn.direction === "incoming") incoming += txn.amount;
      else outgoing += txn.amount;
    }
    const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
    return { incoming, outgoing, balance };
  }, [accounts, transactions]);

  const visibleTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((txn) => txn.direction === filter);
  }, [filter, transactions]);

  function openCreateAccount() {
    setEditingAccount(null);
    setAccountName("");
    setOpeningBalance("0");
    setFormError(null);
    setAccountOpen(true);
  }

  function openEditAccount(account: FinanceAccount) {
    setEditingAccount(account);
    setAccountName(account.name);
    setOpeningBalance(String(account.balance));
    setFormError(null);
    setAccountOpen(true);
  }

  function openCreateTransaction() {
    setEditingTxn(null);
    setTxnForm({
      accountId: accounts[0]?.id ?? "",
      direction: "incoming",
      amount: "",
      description: "",
      occurredAt: todayInputValue(),
    });
    setFormError(null);
    setTxnOpen(true);
  }

  function openEditTransaction(txn: FinanceTransaction) {
    setEditingTxn(txn);
    setTxnForm({
      accountId: txn.accountId,
      direction: txn.direction,
      amount: String(txn.amount),
      description: txn.description ?? "",
      occurredAt: txn.occurredAt,
    });
    setFormError(null);
    setTxnOpen(true);
  }

  async function handleSaveAccount() {
    const name = accountName.trim();
    if (!name) {
      setFormError("Account name is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    if (editingAccount) {
      const result = await updateFinanceAccount(editingAccount.id, { name });
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
    } else {
      const balance = parseMoney(openingBalance, true);
      if (balance === null) {
        setSaving(false);
        setFormError("Opening balance must be a number.");
        return;
      }
      const result = await createFinanceAccount({ name, balance });
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
    }

    setAccountOpen(false);
    await reload();
  }

  async function handleDeleteAccount(account: FinanceAccount) {
    if (!confirm(`Delete ${account.name}?`)) return;
    const result = await deleteFinanceAccount(account.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await reload();
  }

  async function handleSaveTransaction() {
    const amount = parseMoney(txnForm.amount, false);
    if (amount === null) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    if (!txnForm.accountId) {
      setFormError("Choose an account.");
      return;
    }
    if (!txnForm.occurredAt) {
      setFormError("Date is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      accountId: txnForm.accountId,
      direction: txnForm.direction,
      amount,
      description: txnForm.description,
      occurredAt: txnForm.occurredAt,
    };

    const result = editingTxn
      ? await updateFinanceTransaction(editingTxn.id, payload)
      : await createFinanceTransaction(payload);

    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setTxnOpen(false);
    await reload();
  }

  async function handleDeleteTransaction(txn: FinanceTransaction) {
    if (!confirm("Delete this transaction? The account balance will be adjusted.")) return;
    const result = await deleteFinanceTransaction(txn.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await reload();
  }

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="Finances"
        description="Internal accounts and the incoming and outgoing transactions posted to them."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={openCreateAccount}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add account
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={openCreateTransaction}
              disabled={accounts.length === 0}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add transaction
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetric
          label="Total balance"
          value={formatCurrency(totals.balance)}
          icon={Wallet}
          accent="brand"
        />
        <AdminMetric
          label="Incoming"
          value={formatCurrency(totals.incoming)}
          icon={ArrowDownLeft}
          accent="emerald"
        />
        <AdminMetric
          label="Outgoing"
          value={formatCurrency(totals.outgoing)}
          icon={ArrowUpRight}
          accent="amber"
        />
      </div>

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      <section className="space-y-4">
        <h2 className="text-[13px] font-semibold text-foreground">Accounts</h2>
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-card px-5 py-12 text-[13px] text-muted-foreground ring-1 ring-border/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading accounts…
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-2xl bg-card px-5 py-12 text-center ring-1 ring-border/80">
            <p className="text-[13px] text-muted-foreground">No accounts yet.</p>
            <div className="mt-4 flex justify-center">
              <Button size="sm" className="rounded-full" onClick={openCreateAccount}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add account
              </Button>
            </div>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="admin-surface flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{account.name}</p>
                    <p className="text-[12px] text-muted-foreground">Current balance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-[16px] font-semibold tabular-nums",
                      account.balance < 0 ? "text-amber-600" : "text-foreground"
                    )}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => openEditAccount(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => void handleDeleteAccount(account)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[13px] font-semibold text-foreground">Transactions</h2>
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {(["all", "incoming", "outgoing"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium capitalize",
                  filter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-card px-5 py-12 text-[13px] text-muted-foreground ring-1 ring-border/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading transactions…
          </div>
        ) : visibleTransactions.length === 0 ? (
          <div className="rounded-2xl bg-card px-5 py-12 text-center ring-1 ring-border/80">
            <p className="text-[13px] text-muted-foreground">
              {transactions.length === 0
                ? "No transactions yet."
                : `No ${filter} transactions.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
            {visibleTransactions.map((txn) => {
              const incoming = txn.direction === "incoming";
              return (
                <li
                  key={txn.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        incoming
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {incoming ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">
                        {txn.description?.trim() || DIRECTION_LABELS[txn.direction]}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {DIRECTION_LABELS[txn.direction]} ·{" "}
                        {accountNameById.get(txn.accountId) ?? "Unknown account"} ·{" "}
                        {formatDate(txn.occurredAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-11 sm:pl-0">
                    <p
                      className={cn(
                        "text-[15px] font-semibold tabular-nums",
                        incoming ? "text-emerald-600" : "text-foreground"
                      )}
                    >
                      {incoming ? "+" : "−"}
                      {formatCurrency(txn.amount)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => openEditTransaction(txn)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => void handleDeleteTransaction(txn)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit account" : "Add account"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. HDFC current"
              />
            </div>
            {editingAccount ? (
              <p className="text-[13px] text-muted-foreground">
                Current balance {formatCurrency(editingAccount.balance)}. Balance
                updates when you add, edit, or delete transactions.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="opening-balance">Opening balance</Label>
                <Input
                  id="opening-balance"
                  inputMode="numeric"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
            {formError && <p className="text-[13px] text-red-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setAccountOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void handleSaveAccount()}
              disabled={saving || !accountName.trim()}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editingAccount ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={txnOpen} onOpenChange={setTxnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTxn ? "Edit transaction" : "Add transaction"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select
                value={txnForm.direction}
                onValueChange={(value) =>
                  value &&
                  setTxnForm((form) => ({
                    ...form,
                    direction: value as FinanceDirection,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{DIRECTION_LABELS[txnForm.direction]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Account</Label>
              <Select
                value={txnForm.accountId}
                onValueChange={(value) =>
                  value && setTxnForm((form) => ({ ...form, accountId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {accountNameById.get(txnForm.accountId) ?? "Choose account"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="txn-amount">Amount</Label>
                <Input
                  id="txn-amount"
                  inputMode="numeric"
                  value={txnForm.amount}
                  onChange={(e) =>
                    setTxnForm((form) => ({ ...form, amount: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="txn-date">Date</Label>
                <Input
                  id="txn-date"
                  type="date"
                  value={txnForm.occurredAt}
                  onChange={(e) =>
                    setTxnForm((form) => ({ ...form, occurredAt: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txn-description">Description</Label>
              <Textarea
                id="txn-description"
                value={txnForm.description}
                onChange={(e) =>
                  setTxnForm((form) => ({ ...form, description: e.target.value }))
                }
                placeholder="Optional note"
              />
            </div>
            {formError && <p className="text-[13px] text-red-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setTxnOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void handleSaveTransaction()}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editingTxn ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
