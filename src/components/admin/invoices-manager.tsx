"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminClient } from "@/lib/portal-store";
import { INVOICE_STATUS_LABELS, formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/types";

export function InvoicesManager({ clientId }: { clientId: string }) {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, markInvoicePaid } =
    useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    number: "",
    title: "",
    amount: "",
    issuedAt: new Date().toISOString().split("T")[0],
    dueAt: "",
    status: "pending" as InvoiceStatus,
  });

  function openCreate() {
    setEditing(null);
    setForm({ number: "", title: "", amount: "", issuedAt: new Date().toISOString().split("T")[0], dueAt: "", status: "pending" });
    setOpen(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setForm({ number: inv.number, title: inv.title, amount: String(inv.amount), issuedAt: inv.issuedAt, dueAt: inv.dueAt, status: inv.status });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.number.trim() || !form.title.trim()) return;
    const payload = {
      number: form.number,
      title: form.title,
      amount: Number(form.amount) || 0,
      issuedAt: form.issuedAt,
      dueAt: form.dueAt,
      status: form.status,
    };
    if (editing) updateInvoice(editing.id, payload);
    else addInvoice(clientId, payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{invoices.length} invoice(s) visible to client.</p>
        <Button onClick={openCreate} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Invoice</Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {invoices.map((inv) => (
          <li key={inv.id} className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-[11px] text-muted-foreground">{inv.number}</span>
              <p className="text-[14px] font-medium">{inv.title}</p>
              <p className="mt-0.5 text-[18px] font-semibold tabular-nums">{formatCurrency(inv.amount)}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {INVOICE_STATUS_LABELS[inv.status]} · Issued {formatDate(inv.issuedAt)} · Due {formatDate(inv.dueAt)}
              </p>
            </div>
            <div className="flex gap-1">
              {inv.status !== "paid" && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => markInvoicePaid(inv.id)}>
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />Mark Paid
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteInvoice(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Invoice #</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="INV-2026-019" /></div>
              <div className="space-y-1.5"><Label>Amount (INR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="September 2026" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Issued</Label><Input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Due</Label><Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v as InvoiceStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(INVOICE_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-full">{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
