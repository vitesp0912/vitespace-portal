import { StatusPill } from "./status-pill";
import type { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

const healthCopy: Record<
  ProjectStatus,
  { title: string; subtitle: string }
> = {
  on_track: {
    title: "On Track",
    subtitle: "All systems running smoothly",
  },
  at_risk: {
    title: "Needs Attention",
    subtitle: "A few items require follow-up",
  },
  blocked: {
    title: "Blocked",
    subtitle: "Work is paused pending resolution",
  },
  completed: {
    title: "Completed",
    subtitle: "This engagement is wrapped up",
  },
};

export function ProjectHealth({ status }: { status: ProjectStatus }) {
  const copy = healthCopy[status];

  return (
    <div className="portal-lift rounded-2xl bg-surface px-5 py-4 portal-shadow ring-1 ring-border/50">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Project Health
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            status === "on_track" && "bg-emerald-500/10",
            status === "at_risk" && "bg-amber-500/10",
            status === "blocked" && "bg-red-500/10",
            status === "completed" && "bg-zinc-500/10"
          )}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              status === "on_track" && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
              status === "at_risk" && "bg-amber-500",
              status === "blocked" && "bg-red-500",
              status === "completed" && "bg-zinc-400"
            )}
          />
        </div>
        <div>
          <StatusPill status={status} variant="project" />
          <p className="mt-1 text-[12px] text-muted-foreground">{copy.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
