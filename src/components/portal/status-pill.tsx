import { cn } from "@/lib/utils";
import type { WorkItemStatus, ProjectStatus } from "@/types";

const workStatusConfig: Record<
  WorkItemStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-500/10 text-indigo-700",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-zinc-500/10 text-zinc-600",
  },
  awaiting_client: {
    label: "Awaiting You",
    className: "bg-amber-500/10 text-amber-700",
  },
};

const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; className: string; dot: string }
> = {
  on_track: {
    label: "On Track",
    className: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  at_risk: {
    label: "At Risk",
    className: "text-amber-700",
    dot: "bg-amber-500",
  },
  blocked: {
    label: "Blocked",
    className: "text-red-700",
    dot: "bg-red-500",
  },
  completed: {
    label: "Completed",
    className: "text-zinc-600",
    dot: "bg-zinc-400",
  },
};

export function StatusPill({
  status,
  variant = "work",
}: {
  status: WorkItemStatus | ProjectStatus;
  variant?: "work" | "project";
}) {
  if (variant === "project") {
    const config = projectStatusConfig[status as ProjectStatus];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[12px] font-medium",
          config.className
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
        {config.label}
      </span>
    );
  }

  const config = workStatusConfig[status as WorkItemStatus];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
