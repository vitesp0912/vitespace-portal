"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
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
import { useClientAuth } from "@/lib/client-auth";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ClientAvatar } from "@/components/shared/client-avatar";

export function PortalHeader() {
  const router = useRouter();
  const { session, logout } = useClientAuth();
  const { client, notifications, markNotificationRead, markAllNotificationsRead, setActiveClientId } =
    useClientPortal();

  if (!client) return null;

  async function handleSignOut() {
    await logout();
    setActiveClientId("");
    router.replace("/login");
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:h-[60px] sm:gap-4 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1 pr-2">
        <p className="truncate text-[13px] font-medium text-foreground">{client.company}</p>
        <p className="truncate text-[11px] text-muted-foreground">{client.projectName}</p>
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
          <SheetContent className="w-full max-w-full border-l border-border/60 sm:w-[360px] sm:max-w-[360px]">
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
            <ClientAvatar
              src={client.avatar}
              name={client.company}
              className="h-7 w-7 text-[11px]"
            />
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-medium leading-none">
                {session?.displayName || session?.email || client.company}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{client.company}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem disabled>
              <span className="text-[12px] text-muted-foreground">
                {session?.email || client.email}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Account settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Team members</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
