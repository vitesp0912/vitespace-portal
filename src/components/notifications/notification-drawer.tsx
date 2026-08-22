"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  formatNotificationTime,
  groupNotificationsByDate,
  resolveNotificationVisual,
} from "@/lib/notification-ui";
import { formatUnreadBadge } from "@/lib/message-thread-view";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

type NotificationDrawerProps = {
  notifications: Notification[];
  onMarkAllRead?: () => void;
};

export function NotificationDrawer({
  notifications,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const unreadLabel = formatUnreadBadge(unreadCount);

  const groups = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications]
  );

  function markAllRead() {
    if (unreadCount > 0) onMarkAllRead?.();
  }

  function handleOpenChange(next: boolean) {
    // Clear badge as soon as the drawer opens (per-user cursor).
    // Also mark on close so Link navigation / late arrivals are covered.
    if (next || open) {
      markAllRead();
    }
    setOpen(next);
  }

  function handleClose() {
    markAllRead();
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={
              unreadLabel
                ? `Notifications, ${unreadLabel} unread`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadLabel ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white">
            {unreadLabel}
          </span>
        ) : null}
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        side="right"
        overlayClassName="bg-black/[0.16] supports-backdrop-filter:backdrop-blur-[2px]"
        className={cn(
          "gap-0 border-l border-border/70 bg-surface p-0 shadow-[0_12px_40px_rgba(12,14,26,0.12)]",
          "w-full max-w-none sm:w-[420px] sm:max-w-[420px] lg:w-[440px] lg:max-w-[440px]",
          "duration-200 ease-out"
        )}
      >
        <SheetDescription className="sr-only">
          Project notifications for documents, progress, invoices, and messages.
        </SheetDescription>

        <div className="shrink-0 border-b border-border/60 px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-[20px] font-semibold tracking-tight text-foreground">
              Notifications
            </SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close notifications"
                  title="Close"
                />
              }
            >
              <X className="h-4 w-4" />
            </SheetClose>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-2 pb-4 pt-1 sm:px-2.5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand/8 text-brand">
                  <CheckCheck className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="text-[14px] font-semibold text-foreground">
                  No notifications yet
                </p>
                <p className="mt-1 max-w-[220px] text-[13px] leading-relaxed text-muted-foreground">
                  Updates about documents, progress, and invoices will show up
                  here.
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <section key={group.key} className="pt-3">
                  <h3 className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                    {group.label}
                  </h3>
                  <ul className="space-y-0.5">
                    {group.items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onSelect={handleClose}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: () => void;
}) {
  const visual = resolveNotificationVisual(notification);
  const Icon = visual.Icon;

  return (
    <li>
      <Link
        href={notification.href || "/"}
        onClick={onSelect}
        className={cn(
          "group flex gap-3 rounded-xl px-2.5 py-2.5 transition-colors outline-none",
          "hover:bg-[#F8F7FF] focus-visible:ring-2 focus-visible:ring-ring/50",
          !notification.read && "bg-brand/[0.04]"
        )}
      >
        <span
          className={cn(
            "relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]",
            visual.iconClass
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {!notification.read ? (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
          ) : null}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "line-clamp-1 text-[14px] leading-snug text-foreground",
                !notification.read ? "font-semibold" : "font-medium"
              )}
            >
              {notification.title}
            </p>
            <time
              dateTime={notification.timestamp}
              className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground/75"
            >
              {formatNotificationTime(notification.timestamp)}
            </time>
          </div>

          {notification.message ? (
            <p
              className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground"
              title={notification.message}
            >
              {notification.message}
            </p>
          ) : null}

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-medium text-muted-foreground/70">
              {visual.label}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {visual.actionLabel}
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
