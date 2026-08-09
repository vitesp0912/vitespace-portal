"use client";

import Link from "next/link";
import { Bell, ChevronDown, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientPortal } from "@/lib/portal-store";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PortalHeader() {
  const { client, notifications, markNotificationRead, markAllNotificationsRead } =
    useClientPortal();

  if (!client) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-[13px] font-medium text-foreground">{client.company}</p>
        <p className="truncate text-[11px] text-muted-foreground">{client.projectName}</p>
      </div>

      <div className="relative mx-auto hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search documents, invoices..."
          className="h-9 w-full rounded-lg border-0 bg-muted/60 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/70 transition-colors focus:bg-muted focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="relative rounded-lg text-muted-foreground hover:text-foreground" />
            }
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white animate-pulse-soft">
                {unreadCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent className="w-[360px] border-l border-border/60">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-[16px] font-semibold">Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <button type="button" onClick={() => markAllNotificationsRead(client.id)} className="text-[12px] text-brand hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
            </SheetHeader>
            <ScrollArea className="mt-4 h-[calc(100vh-5rem)]">
              <div className="space-y-1 pr-2">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => markNotificationRead(notification.id)}
                    className={cn(
                      "block rounded-lg px-3 py-3 transition-all duration-200 hover:bg-muted/60",
                      !notification.read && "bg-brand/5 ring-1 ring-brand/10"
                    )}
                  >
                    <p className="text-[13px] font-medium">{notification.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{notification.message}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground/60">{formatRelativeTime(notification.timestamp)}</p>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 rounded-lg px-2 hover:bg-muted/60" />}>
            <Avatar className="h-7 w-7 ring-2 ring-border/50">
              <AvatarFallback className="bg-brand/10 text-[11px] font-semibold text-brand">
                {client.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-medium leading-none">{client.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{client.company}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem disabled>
              <span className="text-[12px] text-muted-foreground">{client.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Account settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Team members</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
