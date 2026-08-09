"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@/types";

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "Pending Review", className: "bg-amber-500/10 text-amber-700" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-700" },
  changes_requested: { label: "Changes Requested", className: "bg-orange-500/10 text-orange-700" },
};

export function ApprovalsPage() {
  const { approvals, respondToApproval } = useClientPortal();
  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Approvals"
        description="Review and approve plans, designs, and deliverables from Vitespace."
      />

      {pending.length > 0 && (
        <div className="rounded-xl bg-amber-50/60 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200/50">
          {pending.length} approval{pending.length > 1 ? "s" : ""} waiting for your review.
        </div>
      )}

      <ul className="space-y-4">
        {approvals.map((approval) => {
          const config = statusConfig[approval.status];
          return (
            <li
              key={approval.id}
              className={cn(
                "portal-lift rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 sm:p-6",
                approval.status === "pending" && "ring-amber-200/60"
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", config.className)}>
                    {config.label}
                  </span>
                  <h3 className="mt-2 text-[15px] font-semibold">{approval.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">{approval.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {approval.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-4 text-[12px] text-muted-foreground">
                    <span>Requested {formatDate(approval.requestedAt)}</span>
                    {approval.dueDate && <span>Due {formatDate(approval.dueDate)}</span>}
                  </div>
                </div>
                {approval.status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Button size="sm" className="rounded-full" onClick={() => respondToApproval(approval.id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => respondToApproval(approval.id, "changes_requested")}>
                      Request Changes
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </PortalPage>
  );
}
