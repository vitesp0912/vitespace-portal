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
import { PROJECT_OPTIONS, REQUEST_STATUS_LABELS, formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { ChangeRequest, RequestStatus } from "@/types";
import { cn } from "@/lib/utils";

export function ChangeRequestsManager({ clientId }: { clientId: string }) {
  const { changeRequests, addChangeRequest, updateChangeRequest, deleteChangeRequest, client } =
    useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChangeRequest | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    project: "Website",
    status: "under_review" as RequestStatus,
    estimatedHours: "",
    additionalCost: "",
    priority: "normal" as "normal" | "high",
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", project: "Website", status: "under_review", estimatedHours: "", additionalCost: "", priority: "normal" });
    setOpen(true);
  }

  function openEdit(cr: ChangeRequest) {
    setEditing(cr);
    setForm({
      title: cr.title,
      description: cr.description,
      project: cr.project,
      status: cr.status,
      estimatedHours: cr.estimatedHours?.toString() ?? "",
      additionalCost: cr.additionalCost?.toString() ?? "",
      priority: cr.priority,
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      description: form.description,
      project: form.project,
      status: form.status,
      requestedBy: client?.name ?? "Client",
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      additionalCost: form.additionalCost ? Number(form.additionalCost) : undefined,
      priority: form.priority,
    };
    if (editing) updateChangeRequest(editing.id, payload);
    else addChangeRequest(clientId, payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{changeRequests.length} change request(s) visible to client.</p>
        <Button onClick={openCreate} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Request</Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {changeRequests.map((cr) => (
          <li key={cr.id} className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-[11px] text-muted-foreground">{cr.number}</span>
              <p className="text-[14px] font-medium">{cr.title}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">{cr.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                <span className={cn("rounded-full px-2 py-0.5 capitalize", "bg-muted")}>{cr.status.replace("_", " ")}</span>
                <span>{cr.project}</span>
                <span>{formatDate(cr.requestedAt)}</span>
                {cr.additionalCost && <span>{formatCurrency(cr.additionalCost)}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(cr)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteChangeRequest(cr.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Change Request</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select value={form.project} onValueChange={(v) => v && setForm({ ...form, project: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v as RequestStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(REQUEST_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Est. Hours</Label><Input type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Cost (INR)</Label><Input type="number" value={form.additionalCost} onChange={(e) => setForm({ ...form, additionalCost: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => v && setForm({ ...form, priority: v as "normal" | "high" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
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
