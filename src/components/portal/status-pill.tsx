import { cn } from "@/lib/utils";
import type { TaskStatus, ProjectStatus } from "@/types";
import { WORK_ITEM_STATUS_LABELS } from "@/lib/constants";

const workStatusClass: Record<TaskStatus, string> = {
  pending: "bg-orange-500/10 text-orange-700",
  completed: "bg-emerald-500/10 text-emerald-700",
  in_progress: "bg-indigo-500/10 text-indigo-700",
  approved: "bg-zinc-500/10 text-zinc-600",
  requested: "bg-sky-500/10 text-sky-700",
  pending_approval: "bg-amber-500/10 text-amber-700",
  rejected: "bg-red-500/10 text-red-700",
  cancelled: "bg-zinc-500/10 text-zinc-500",
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
  status: TaskStatus | ProjectStatus;
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

  const taskStatus = status as TaskStatus;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        workStatusClass[taskStatus]
      )}
    >
      {WORK_ITEM_STATUS_LABELS[taskStatus]}
    </span>
  );
}
