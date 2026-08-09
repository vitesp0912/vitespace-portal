"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
import { useClientPortal } from "@/lib/portal-store";
import { PROJECT_OPTIONS, formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const statusLabels: Record<RequestStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
};

const statusStyles: Record<RequestStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  under_review: "bg-amber-500/10 text-amber-700",
  approved: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-red-500/10 text-red-700",
  in_progress: "bg-indigo-500/10 text-indigo-700",
  completed: "bg-emerald-500/10 text-emerald-700",
};

function NewChangeRequestDialog() {
  const { clientId, submitChangeRequest } = useClientPortal();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("Website");

  function handleSubmit() {
    if (!title.trim()) return;
    submitChangeRequest(clientId, {
      title,
      description,
      project,
      priority: "normal",
    });
    setTitle("");
    setDescription("");
    setProject("Website");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-full" />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Raise Request
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise Change Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What would you like changed?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the change..." />
          </div>
          <div className="space-y-1.5">
            <Label>Related project</Label>
            <Select value={project} onValueChange={(v) => v && setProject(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RequestsPage() {
  const { changeRequests } = useClientPortal();

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Requests"
        description="Submit change requests and track them without scattered messages."
        action={<NewChangeRequestDialog />}
      />

      <ul className="space-y-3">
        {changeRequests.map((cr) => (
          <li key={cr.id} className="portal-lift rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 transition-all hover:portal-shadow-hover sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{cr.number}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusStyles[cr.status])}>
                    {statusLabels[cr.status]}
                  </span>
                  {cr.priority === "high" && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700">High priority</span>
                  )}
                </div>
                <h3 className="mt-2 text-[15px] font-semibold">{cr.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{cr.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                  <span>{cr.project}</span>
                  <span>·</span>
                  <span>{formatDate(cr.requestedAt)}</span>
                </div>
                {cr.estimatedHours && (
                  <p className="mt-3 text-[13px]">
                    <span className="text-muted-foreground">Estimate: </span>
                    {cr.estimatedHours} hrs
                    {cr.additionalCost && (
                      <span className="text-muted-foreground"> · {formatCurrency(cr.additionalCost)} + GST</span>
                    )}
                  </p>
                )}
              </div>
              {cr.status === "under_review" && (
                <Link href="/messages">
                  <Button variant="outline" size="sm" className="shrink-0 rounded-full">Discuss</Button>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </PortalPage>
  );
}
