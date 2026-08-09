"use client";

import { useClientPortal } from "@/lib/portal-store";
import { formatLongDate, formatRelativeTime, getGreeting } from "@/lib/format";
import { PortalPage } from "@/components/portal/portal-page";
import { ProjectHealth } from "@/components/portal/project-health";
import {
  ProjectSummaryStrip,
  buildSummaryStats,
} from "@/components/portal/project-summary-strip";
import { ActionRequiredPanel } from "@/components/portal/action-required-panel";
import { ProgressOverviewPanel } from "@/components/portal/progress-overview-panel";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { QuickLinks } from "@/components/portal/quick-links";
import { SupportCta } from "@/components/portal/support-cta";

export function OverviewPage() {
  const { client, workStats } = useClientPortal();
  if (!client) return null;

  const summaryStats = buildSummaryStats({
    completedThisMonth: workStats.completedThisMonth || workStats.completed,
    inProgress: workStats.inProgress,
    awaitingClient: workStats.awaitingClient,
    upcoming: workStats.upcoming,
  });

  return (
    <PortalPage className="space-y-8 sm:space-y-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            {getGreeting()}, {client.name} 👋
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Here&apos;s what&apos;s happening with your project.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground/80">
            <span>{formatLongDate()}</span>
            <span className="hidden sm:inline">·</span>
            <span>Last updated {formatRelativeTime(client.lastUpdatedAt)}</span>
          </div>
        </div>
        <div className="w-full lg:w-auto lg:min-w-[280px]">
          <ProjectHealth status={client.projectStatus} />
        </div>
      </header>

      <ProjectSummaryStrip stats={summaryStats} />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div className="space-y-8">
          <ActionRequiredPanel />
          <ProgressOverviewPanel />
          <ActivityFeed />
        </div>
        <div className="space-y-8">
          <QuickLinks />
          <SupportCta />
        </div>
      </div>
    </PortalPage>
  );
}
