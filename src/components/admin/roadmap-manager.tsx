"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { ROADMAP_STATUS_LABELS } from "@/lib/constants";
import type { RoadmapItem, RoadmapStatus } from "@/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function RoadmapManager({ clientId }: { clientId: string }) {
  const { roadmapItems, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem } = useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "website" as RoadmapItem["category"],
    status: "planned" as RoadmapStatus,
    month: "August",
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", category: "website", status: "planned", month: "August" });
    setOpen(true);
  }

  function openEdit(item: RoadmapItem) {
    setEditing(item);
    setForm({ title: item.title, category: item.category, status: item.status, month: item.month });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    if (editing) updateRoadmapItem(editing.id, form);
    else addRoadmapItem(clientId, form);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{roadmapItems.length} roadmap item(s) on Progress page.</p>
        <Button onClick={openCreate} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Item</Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {roadmapItems.map((item) => (
          <li key={item.id} className="group flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-[14px] font-medium">{item.title}</p>
              <p className="mt-0.5 text-[12px] capitalize text-muted-foreground">
                {item.month} · {item.category} · {ROADMAP_STATUS_LABELS[item.status]}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteRoadmapItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Roadmap Item</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Month</Label>
                <Select value={form.month} onValueChange={(v) => v && setForm({ ...form, month: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as RoadmapItem["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="website">Website</SelectItem><SelectItem value="seo">SEO</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v as RoadmapStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROADMAP_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
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
