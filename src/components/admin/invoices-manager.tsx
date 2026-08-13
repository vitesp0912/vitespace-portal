"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, Loader2, ExternalLink } from "lucide-react";
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
import { useAdminClient, usePortal } from "@/lib/portal-store";
import { INVOICE_STATUS_LABELS, formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/types";

export function InvoicesManager({ clientId }: { clientId: string }) {
  const { getClient } = usePortal();
  const { invoices, addInvoice, updateInvoice, deleteInvoice, markInvoicePaid } =
    useAdminClient(clientId);
  const client = getClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
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
    setFile(null);
    setError(null);
    setForm({
      number: "",
      title: "",
      amount: "",
      issuedAt: new Date().toISOString().split("T")[0],
      dueAt: "",
      status: "pending",
    });
    setOpen(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setFile(null);
    setError(null);
    setForm({
      number: inv.number,
      title: inv.title,
      amount: String(inv.amount),
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
      status: inv.status,
    });
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.number.trim() || !form.title.trim()) return;
    setError(null);

    // Edit metadata only (optional new file upload replaces R2 object + DB row)
    if (editing && !file) {
      updateInvoice(editing.id, {
        number: form.number,
        title: form.title,
        amount: Number(form.amount) || 0,
        issuedAt: form.issuedAt,
        dueAt: form.dueAt,
        status: form.status,
      });
      setOpen(false);
      return;
    }

    if (!file) {
      setError("Choose an invoice file to upload.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.set("kind", "invoices");
      body.set("file", file);
      body.set("number", form.number.trim());
      body.set("title", form.title.trim());
      body.set("amount", String(Number(form.amount) || 0));
      body.set("issuedAt", form.issuedAt);
      body.set("dueAt", form.dueAt);
      body.set("status", form.status);
      if (client?.company) body.set("company", client.company);

      const res = await fetch(`/api/clients/${clientId}/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const local = data.local as {
        id: string;
        number: string;
        title: string;
        amount: number;
        issuedAt: string;
        dueAt: string;
        status: InvoiceStatus;
        fileUrl?: string;
        fileName?: string;
        fileSize?: string;
      };

      if (editing) {
        // Upload upserts by invoice number — prefer API id so local matches DB
        if (local.id !== editing.id) {
          deleteInvoice(editing.id);
        }
        addInvoice(clientId, {
          id: local.id,
          number: local.number,
          title: local.title,
          amount: local.amount,
          issuedAt: local.issuedAt,
          dueAt: local.dueAt || "",
          status: local.status,
          fileUrl: local.fileUrl,
          fileName: local.fileName,
          fileSize: local.fileSize,
        });
      } else {
        addInvoice(clientId, {
          id: local.id,
          number: local.number,
          title: local.title,
          amount: local.amount,
          issuedAt: local.issuedAt,
          dueAt: local.dueAt || "",
          status: local.status,
          fileUrl: local.fileUrl,
          fileName: local.fileName,
          fileSize: local.fileSize,
        });
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Invoice
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {invoices.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-muted-foreground">
            No invoices yet.
          </li>
        ) : (
          invoices.map((inv) => (
          <li
            key={inv.id}
            className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <span className="font-mono text-[11px] text-muted-foreground">{inv.number}</span>
              <p className="text-[14px] font-medium">{inv.title}</p>
              <p className="mt-0.5 text-[18px] font-semibold tabular-nums">
                {formatCurrency(inv.amount)}
              </p>
              <p className="mt-1 truncate text-[12px] text-muted-foreground">
                {INVOICE_STATUS_LABELS[inv.status]} · Issued {formatDate(inv.issuedAt)} · Due{" "}
                {formatDate(inv.dueAt)}
                {inv.fileName ? ` · ${inv.fileName}` : ""}
              </p>
            </div>
            <div className="flex gap-1">
              {inv.fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    window.open(inv.fileUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  File
                </Button>
              )}
              {inv.status !== "paid" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => markInvoicePaid(inv.id)}
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Mark Paid
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => openEdit(inv)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => deleteInvoice(inv.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
          ))
        )}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] overflow-x-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 max-w-full gap-4 overflow-x-hidden py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Invoice #</Label>
                <Input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="INV-2026-019"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (INR)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="September 2026"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Issued</Label>
                <Input
                  type="date"
                  value={form.issuedAt}
                  onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due</Label>
                <Input
                  type="date"
                  value={form.dueAt}
                  onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v && setForm({ ...form, status: v as InvoiceStatus })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {INVOICE_STATUS_LABELS[form.status]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVOICE_STATUS_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="min-w-0 max-w-full space-y-1.5 overflow-hidden">
              <Label>Invoice file {!editing && "(required)"}</Label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                id="invoice-file-input"
                disabled={uploading}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={uploading}
                onClick={() =>
                  document.getElementById("invoice-file-input")?.click()
                }
              >
                Choose file
              </Button>
              <p
                className="max-w-full overflow-hidden break-all text-[13px] text-muted-foreground"
                title={file?.name}
              >
                {file
                  ? file.name
                  : editing?.fileName
                    ? `Current: ${editing.fileName}`
                    : "No file chosen"}
              </p>
            </div>
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} className="rounded-full" disabled={uploading}>
              {uploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Upload & Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
