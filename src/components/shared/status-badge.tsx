import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string; dot: string }
> = {
  on_track: {
    label: "On Track",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 admin:border-emerald-500/20 admin:bg-emerald-500/10 admin:text-emerald-400",
    dot: "bg-emerald-500",
  },
  at_risk: {
    label: "At Risk",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 admin:border-amber-500/20 admin:bg-amber-500/10 admin:text-amber-400",
    dot: "bg-amber-500",
  },
  blocked: {
    label: "Blocked",
    className:
      "border-red-200 bg-red-50 text-red-800 admin:border-red-500/20 admin:bg-red-500/10 admin:text-red-400",
    dot: "bg-red-500",
  },
  completed: {
    label: "Completed",
    className:
      "border-zinc-200 bg-zinc-100 text-zinc-700 admin:border-zinc-500/20 admin:bg-zinc-500/10 admin:text-zinc-400",
    dot: "bg-zinc-500",
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium",
        config.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
