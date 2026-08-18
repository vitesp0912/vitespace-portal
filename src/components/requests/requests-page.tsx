"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { StatusPill } from "@/components/portal/status-pill";
import { useClientAuth } from "@/lib/client-auth";
import { useClientPortal } from "@/lib/portal-store";
import { TASK_STATUS_ORDER, WORK_ITEM_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { TaskStatus } from "@/types";

function NewRequestDialog() {
  const { session } = useClientAuth();
  const { clientId, services, addWorkItem } = useClientPortal();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setServiceId(services[0]?.id ?? "");
    setError(null);
  }

  async function handleSubmit() {
    if (!title.trim() || !clientId || !session?.userId || saving) return;
    if (!serviceId) {
      setError("Select a service for this request.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await addWorkItem(clientId, {
      title: title.trim(),
      description: description.trim() || undefined,
      serviceId,
      status: "requested",
      createdBy: "client",
      createdByUserId: session.userId,
      createdByEmail: session.email || undefined,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    resetForm();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setServiceId(services[0]?.id ?? "");
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            className="w-full rounded-full sm:w-auto"
            disabled={services.length === 0}
          />
        }
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Raise Request
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="req-title">Title</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need?"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-description">Description</Label>
            <Textarea
              id="req-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details for the team…"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select
              value={serviceId}
              onValueChange={(v) => v && setServiceId(v)}
              disabled={saving || services.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service">
                  {services.find((s) => s.id === serviceId)?.name}
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
          {services.length === 0 && (
            <p className="text-[13px] text-amber-600">
              No services available yet. Ask Vitespace to add services first.
            </p>
          )}
          {error && <p className="text-[13px] text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!title.trim() || !serviceId || saving}
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RequestsPage() {
  const { workItems } = useClientPortal();

  const requests = useMemo(() => {
    const statusRank = Object.fromEntries(
      TASK_STATUS_ORDER.map((s, i) => [s, i])
    ) as Record<TaskStatus, number>;

    return workItems
      .filter((item) => item.createdBy === "client")
      .sort((a, b) => {
        const rankA = statusRank[a.status] ?? 99;
        const rankB = statusRank[b.status] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [workItems]);

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Requests"
        description="Raise a request and we’ll track it as a task with the team."
        action={<NewRequestDialog />}
      />

      {requests.length === 0 ? (
        <div className="rounded-2xl bg-surface px-5 py-12 text-center portal-shadow ring-1 ring-border/50">
          <p className="text-[14px] font-medium">No requests yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Use Raise Request to submit something for the team.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((item) => (
            <li
              key={item.id}
              className="portal-lift rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 transition-all hover:portal-shadow-hover sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                <span className="text-[12px] text-muted-foreground">
                  {item.serviceName}
                </span>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold">{item.title}</h3>
              {item.description && (
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                <span>{WORK_ITEM_STATUS_LABELS[item.status]}</span>
                <span>·</span>
                <span>Submitted {formatDate(item.createdAt)}</span>
                {item.createdByEmail && (
                  <>
                    <span>·</span>
                    <span>{item.createdByEmail}</span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalPage>
  );
}
