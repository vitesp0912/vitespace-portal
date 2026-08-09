import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AdminMetricProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "default" | "brand" | "amber" | "emerald";
  className?: string;
}

const accents = {
  default: "text-foreground",
  brand: "text-brand",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
};

export function AdminMetric({
  label,
  value,
  icon: Icon,
  accent = "default",
  className,
}: AdminMetricProps) {
  return (
    <div
      className={cn(
        "admin-surface admin-lift px-5 py-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-[28px] font-semibold tabular-nums tracking-tight",
              accents[accent]
            )}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
