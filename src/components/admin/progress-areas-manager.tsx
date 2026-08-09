"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminClient } from "@/lib/portal-store";
import type { ProgressArea } from "@/types";

export function ProgressAreasManager({ clientId }: { clientId: string }) {
  const { progressAreas, addProgressArea, updateProgressArea, deleteProgressArea } =
    useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProgressArea | null>(null);
  const [form, setForm] = useState({ label: "", value: "0", sortOrder: "0" });

  function openCreate() {
    setEditing(null);
    setForm({ label: "", value: "0", sortOrder: String(progressAreas.length) });
    setOpen(true);
  }

  function openEdit(area: ProgressArea) {
    setEditing(area);
    setForm({ label: area.label, value: String(area.value), sortOrder: String(area.sortOrder) });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.label.trim()) return;
    const payload = {
      label: form.label,
      value: Math.min(100, Math.max(0, Number(form.value) || 0)),
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (editing) updateProgressArea(editing.id, payload);
    else addProgressArea(clientId, payload);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          Shown in client Progress Overview panel on the dashboard.
        </p>
        <Button size="sm" onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Area
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {progressAreas.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-muted-foreground">No progress areas yet.</li>
        ) : (
          progressAreas.map((area) => (
            <li key={area.id} className="group flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-[14px] font-medium">{area.label}</p>
                <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${area.value}%` }} />
                </div>
              </div>
              <span className="text-[14px] tabular-nums font-medium">{area.value}%</span>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(area)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteProgressArea(area.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Progress Area</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Value %</Label><Input type="number" min={0} max={100} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
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
