"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { APPROVAL_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Approval, ApprovalStatus } from "@/types";

export function ApprovalsManager({ clientId }: { clientId: string }) {
  const { approvals, addApproval, updateApproval, deleteApproval } = useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Approval | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending" as ApprovalStatus,
    items: "",
    dueDate: "",
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", status: "pending", items: "", dueDate: "" });
    setOpen(true);
  }

  function openEdit(ap: Approval) {
    setEditing(ap);
    setForm({
      title: ap.title,
      description: ap.description,
      status: ap.status,
      items: ap.items.join("\n"),
      dueDate: ap.dueDate ?? "",
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      items: form.items.split("\n").map((s) => s.trim()).filter(Boolean),
      dueDate: form.dueDate || undefined,
    };
    if (editing) updateApproval(editing.id, payload);
    else addApproval(clientId, payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{approvals.length} approval(s) for client review.</p>
        <Button onClick={openCreate} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Approval</Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {approvals.map((ap) => (
          <li key={ap.id} className="group flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">{APPROVAL_STATUS_LABELS[ap.status]}</span>
              <p className="mt-1 text-[14px] font-medium">{ap.title}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{ap.description}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {ap.items.length} items · Requested {formatDate(ap.requestedAt)}
                {ap.dueDate && ` · Due ${formatDate(ap.dueDate)}`}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(ap)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteApproval(ap.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Approval</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Checklist Items (one per line)</Label><Textarea value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} rows={4} placeholder="Item 1&#10;Item 2" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v as ApprovalStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(APPROVAL_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
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
