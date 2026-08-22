"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDrawer } from "@/components/notifications/notification-drawer";
import { useClientPortal } from "@/lib/portal-store";
import { useClientAuth } from "@/lib/client-auth";
import { ClientAvatar } from "@/components/shared/client-avatar";

export function PortalHeader() {
  const router = useRouter();
  const { session, logout } = useClientAuth();
  const {
    client,
    clientId,
    notificationReads,
    setActiveClientId,
    getNotificationsForUser,
    markNotificationsReadForUser,
  } = useClientPortal();

  const userId = session?.userId;

  const notifications = useMemo(() => {
    if (!clientId || !userId) return [];
    return getNotificationsForUser(clientId, userId);
  }, [clientId, userId, getNotificationsForUser, notificationReads]);

  if (!client || !clientId) return null;

  async function handleSignOut() {
    await logout();
    setActiveClientId("");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:h-[60px] sm:gap-4 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1 pr-2">
        <p className="truncate text-[13px] font-medium text-foreground">
          {client.company}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {client.projectName}
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationDrawer
          notifications={notifications}
          onMarkAllRead={
            userId
              ? () => markNotificationsReadForUser(clientId, userId)
              : undefined
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-9 gap-2 rounded-lg px-2 hover:bg-muted/60"
              />
            }
          >
            <ClientAvatar
              src={client.avatar}
              name={client.company}
              className="h-7 w-7 text-[11px]"
            />
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-medium leading-none">
                {session?.displayName || session?.email || client.company}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {client.company}
              </p>
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
