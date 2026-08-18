"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  LayoutGrid,
  PieChart,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FitLabel, FILTER_SELECT_TRIGGER } from "@/components/ui/fit-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO, format, isValid } from "date-fns";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { ROADMAP_STATUS_LABELS, WORK_ITEM_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RoadmapItem, TaskStatus, WorkItem } from "@/types";

type DisplayBucket = "completed" | "in_progress" | "pending" | "blocked";

const STATUS_FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: WORK_ITEM_STATUS_LABELS.completed },
  { value: "in_progress", label: WORK_ITEM_STATUS_LABELS.in_progress },
  { value: "pending", label: WORK_ITEM_STATUS_LABELS.pending },
  { value: "requested", label: WORK_ITEM_STATUS_LABELS.requested },
  { value: "pending_approval", label: WORK_ITEM_STATUS_LABELS.pending_approval },
  { value: "approved", label: WORK_ITEM_STATUS_LABELS.approved },
  { value: "rejected", label: WORK_ITEM_STATUS_LABELS.rejected },
  { value: "cancelled", label: WORK_ITEM_STATUS_LABELS.cancelled },
];

const BUCKET_META: Record<
  DisplayBucket,
  {
    label: string;
    icon: typeof CheckCircle2;
    tone: string;
    bg: string;
    iconBg: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "text-emerald-700",
    bg: "bg-emerald-50 ring-emerald-200/60",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    tone: "text-indigo-700",
    bg: "bg-indigo-50 ring-indigo-200/60",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  pending: {
    label: "Pending",
    icon: PieChart,
    tone: "text-amber-700",
    bg: "bg-amber-50 ring-amber-200/60",
    iconBg: "bg-amber-100 text-amber-600",
  },
  blocked: {
    label: "Blocked",
    icon: AlertCircle,
    tone: "text-red-700",
    bg: "bg-red-50 ring-red-200/60",
    iconBg: "bg-red-100 text-red-600",
  },
};

function parseWorkDate(value?: string) {
  if (!value) return null;
  const iso = value.includes("T") ? value : `${value}T00:00:00`;
  const date = parseISO(iso);
  return isValid(date) ? date : null;
}

function monthKeyFromDate(date: Date) {
  return format(date, "yyyy-MM");
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

function itemMonthDate(item: WorkItem) {
  return (
    parseWorkDate(item.timelineStart) ??
    parseWorkDate(item.timelineEnd) ??
    parseWorkDate(item.createdAt)
  );
}

function groupItemsByMonth(items: WorkItem[]) {
  const groups = new Map<string, WorkItem[]>();
  const undated: WorkItem[] = [];

  for (const item of items) {
    const date = itemMonthDate(item);
    if (!date) {
      undated.push(item);
      continue;
    }
    const key = monthKeyFromDate(date);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const months = [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, monthItems]) => ({
      key,
      label: monthLabelFromKey(key),
      items: monthItems.sort((a, b) => {
        const aTime = itemMonthDate(a)?.getTime() ?? 0;
        const bTime = itemMonthDate(b)?.getTime() ?? 0;
        return bTime - aTime;
      }),
    }));

  return { months, undated };
}

function statusBucket(status: TaskStatus): DisplayBucket {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  if (status === "rejected" || status === "cancelled") return "blocked";
  return "pending";
}

function monthStats(items: WorkItem[]) {
  const stats = { completed: 0, in_progress: 0, pending: 0, blocked: 0 };
  for (const item of items) {
    stats[statusBucket(item.status)] += 1;
  }
  return stats;
}

function compactDateRange(item: WorkItem) {
  const start = parseWorkDate(item.timelineStart);
  const end = parseWorkDate(item.timelineEnd);
  if (start && end) {
    const days =
      item.days ??
      Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
      );
    return {
      label: `${format(start, "MMM dd")} → ${format(end, "MMM dd")}`,
      days,
    };
  }
  if (end) return { label: format(end, "MMM dd"), days: item.days };
  if (start) return { label: format(start, "MMM dd"), days: item.days };
  return null;
}

function ProgressFilters({
  serviceFilter,
  setServiceFilter,
  serviceOptions,
  statusFilter,
  setStatusFilter,
  selectedMonthKey,
  setSelectedMonthKey,
  monthPages,
  filtersActive,
  onReset,
}: {
  serviceFilter: string;
  setServiceFilter: (v: string) => void;
  serviceOptions: { id: string; name: string }[];
  statusFilter: TaskStatus | "all";
  setStatusFilter: (v: TaskStatus | "all") => void;
  selectedMonthKey: string;
  setSelectedMonthKey: (v: string) => void;
  monthPages: { key: string; label: string }[];
  filtersActive: boolean;
  onReset: () => void;
}) {
  const serviceLabel =
    serviceFilter === "all"
      ? "All Services"
      : serviceOptions.find((s) => s.id === serviceFilter)?.name ??
        "All Services";
  const statusLabel =
    STATUS_FILTERS.find((o) => o.value === statusFilter)?.label ??
    "All Statuses";
  const monthLabel =
    monthPages.find((g) => g.key === selectedMonthKey)?.label ??
    monthPages[0]?.label ??
    "";

  return (
    <div className="relative flex w-full flex-col items-end gap-2 lg:w-auto lg:gap-0">
      {filtersActive && (
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground lg:absolute lg:right-0 lg:bottom-[calc(100%+8px)]"
        >
          Reset filters
        </button>
      )}
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end sm:gap-2">
      <Select
        value={serviceFilter}
        onValueChange={(v) => v && setServiceFilter(v)}
      >
        <SelectTrigger className={FILTER_SELECT_TRIGGER}>
          <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue>
            <FitLabel>{serviceLabel}</FitLabel>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          <SelectItem value="all">All Services</SelectItem>
          {serviceOptions.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusFilter}
        onValueChange={(v) => v && setStatusFilter(v as TaskStatus | "all")}
      >
        <SelectTrigger className={FILTER_SELECT_TRIGGER}>
          <PieChart className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue>
            <FitLabel>{statusLabel}</FitLabel>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          {STATUS_FILTERS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedMonthKey}
        onValueChange={(v) => v && setSelectedMonthKey(v)}
      >
        <SelectTrigger className={FILTER_SELECT_TRIGGER}>
          <Calendar className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue>
            <FitLabel>{monthLabel}</FitLabel>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          {monthPages.map((group) => (
            <SelectItem key={group.key} value={group.key}>
              {group.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>
    </div>
  );
}

export function ProgressPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const validInitial =
    STATUS_FILTERS.some((f) => f.value === initialTab) && initialTab
      ? (initialTab as TaskStatus | "all")
      : "all";

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(validInitial);
  const [serviceFilter, setServiceFilter] = useState("all");
  const currentMonthKey = format(new Date(), "yyyy-MM");
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  const { workItems, roadmapItems, services } = useClientPortal();

  const serviceOptions = useMemo(() => {
    const fromItems = new Set(
      workItems.map((i) => i.serviceId).filter(Boolean)
    );
    return services
      .filter((s) => fromItems.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [workItems, services]);

  const filtered = useMemo(
    () =>
      workItems.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (serviceFilter !== "all" && item.serviceId !== serviceFilter)
          return false;
        return true;
      }),
    [workItems, statusFilter, serviceFilter]
  );

  const { months, undated } = useMemo(
    () => groupItemsByMonth(filtered),
    [filtered]
  );

  const monthPages = useMemo(() => {
    const pages = [...months];
    const ensureKeys = [currentMonthKey, selectedMonthKey].filter(
      (key) => key && key !== "unscheduled"
    );
    for (const key of ensureKeys) {
      if (!pages.some((g) => g.key === key)) {
        pages.push({
          key,
          label: monthLabelFromKey(key),
          items: [],
        });
      }
    }
    pages.sort((a, b) => b.key.localeCompare(a.key));
    if (undated.length > 0) {
      pages.push({
        key: "unscheduled",
        label: "Unscheduled",
        items: undated,
      });
    }
    return pages;
  }, [months, undated, currentMonthKey, selectedMonthKey]);

  const page = Math.max(
    0,
    monthPages.findIndex((g) => g.key === selectedMonthKey)
  );
  const currentGroup = monthPages[page] ?? monthPages[0];
  const prevGroup = page > 0 ? monthPages[page - 1] : null;
  const nextGroup =
    page < monthPages.length - 1 ? monthPages[page + 1] : null;

  const roadmapByMonth = useMemo(() => {
    const seen: string[] = [];
    for (const item of roadmapItems) {
      if (!seen.includes(item.month)) seen.push(item.month);
    }
    return seen.map((month) => ({
      month,
      items: roadmapItems.filter((item) => item.month === month),
    }));
  }, [roadmapItems]);

  const filtersActive =
    statusFilter !== "all" ||
    serviceFilter !== "all" ||
    selectedMonthKey !== currentMonthKey;

  return (
    <PortalPage className="space-y-6">
      <div className="space-y-6">
        <PortalSectionHeader
          title="Progress"
          description="Your work, month by month — what shipped, what's moving, and what's next."
          className="lg:items-center"
          action={
            <ProgressFilters
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              serviceOptions={serviceOptions}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              selectedMonthKey={selectedMonthKey}
              setSelectedMonthKey={setSelectedMonthKey}
              monthPages={monthPages}
              filtersActive={filtersActive}
              onReset={() => {
                setStatusFilter("all");
                setServiceFilter("all");
                setSelectedMonthKey(currentMonthKey);
              }}
            />
          }
        />
      </div>

      {statusFilter === "pending_approval" && filtered.length > 0 && (
        <div className="rounded-xl bg-amber-50/80 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200/60">
          These items are waiting on approval before work continues.
        </div>
      )}

      {!currentGroup ? (
        <div className="rounded-2xl bg-surface px-5 py-16 text-center portal-shadow ring-1 ring-border/50">
          <p className="text-[14px] font-medium">Nothing in this view yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Work items will appear here as they are planned and delivered.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <MonthSummaryCard
            label={currentGroup.label}
            isCurrent={currentGroup.key === currentMonthKey}
            items={currentGroup.items}
          />

          <DeliverablesList items={currentGroup.items} />

          {monthPages.length > 1 && (
            <nav
              className="grid grid-cols-2 items-center gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3"
              aria-label="Month navigation"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 justify-center rounded-xl px-4 text-sm sm:min-w-[120px] sm:justify-self-start"
                disabled={!prevGroup}
                onClick={() => {
                  if (prevGroup) setSelectedMonthKey(prevGroup.key);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="col-span-2 order-first sm:col-span-1 sm:order-none sm:justify-self-center">
                <Select
                  value={currentGroup.key}
                  onValueChange={(v) => {
                    if (v) setSelectedMonthKey(v);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      FILTER_SELECT_TRIGGER,
                      "sm:w-[180px] sm:min-w-[180px] sm:max-w-[180px]"
                    )}
                  >
                    <Calendar className="size-4 shrink-0 text-muted-foreground" />
                    <SelectValue>
                      <FitLabel>{currentGroup.label}</FitLabel>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="center" alignItemWithTrigger={false}>
                    {monthPages.map((group) => (
                      <SelectItem key={group.key} value={group.key}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 justify-center rounded-xl px-4 text-sm sm:min-w-[120px] sm:justify-self-end"
                disabled={!nextGroup}
                onClick={() => {
                  if (nextGroup) setSelectedMonthKey(nextGroup.key);
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </div>
      )}

      {roadmapByMonth.length > 0 && (
        <section className="pt-2">
          <div className="mb-5">
            <h2 className="text-[18px] font-semibold tracking-tight">Roadmap</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Planned work is directional — not a contractual commitment.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {roadmapByMonth.map((group) => (
              <div
                key={group.month}
                className="rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50"
              >
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {group.month}
                </p>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <RoadmapRow key={item.id} item={item} />
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

function MonthSummaryCard({
  label,
  items,
  isCurrent = false,
}: {
  label: string;
  items: WorkItem[];
  isCurrent?: boolean;
}) {
  const stats = monthStats(items);
  const total = items.length;
  const pct = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  return (
    <section className="rounded-2xl bg-surface px-5 py-5 portal-shadow ring-1 ring-border/50 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[22px] font-semibold tracking-tight sm:text-[24px]">
                {label}
              </h2>
              {isCurrent && (
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  This month
                </span>
              )}
            </div>
            <p className="mt-1 text-[14px] font-medium">
              <span className="text-foreground">{total} Deliverable{total === 1 ? "" : "s"}</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-brand">{pct}% Completed</span>
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:flex-1 sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-5 lg:justify-end lg:pl-8">
          {(Object.keys(BUCKET_META) as DisplayBucket[]).map((key) => {
            const meta = BUCKET_META[key];
            const Icon = meta.icon;
            const count = stats[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    meta.iconBg
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[20px] font-semibold tabular-nums leading-none">
                    {count}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {meta.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const DELIVERABLE_GRID =
  "md:grid-cols-[minmax(0,1fr)_120px_150px_120px_128px_32px]";

function DeliverablesList({ items }: { items: WorkItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="overflow-hidden rounded-2xl bg-surface portal-shadow ring-1 ring-border/50">
      <div
        className={cn(
          "hidden gap-3 border-b border-border/40 px-5 py-2.5 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground md:grid md:gap-x-6 md:px-6",
          DELIVERABLE_GRID
        )}
      >
        <span className="text-left sm:pr-6">Deliverable</span>
        <span>Service</span>
        <span>Duration</span>
        <span>Status</span>
        <span>Action</span>
        <span />
      </div>

      <ul className="divide-y divide-border/40">
        {items.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-muted-foreground">
            No deliverables in this month.
          </li>
        ) : (
          items.map((item) => (
            <DeliverableRow
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
            />
          ))
        )}
      </ul>
    </section>
  );
}

function DeliverableRow({
  item,
  open,
  onToggle,
}: {
  item: WorkItem;
  open: boolean;
  onToggle: () => void;
}) {
  const bucket = statusBucket(item.status);
  const meta = BUCKET_META[bucket];
  const StatusIcon = meta.icon;
  const range = compactDateRange(item);
  const linkLabel = item.deliverableLabel ?? "View Page";
  const hasDetails =
    Boolean(item.description) || Boolean(item.deliveredItems?.length);

  return (
    <li className="group">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={open}
        className="cursor-pointer bg-surface text-left hover:bg-muted/10"
      >
        <div className="flex items-start gap-3 px-4 py-3.5 md:hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-snug">{item.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                  meta.bg,
                  meta.tone
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {meta.label}
              </span>
              {item.serviceName && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.serviceName}
                </span>
              )}
            </div>
            {range && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                {range.label}
                {range.days
                  ? ` · ${range.days} day${range.days === 1 ? "" : "s"}`
                  : ""}
              </p>
            )}
            {item.deliverableUrl && (
              <a
                href={item.deliverableUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-3 h-8 rounded-lg text-[12px]",
                })}
              >
                {linkLabel}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>

        <div
          className={cn(
            "hidden w-full gap-3 px-6 py-3 md:grid md:items-center md:gap-x-6",
            DELIVERABLE_GRID
          )}
        >
          <div className="flex min-w-0 items-center gap-3 text-left sm:pr-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <p className="min-w-0 text-[13px] font-semibold leading-snug">
              {item.title}
            </p>
          </div>

          <div className="flex items-center justify-center">
            {item.serviceName ? (
              <span className="text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.serviceName}
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex items-center justify-center">
            {range ? (
              <div className="text-left text-[12px] text-muted-foreground">
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0 opacity-60" />
                  <span>{range.label}</span>
                </p>
                {range.days ? (
                  <p className="mt-0.5 text-center tabular-nums">
                    {range.days} day{range.days === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
            ) : (
              <span className="text-[12px] text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex items-center justify-center">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-left text-[11px] font-semibold ring-1",
                meta.bg,
                meta.tone
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {meta.label}
            </span>
          </div>

          <div className="flex h-8 w-full items-center justify-center">
            {item.deliverableUrl ? (
              <a
                href={item.deliverableUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "h-8 max-w-full rounded-lg px-2 text-left text-[12px] whitespace-nowrap",
                })}
              >
                <span className="truncate">{linkLabel}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-[12px] text-muted-foreground">—</span>
            )}
          </div>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="w-full bg-muted px-4 py-3.5 sm:px-6">
            {hasDetails ? (
              <div className="mx-auto w-full max-w-[960px] space-y-3">
                {item.description && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
                      {item.description}
                    </p>
                  </div>
                )}

                {item.deliveredItems && item.deliveredItems.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Work delivered
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {item.deliveredItems.map((line) => (
                        <li
                          key={line}
                          className="flex gap-2 text-[13px] text-foreground/80"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No additional details for this deliverable.
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function RoadmapRow({ item }: { item: RoadmapItem }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-snug">{item.title}</p>
        <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
          {item.category}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-muted/80 px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
        {ROADMAP_STATUS_LABELS[item.status]}
      </span>
    </li>
  );
}
