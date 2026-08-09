"use client";

import Link from "next/link";
import { ArrowRight, FileCheck, Sparkles, Globe, PenLine } from "lucide-react";
import { useClientPortal } from "@/lib/portal-store";
import { formatShortRelative } from "@/lib/format";
import { StatusPill } from "./status-pill";
import type { WorkItemStatus } from "@/types";

const activityIcons: Record<WorkItemStatus, typeof FileCheck> = {
  completed: FileCheck,
  in_progress: Sparkles,
  upcoming: PenLine,
  awaiting_client: Globe,
};

export function ActivityFeed() {
  const { workItems } = useClientPortal();
  const activities = workItems.slice(0, 6);

  if (activities.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight">Recent Activity</h2>
        <Link href="/progress" className="group flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-brand">
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="space-y-1">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.status];
          return (
            <li key={activity.id}>
              <div className="group portal-lift flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/40">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug">{activity.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusPill status={activity.status} />
                    <span className="text-[12px] text-muted-foreground">
                      {formatShortRelative(activity.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
