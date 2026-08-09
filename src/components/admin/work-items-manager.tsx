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
import { usePortal } from "@/lib/portal-store";
import {
  PROJECT_OPTIONS,
  WORK_ITEM_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { WorkItem, WorkItemStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<WorkItemStatus, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  in_progress: "bg-brand/10 text-brand ring-brand/20",
  upcoming: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  awaiting_client: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
};

interface WorkItemFormState {
  title: string;
  status: WorkItemStatus;
  project: string;
  description: string;
  dueDate: string;
  progress: string;
}

const emptyForm = (): WorkItemFormState => ({
  title: "",
  status: "in_progress",
  project: "Website",
  description: "",
  dueDate: "",
  progress: "",
});

interface WorkItemsManagerProps {
  clientId: string;
  clientName: string;
}

export function WorkItemsManager({
  clientId,
  clientName,
}: WorkItemsManagerProps) {
  const {
    getWorkItemsForClient,
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
  } = usePortal();

  const items = getWorkItemsForClient(clientId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkItem | null>(null);
  const [form, setForm] = useState<WorkItemFormState>(emptyForm());

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(item: WorkItem) {
    setEditing(item);
    setForm({
      title: item.title,
      status: item.status,
      project: item.project,
      description: item.description ?? "",
      dueDate: item.dueDate ?? "",
      progress: item.progress?.toString() ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      status: form.status,
      project: form.project,
      description: form.description || undefined,
      dueDate: form.dueDate || undefined,
      progress: form.progress ? Number(form.progress) : undefined,
    };

    if (editing) {
      updateWorkItem(editing.id, payload);
    } else {
      addWorkItem(clientId, payload);
    }

    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
  }

  function handleDelete(id: string) {
    if (confirm("Delete this work item? This cannot be undone.")) {
      deleteWorkItem(id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} visible to{" "}
          {clientName}
        </p>
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Work Item
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-border/80">
        {/* Header row */}
        <div className="hidden grid-cols-[1fr_120px_130px_100px_72px] gap-4 border-b border-border/60 bg-muted/30 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Title</span>
          <span>Project</span>
          <span>Status</span>
          <span>Due</span>
          <span />
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <p className="text-[14px] font-medium text-foreground">
              No work items yet
            </p>
            <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
              Add progress items to show {clientName} what&apos;s happening.
            </p>
            <Button onClick={openCreate} className="mt-4 rounded-full" size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add first item
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => (
              <li
                key={item.id}
                className="admin-lift group grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/20 sm:grid-cols-[1fr_120px_130px_100px_72px] sm:items-center sm:gap-4"
              >
                <div>
                  <p className="text-[14px] font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  {/* Mobile-only meta */}
                  <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                    <span className="text-[12px] text-muted-foreground">
                      {item.project}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                        statusStyles[item.status]
                      )}
                    >
                      {WORK_ITEM_STATUS_LABELS[item.status]}
                    </span>
                  </div>
                </div>
                <span className="hidden text-[13px] text-muted-foreground sm:block">
                  {item.project}
                </span>
                <span className="hidden sm:block">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                      statusStyles[item.status]
                    )}
                  >
                    {WORK_ITEM_STATUS_LABELS[item.status]}
                  </span>
                </span>
                <span className="hidden text-[13px] text-muted-foreground sm:block">
                  {item.dueDate ? formatDate(item.dueDate) : "—"}
                </span>
                <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Work Item" : "Add Work Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="wi-title">Title</Label>
              <Input
                id="wi-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Forest Walk Villa page"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    v && setForm({ ...form, status: v as WorkItemStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORK_ITEM_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select
                  value={form.project}
                  onValueChange={(v) => v && setForm({ ...form, project: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wi-desc">Description (optional)</Label>
              <Textarea
                id="wi-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                placeholder="Client-facing notes"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wi-due">Due date</Label>
                <Input
                  id="wi-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wi-progress">Progress %</Label>
                <Input
                  id="wi-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) =>
                    setForm({ ...form, progress: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.title.trim()} className="rounded-full">
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
