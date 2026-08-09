import { CheckCircle2, Loader2, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryStat {
  value: number;
  label: string;
  sublabel: string;
  icon: typeof CheckCircle2;
}

export function ProjectSummaryStrip({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="vitespace-gradient relative overflow-hidden rounded-2xl px-6 py-6 text-white portal-shadow sm:px-8 sm:py-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />

      <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "relative",
                i > 0 &&
                  "sm:border-l sm:border-white/15 sm:pl-6 max-sm:[&:nth-child(odd)]:border-r max-sm:[&:nth-child(odd)]:border-white/10 max-sm:[&:nth-child(-n+2)]:border-b max-sm:[&:nth-child(-n+2)]:border-white/10 max-sm:[&:nth-child(-n+2)]:pb-6"
              )}
            >
              <div className="mb-3 flex items-center gap-2 opacity-80">
                <Icon className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {stat.sublabel}
                </span>
              </div>
              <p className="text-[36px] font-semibold leading-none tracking-tight tabular-nums sm:text-[40px]">
                {stat.value}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-white/75">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildSummaryStats(stats: {
  completedThisMonth: number;
  inProgress: number;
  awaitingClient: number;
  upcoming: number;
}): SummaryStat[] {
  return [
    {
      value: stats.completedThisMonth,
      label: "Completed",
      sublabel: "This Month",
      icon: CheckCircle2,
    },
    {
      value: stats.inProgress,
      label: "In Progress",
      sublabel: "Active Work",
      icon: Loader2,
    },
    {
      value: stats.awaitingClient,
      label: "Awaiting You",
      sublabel: "Action Required",
      icon: Clock,
    },
    {
      value: stats.upcoming,
      label: "Upcoming",
      sublabel: "Planned Work",
      icon: CalendarDays,
    },
  ];
}
