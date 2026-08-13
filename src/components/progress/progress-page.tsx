"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { StatusPill } from "@/components/portal/status-pill";
import { useClientPortal } from "@/lib/portal-store";
import { formatDate } from "@/lib/format";
import type { TaskStatus } from "@/types";

const tabs: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "requested", label: "Requested" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
];

export function ProgressPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "all";
  const { workItems, roadmapItems } = useClientPortal();

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Progress"
        description="Everything we've delivered, what's active, and what's coming next."
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-full border border-transparent px-4 py-1.5 text-[13px] data-[state-active]:border-border data-[state=active]:border-border data-[state=active]:bg-surface data-[state=active]:shadow-sm"
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1.5 text-muted-foreground">
                  ({workItems.filter((i) => i.status === tab.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => {
          const filtered =
            tab.value === "all"
              ? workItems
              : workItems.filter((i) => i.status === tab.value);

          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.value === "pending_approval" && filtered.length > 0 && (
                <div className="mb-4 rounded-xl bg-amber-50/80 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200/60">
                  These items are waiting on approval before work continues.
                </div>
              )}

              <ul className="divide-y divide-border/60 rounded-2xl bg-surface ring-1 ring-border/50">
                {filtered.length === 0 ? (
                  <li className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                    Nothing here yet.
                  </li>
                ) : (
                  filtered.map((item) => (
                    <li
                      key={item.id}
                      className="group portal-lift flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[12px] text-muted-foreground">
                          {item.serviceName}
                        </span>
                        <StatusPill status={item.status} />
                        {item.timelineEnd ? (
                          <span className="hidden text-[12px] text-muted-foreground sm:inline">
                            {item.timelineStart
                              ? `${formatDate(item.timelineStart)} – ${formatDate(item.timelineEnd)}`
                              : `Until ${formatDate(item.timelineEnd)}`}
                          </span>
                        ) : item.timelineStart ? (
                          <span className="hidden text-[12px] text-muted-foreground sm:inline">
                            From {formatDate(item.timelineStart)}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </TabsContent>
          );
        })}
      </Tabs>

      {roadmapItems.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold">Roadmap</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Planned work is directional — not a contractual commitment.
          </p>
          <div className="mt-4 space-y-4">
            {[...new Set(roadmapItems.map((r) => r.month))].map((month) => (
              <div
                key={month}
                className="rounded-2xl bg-surface p-5 ring-1 ring-border/50"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {month}
                </p>
                <ul className="mt-3 space-y-2">
                  {roadmapItems
                    .filter((r) => r.month === month)
                    .map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span>{item.title}</span>
                        <span className="text-[11px] capitalize text-muted-foreground">
                          {item.status.replace("_", " ")}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </PortalPage>
  );
}
