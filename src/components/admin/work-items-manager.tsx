"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
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
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";
import { TASK_STATUS_ORDER, WORK_ITEM_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { taskInclusiveDays } from "@/lib/tasks";
import type { TaskStatus, WorkItem } from "@/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-orange-500/10 text-orange-700 ring-orange-500/20",
  requested: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
  pending_approval: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  approved: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20",
  in_progress: "bg-brand/10 text-brand ring-brand/20",
  completed: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 ring-red-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20",
};

const DELIVERABLE_LABELS = [
  "View Page",
  "View Property",
  "Open Module",
  "View Inventory",
  "Download Report",
] as const;

interface WorkItemFormState {
  title: string;
  status: TaskStatus;
  serviceId: string;
  description: string;
  timelineStart: string;
  timelineEnd: string;
  deliverableUrl: string;
  deliverableLabel: string;
  deliveredItems: string;
}

const emptyForm = (): WorkItemFormState => ({
  title: "",
  status: "pending",
  serviceId: "",
  description: "",
  timelineStart: "",
  timelineEnd: "",
  deliverableUrl: "",
  deliverableLabel: "View Page",
  deliveredItems: "",
});

interface WorkItemsManagerProps {
  clientId: string;
  clientName: string;
}

export function WorkItemsManager({
  clientId,
  clientName,
}: WorkItemsManagerProps) {
  const { session } = useClientAuth();
  const {
    getWorkItemsForClient,
    getServices,
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
  } = usePortal();

  const items = getWorkItemsForClient(clientId);
  const services = getServices();
  const serviceNameById = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])),
    [services]
  );

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkItem | null>(null);
  const [form, setForm] = useState<WorkItemFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewDays = taskInclusiveDays(form.timelineStart, form.timelineEnd);

  const filteredItems = useMemo(() => {
    const statusRank = Object.fromEntries(
      TASK_STATUS_ORDER.map((s, i) => [s, i])
    ) as Record<TaskStatus, number>;

    return items
      .filter((item) =>
        statusFilter === "all" ? true : item.status === statusFilter
      )
      .filter((item) =>
        serviceFilter === "all" ? true : item.serviceId === serviceFilter
      )
      .sort((a, b) => {
        const rankA = statusRank[a.status] ?? 99;
        const rankB = statusRank[b.status] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return a.title.localeCompare(b.title);
      });
  }, [items, statusFilter, serviceFilter]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      ...emptyForm(),
      serviceId: services[0]?.id ?? "",
    });
    setDialogOpen(true);
  }

  function openEdit(item: WorkItem) {
    setEditing(item);
    setError(null);
    setForm({
      title: item.title,
      status: item.status,
      serviceId: item.serviceId,
      description: item.description ?? "",
      timelineStart: item.timelineStart ?? "",
      timelineEnd: item.timelineEnd ?? "",
      deliverableUrl: item.deliverableUrl ?? "",
      deliverableLabel: item.deliverableLabel ?? "View Page",
      deliveredItems: (item.deliveredItems ?? []).join("\n"),
    });
    setDialogOpen(true);
  }

  function setStartDate(value: string) {
    setForm((prev) => {
      const next = { ...prev, timelineStart: value };
      if (value && prev.timelineEnd && prev.timelineEnd < value) {
        next.timelineEnd = value;
      }
      return next;
    });
  }

  function setEndDate(value: string) {
    setForm((prev) => {
      if (value && prev.timelineStart && value < prev.timelineStart) {
        setError("End date cannot be earlier than the start date.");
        return prev;
      }
      setError(null);
      return { ...prev, timelineEnd: value };
    });
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    if (!form.serviceId) {
      setError("Add a global service on the admin home page first.");
      return;
    }
    if (!session?.userId) {
      setError("You must be signed in to create a task.");
      return;
    }
    if (
      form.timelineStart &&
      form.timelineEnd &&
      form.timelineEnd < form.timelineStart
    ) {
      setError("End date cannot be earlier than the start date.");
      return;
    }

    const deliveredItems = form.deliveredItems
      .split("\n")
      .map((line) => line.replace(/^\s*[-•]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 20);

    let deliverableUrl = form.deliverableUrl.trim();
    if (deliverableUrl && !/^https?:\/\//i.test(deliverableUrl)) {
      deliverableUrl = `https://${deliverableUrl}`;
    }
    if (deliverableUrl.length > 2048) {
      setError("Output URL is too long.");
      return;
    }

    setSaving(true);
    setError(null);

    const createdBy: "client" | "vitespace" = session.isAdmin
      ? "vitespace"
      : "client";
    const payload = {
      title: form.title,
      status: form.status,
      serviceId: form.serviceId,
      description: form.description || undefined,
      timelineStart: form.timelineStart || undefined,
      timelineEnd: form.timelineEnd || undefined,
      deliverableUrl: deliverableUrl || undefined,
      deliverableLabel: form.deliverableLabel.trim() || "View Page",
      deliveredItems,
      createdBy,
      createdByUserId: session.userId,
      createdByEmail: session.email || undefined,
    };

    const result = editing
      ? await updateWorkItem(editing.id, payload)
      : await addWorkItem(clientId, payload);

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
  }

  async function handleStatusChange(item: WorkItem, status: TaskStatus) {
    if (status === item.status) return;
    const result = await updateWorkItem(item.id, { status });
    if (!result.ok) alert(result.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    const result = await deleteWorkItem(id);
    setSaving(false);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    setDialogOpen(false);
    setEditing(null);
  }

  function statusLabel(status: TaskStatus) {
    return WORK_ITEM_STATUS_LABELS[status] ?? status;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-muted-foreground">
          {filteredItems.length}
          {filteredItems.length !== items.length
            ? ` of ${items.length}`
            : ""}{" "}
          task{filteredItems.length !== 1 ? "s" : ""} for {clientName}
          {services.length === 0 && (
            <span className="text-amber-500">
              {" "}
              · Add global services on the admin home page first.
            </span>
          )}
        </p>
        <Button
          onClick={openCreate}
          className="rounded-full self-start sm:self-auto"
          disabled={services.length === 0}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full sm:w-[200px]">
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              v && setStatusFilter(v as TaskStatus | "all")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {statusFilter === "all"
                  ? "All statuses"
                  : WORK_ITEM_STATUS_LABELS[statusFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {TASK_STATUS_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {WORK_ITEM_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[200px]">
          <Select
            value={serviceFilter}
            onValueChange={(v) => v && setServiceFilter(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {serviceFilter === "all"
                  ? "All services"
                  : serviceNameById[serviceFilter] ?? "Service"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-border/80">
        <div className="hidden grid-cols-[minmax(0,1.2fr)_120px_minmax(150px,200px)_72px_160px_80px] gap-3 border-b border-border/60 bg-muted/30 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Title</span>
          <span>Service</span>
          <span>Status</span>
          <span>Days</span>
          <span>Dates</span>
          <span />
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <p className="text-[14px] font-medium text-foreground">No tasks yet</p>
            <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
              Tasks use the schema fields and must link to a service.
            </p>
            <Button
              onClick={openCreate}
              className="mt-4 rounded-full"
              size="sm"
              disabled={services.length === 0}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add first task
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
            No tasks match these filters.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filteredItems.map((item) => {
              const days =
                item.days ??
                taskInclusiveDays(item.timelineStart, item.timelineEnd);
              return (
                <li
                  key={item.id}
                  className="admin-lift group grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/20 lg:grid-cols-[minmax(0,1.2fr)_120px_minmax(150px,200px)_72px_160px_80px] lg:items-center lg:gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium" title={item.title}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    {item.deliverableUrl && (
                      <a
                        href={item.deliverableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                      >
                        {item.deliverableLabel ?? "View Page"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 lg:hidden">
                      <span className="text-[12px] text-muted-foreground">
                        {item.serviceName}
                      </span>
                      <Select
                        value={item.status}
                        onValueChange={(v) =>
                          v && void handleStatusChange(item, v as TaskStatus)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-auto min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-medium ring-1",
                            statusStyles[item.status]
                          )}
                        >
                          <SelectValue>{statusLabel(item.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS_ORDER.map((value) => (
                            <SelectItem key={value} value={value}>
                              {WORK_ITEM_STATUS_LABELS[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {days != null && (
                        <span className="text-[12px] text-muted-foreground">
                          {days} day{days === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="hidden truncate text-[13px] text-muted-foreground lg:block">
                    {item.serviceName}
                  </span>
                  <div className="hidden min-w-0 lg:block">
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        v && void handleStatusChange(item, v as TaskStatus)
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-full min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-medium ring-1",
                          statusStyles[item.status]
                        )}
                      >
                        <SelectValue>{statusLabel(item.status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUS_ORDER.map((value) => (
                          <SelectItem key={value} value={value}>
                            {WORK_ITEM_STATUS_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="hidden text-[13px] tabular-nums text-muted-foreground lg:block">
                    {days != null ? days : "—"}
                  </span>
                  <span className="hidden text-[12px] text-muted-foreground lg:block">
                    {item.timelineStart || item.timelineEnd
                      ? `${item.timelineStart ? formatDate(item.timelineStart) : "—"} → ${item.timelineEnd ? formatDate(item.timelineEnd) : "—"}`
                      : "—"}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        title="Edit"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full text-muted-foreground hover:text-destructive"
                        title="Delete"
                        aria-label="Delete task"
                        disabled={saving}
                        onClick={() => void handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {item.createdByEmail && (
                      <p
                        className="max-w-[140px] truncate text-right text-[10px] text-muted-foreground/80"
                        title={item.createdByEmail}
                      >
                        {item.createdByEmail}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Task" : "Add Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Homepage redesign"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Service</Label>
                <Select
                  value={form.serviceId || null}
                  onValueChange={(v) =>
                    v && setForm({ ...form, serviceId: String(v) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select service">
                      {form.serviceId
                        ? serviceNameById[form.serviceId]
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    v && setForm({ ...form, status: v as TaskStatus })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status">
                      {statusLabel(form.status)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_ORDER.map((value) => (
                      <SelectItem key={value} value={value}>
                        {WORK_ITEM_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-start">Start date</Label>
                <Input
                  id="task-start"
                  type="date"
                  value={form.timelineStart}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-end">End date</Label>
                <Input
                  id="task-end"
                  type="date"
                  min={form.timelineStart || undefined}
                  value={form.timelineEnd}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground">
              Days:{" "}
              <span
                className={
                  previewDays != null
                    ? "font-medium text-brand"
                    : "font-medium text-muted-foreground"
                }
              >
                {previewDays != null
                  ? `${previewDays} day${previewDays === 1 ? "" : "s"}`
                  : "—"}
              </span>
            </p>

            <div className="grid gap-3 rounded-xl bg-muted/40 p-3 ring-1 ring-border/50">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Proof of work
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="task-output-url">Output URL</Label>
                <Input
                  id="task-output-url"
                  type="url"
                  value={form.deliverableUrl}
                  onChange={(e) =>
                    setForm({ ...form, deliverableUrl: e.target.value })
                  }
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link label</Label>
                <Select
                  value={form.deliverableLabel}
                  onValueChange={(v) =>
                    v && setForm({ ...form, deliverableLabel: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{form.deliverableLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_LABELS.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                    {form.deliverableLabel &&
                      !(DELIVERABLE_LABELS as readonly string[]).includes(
                        form.deliverableLabel
                      ) && (
                        <SelectItem value={form.deliverableLabel}>
                          {form.deliverableLabel}
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-delivered">Work delivered</Label>
                <Textarea
                  id="task-delivered"
                  value={form.deliveredItems}
                  onChange={(e) =>
                    setForm({ ...form, deliveredItems: e.target.value })
                  }
                  rows={4}
                  placeholder={"SEO content structure\nBlog page development\nInternal linking"}
                />
                <p className="text-[11px] text-muted-foreground">
                  One bullet per line. Shown when the client expands the task.
                </p>
              </div>
            </div>

            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={saving}
                onClick={() => void handleDelete(editing.id)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-full"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={!form.title.trim() || !form.serviceId || saving}
                className="rounded-full"
              >
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Add Task"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
