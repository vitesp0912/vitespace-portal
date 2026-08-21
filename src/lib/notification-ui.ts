import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import type { Notification } from "@/types";

export type NotificationKind =
  | "document"
  | "invoice"
  | "progress"
  | "message"
  | "request"
  | "system";

export type NotificationVisual = {
  kind: NotificationKind;
  label: string;
  Icon: LucideIcon;
  iconClass: string;
  actionLabel: string;
};

const VISUALS: Record<NotificationKind, NotificationVisual> = {
  document: {
    kind: "document",
    label: "Documents",
    Icon: FileText,
    iconClass: "bg-brand/10 text-brand",
    actionLabel: "View document",
  },
  invoice: {
    kind: "invoice",
    label: "Invoices",
    Icon: Receipt,
    iconClass: "bg-amber-500/10 text-amber-700",
    actionLabel: "View invoice",
  },
  progress: {
    kind: "progress",
    label: "Progress",
    Icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-700",
    actionLabel: "View progress",
  },
  message: {
    kind: "message",
    label: "Messages",
    Icon: MessageSquare,
    iconClass: "bg-sky-500/10 text-sky-700",
    actionLabel: "Open messages",
  },
  request: {
    kind: "request",
    label: "Requests",
    Icon: ClipboardList,
    iconClass: "bg-orange-500/10 text-orange-700",
    actionLabel: "View request",
  },
  system: {
    kind: "system",
    label: "Updates",
    Icon: Bell,
    iconClass: "bg-muted text-muted-foreground",
    actionLabel: "View",
  },
};

export function resolveNotificationVisual(
  notification: Notification
): NotificationVisual {
  const title = notification.title.toLowerCase();
  const href = (notification.href || "").toLowerCase();
  const message = notification.message.toLowerCase();

  if (
    href.startsWith("/documents") ||
    title.includes("document") ||
    title.includes("file")
  ) {
    return {
      ...VISUALS.document,
      label: inferDocumentCategory(message) ?? VISUALS.document.label,
    };
  }

  if (href.startsWith("/invoices") || title.includes("invoice")) {
    return VISUALS.invoice;
  }

  if (
    href.startsWith("/progress") ||
    title.includes("progress") ||
    title.includes("completed") ||
    title.includes("work") ||
    title.includes("approval") ||
    title.includes("task")
  ) {
    const isCompleted =
      title.includes("completed") || message.includes("is ready");
    return {
      ...VISUALS.progress,
      label: isCompleted ? "Completed" : VISUALS.progress.label,
      Icon: isCompleted ? CheckCircle2 : ClipboardList,
      iconClass: isCompleted
        ? VISUALS.progress.iconClass
        : "bg-brand/10 text-brand",
    };
  }

  if (href.startsWith("/messages") || title.includes("message")) {
    return VISUALS.message;
  }

  if (href.startsWith("/requests") || title.includes("request")) {
    return VISUALS.request;
  }

  return VISUALS.system;
}

function inferDocumentCategory(message: string): string | null {
  const known = [
    "Contracts",
    "Invoices",
    "SEO Reports",
    "Property Data",
    "Creative Assets",
    "Project Documents",
    "Minutes of Meeting",
  ];
  for (const label of known) {
    if (message.toLowerCase().includes(label.toLowerCase())) return label;
  }
  return null;
}

export function formatNotificationTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24 && isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    if (diffHr < 24 * 7) return format(date, "EEE");
    return format(date, "d MMM");
  } catch {
    return dateString;
  }
}

export type NotificationGroup = {
  key: string;
  label: string;
  items: Notification[];
};

export function groupNotificationsByDate(
  notifications: Notification[]
): NotificationGroup[] {
  const buckets: Record<string, Notification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const n of notifications) {
    try {
      const date = parseISO(n.timestamp);
      if (isToday(date)) buckets.today.push(n);
      else if (isYesterday(date)) buckets.yesterday.push(n);
      else buckets.earlier.push(n);
    } catch {
      buckets.earlier.push(n);
    }
  }

  const groups: NotificationGroup[] = [];
  if (buckets.today.length) {
    groups.push({ key: "today", label: "Today", items: buckets.today });
  }
  if (buckets.yesterday.length) {
    groups.push({
      key: "yesterday",
      label: "Yesterday",
      items: buckets.yesterday,
    });
  }
  if (buckets.earlier.length) {
    groups.push({ key: "earlier", label: "Earlier", items: buckets.earlier });
  }
  return groups;
}
