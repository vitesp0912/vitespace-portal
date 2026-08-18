import { formatDistanceToNow, format, parseISO } from "date-fns";

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM d, h:mm a");
  } catch {
    return dateString;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatChatTime(dateString: string): string {
  try {
    return format(parseISO(dateString), "h:mm a");
  } catch {
    return dateString;
  }
}

export function formatChatDay(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const today = new Date();
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Today";
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    }
    return format(date, "d MMMM yyyy");
  } catch {
    return dateString;
  }
}

export function chatDayKey(dateString: string): string {
  try {
    return format(parseISO(dateString), "yyyy-MM-dd");
  } catch {
    return dateString;
  }
}

export function formatLongDate(date: Date = new Date()): string {
  return format(date, "EEEE, d MMMM");
}

export function formatShortRelative(dateString: string): string {
  try {
    const d = parseISO(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return formatRelativeTime(dateString);
    if (diffHours < 48) return "Yesterday";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateString;
  }
}
