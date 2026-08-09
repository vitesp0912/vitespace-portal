import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "emerald" | "blue" | "amber" | "muted" | "primary";
  className?: string;
}

const accentStyles = {
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    value: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  muted: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "muted",
  className,
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/[0.03] transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-2 text-2xl font-semibold tabular-nums", styles.value)}>
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              styles.icon
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
