"use client";

import { useClientPortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

function CircularProgress({ value }: { value: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/80" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="url(#progressGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700 ease-out" />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4c46e8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold tabular-nums tracking-tight">{value}%</span>
      </div>
    </div>
  );
}

export function ProgressOverviewPanel() {
  const { progressAreas, overallProgress } = useClientPortal();

  if (progressAreas.length === 0) return null;

  return (
    <section className="rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 sm:p-6">
      <h2 className="text-[15px] font-semibold tracking-tight">Progress Overview</h2>
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-center gap-5">
          <CircularProgress value={overallProgress} />
          <div className="sm:hidden">
            <p className="text-[13px] text-muted-foreground">Overall Progress</p>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <p className="hidden text-[13px] text-muted-foreground sm:block">Overall Progress</p>
          {progressAreas.map((area) => (
            <div key={area.id}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-medium">{area.label}</span>
                <span className="tabular-nums text-muted-foreground">{area.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full bg-gradient-to-r from-[#4c46e8] to-[#6366f1] transition-all duration-700 ease-out")} style={{ width: `${area.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
