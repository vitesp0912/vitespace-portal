"use client";

import { useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { StatusPill } from "@/components/portal/status-pill";
import { useClientPortal } from "@/lib/portal-store";
import { formatDate } from "@/lib/format";
import type { WorkItemStatus } from "@/types";

const tabs: { value: WorkItemStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_client", label: "Awaiting You" },
  { value: "upcoming", label: "Upcoming" },
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
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-full border border-transparent px-4 py-1.5 text-[13px] data-[state=active]:border-border data-[state=active]:bg-surface data-[state=active]:shadow-sm"
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
          const filtered = tab.value === "all" ? workItems : workItems.filter((i) => i.status === tab.value);

          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.value === "awaiting_client" && filtered.length > 0 && (
                <div className="mb-4 rounded-xl bg-amber-50/80 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200/60">
                  These items need your input before we can continue.
                </div>
              )}

              <ul className="divide-y divide-border/60 rounded-2xl bg-surface ring-1 ring-border/50">
                {filtered.length === 0 ? (
                  <li className="px-5 py-12 text-center text-[13px] text-muted-foreground">Nothing here yet.</li>
                ) : (
                  filtered.map((item) => (
                    <li key={item.id} className="group portal-lift flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium">{item.title}</p>
                        {item.description && <p className="mt-1 text-[13px] text-muted-foreground">{item.description}</p>}
                        {item.progress !== undefined && (
                          <div className="mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#4c46e8] to-[#6366f1] transition-all duration-500" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[12px] text-muted-foreground">{item.project}</span>
                        <StatusPill status={item.status} />
                        {item.dueDate && <span className="hidden text-[12px] text-muted-foreground sm:inline">Due {formatDate(item.dueDate)}</span>}
                        {item.status === "awaiting_client" && (
                          <Button size="xs" variant="outline" className="rounded-full" onClick={() => alert("File upload will connect to Supabase Storage when backend is wired.")}>
                            <Upload className="mr-1 h-3 w-3" />
                            Provide
                          </Button>
                        )}
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
          <p className="mt-1 text-[13px] text-muted-foreground">Planned work is directional — not a contractual commitment.</p>
          <div className="mt-4 space-y-4">
            {[...new Set(roadmapItems.map((r) => r.month))].map((month) => (
              <div key={month} className="rounded-2xl bg-surface p-5 ring-1 ring-border/50">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{month}</p>
                <ul className="mt-3 space-y-2">
                  {roadmapItems.filter((r) => r.month === month).map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-[13px]">
                      <span>{item.title}</span>
                      <span className="text-[11px] capitalize text-muted-foreground">{item.status.replace("_", " ")}</span>
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
