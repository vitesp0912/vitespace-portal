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
import { ACTION_ITEM_TYPE_LABELS } from "@/lib/constants";
import { getActionItemHref } from "@/lib/action-item-utils";
import type { ActionItem } from "@/types";
import Link from "next/link";

export function ActionItemsManager({ clientId }: { clientId: string }) {
  const { actionItems, addActionItem, updateActionItem, deleteActionItem } =
    useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ActionItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "approval" as ActionItem["type"],
    priority: "normal" as ActionItem["priority"],
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", type: "approval", priority: "normal" });
    setOpen(true);
  }

  function openEdit(item: ActionItem) {
    setEditing(item);
    setForm({ title: item.title, type: item.type, priority: item.priority });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    if (editing) updateActionItem(editing.id, form);
    else addActionItem(clientId, form);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          Shown in the client &quot;Action Required&quot; panel on the dashboard.
        </p>
        <Button size="sm" onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Action
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {actionItems.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-muted-foreground">No action items.</li>
        ) : (
          actionItems.map((item) => (
            <li key={item.id} className="group flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[14px] font-medium">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {ACTION_ITEM_TYPE_LABELS[item.type]} · {item.priority} priority · links to{" "}
                  <Link href={getActionItemHref(item)} className="text-brand hover:underline">
                    {getActionItemHref(item)}
                  </Link>
                </p>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteActionItem(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Action Item</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as ActionItem["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_ITEM_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => v && setForm({ ...form, priority: v as ActionItem["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
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
