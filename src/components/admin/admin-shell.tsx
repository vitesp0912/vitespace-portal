"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  LayoutGrid,
  ListTodo,
  Loader2,
  LogOut,
  Settings,
  Receipt,
  FolderOpen,
  MessageSquare,
  Bell,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClientAuth } from "@/lib/client-auth";
import { formatUnreadBadge } from "@/lib/message-thread-view";
import { usePortal } from "@/lib/portal-store";

interface AdminShellProps {
  clientId?: string;
  clientName?: string;
  children: React.ReactNode;
}

type PortalUser = {
  userId: string;
  name: string | null;
  email: string | null;
};

const CLIENT_SECTIONS = (clientId: string) => [
  { href: `/admin/clients/${clientId}`, label: "Overview", icon: LayoutGrid, end: true },
  { href: `/admin/clients/${clientId}/settings`, label: "Settings", icon: Settings },
  { href: `/admin/clients/${clientId}/work`, label: "Work Items", icon: ListTodo },
  { href: `/admin/clients/${clientId}/invoices`, label: "Invoices", icon: Receipt },
  { href: `/admin/clients/${clientId}/documents`, label: "Documents", icon: FolderOpen },
  { href: `/admin/clients/${clientId}/messages`, label: "Messages", icon: MessageSquare },
  { href: `/admin/clients/${clientId}/notifications`, label: "Notifications", icon: Bell },
];

function userDisplayName(u: PortalUser) {
  return u.name?.trim() || "Portal user";
}

function usePortalUsers(clientId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const selectedUserId = searchParams.get("user") ?? "";

  const setThreadUser = useCallback(
    (userId: string) => {
      router.replace(
        `/admin/clients/${clientId}/messages?user=${encodeURIComponent(userId)}`,
        { scroll: false }
      );
    },
    [clientId, router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingUsers(true);
    void fetch(`/api/clients/${clientId}/users`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load users");
        return (data.users as PortalUser[]) ?? [];
      })
      .then((list) => {
        if (cancelled) return;
        setPortalUsers(list);
        const current = new URLSearchParams(window.location.search).get("user");
        if (current && list.some((u) => u.userId === current)) return;
        if (list[0]?.userId) {
          router.replace(
            `/admin/clients/${clientId}/messages?user=${encodeURIComponent(list[0].userId)}`,
            { scroll: false }
          );
        }
      })
      .catch(() => {
        if (!cancelled) setPortalUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, router]);

  const selectedUser = portalUsers.find((u) => u.userId === selectedUserId) ?? null;

  return {
    portalUsers,
    loadingUsers,
    selectedUserId,
    selectedUser,
    setThreadUser,
  };
}

function MessagesUserPicker({
  clientId,
  compact = false,
}: {
  clientId: string;
  compact?: boolean;
}) {
  const {
    portalUsers,
    loadingUsers,
    selectedUserId,
    selectedUser,
    setThreadUser,
  } = usePortalUsers(clientId);

  if (loadingUsers) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          compact ? "px-1 py-1" : "px-3 py-2"
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {!compact && <span className="text-[11px]">Loading users…</span>}
      </div>
    );
  }

  if (portalUsers.length === 0) {
    return (
      <p
        className={cn(
          "text-[11px] text-muted-foreground",
          compact ? "px-1 py-1" : "px-3 py-1.5"
        )}
      >
        No portal users
      </p>
    );
  }

  return (
    <Select
      value={selectedUserId}
      onValueChange={(v) => v && setThreadUser(v)}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-full min-w-0 border-border/70 bg-background text-[12px]",
          compact ? "rounded-full" : "rounded-md"
        )}
      >
        <SelectValue placeholder="Select user">
          {selectedUser ? userDisplayName(selectedUser) : "Select user"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[var(--anchor-width)]">
        {portalUsers.map((u) => (
          <SelectItem key={u.userId} value={u.userId} className="text-[12px]">
            <span className="block truncate">{userDisplayName(u)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MessagesHeaderUserName({ clientId }: { clientId: string }) {
  const { selectedUser, loadingUsers } = usePortalUsers(clientId);

  if (loadingUsers || !selectedUser) return null;

  return (
    <>
      <span className="hidden text-muted-foreground/40 sm:inline">/</span>
      <span className="min-w-0 truncate text-[14px] font-medium text-muted-foreground">
        {userDisplayName(selectedUser)}
      </span>
    </>
  );
}

function MessagesUserPickerSuspense({
  clientId,
  compact,
}: {
  clientId: string;
  compact?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center px-3 py-2 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </div>
      }
    >
      <MessagesUserPicker clientId={clientId} compact={compact} />
    </Suspense>
  );
}

export function AdminShell({ clientId, clientName, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useClientAuth();
  const { getUnreadMessageCount } = usePortal();
  const isClientView = Boolean(clientId);
  const clientTabs = clientId ? CLIENT_SECTIONS(clientId) : [];
  const messagesHref = clientId
    ? `/admin/clients/${clientId}/messages`
    : "";
  const isMessagesPage = Boolean(clientId && pathname === messagesHref);
  const unreadLabel = clientId
    ? formatUnreadBadge(getUnreadMessageCount(clientId, "vitespace"))
    : null;

  function isActive(href: string, end?: boolean) {
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-[60px] items-center px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
              <img
                src="/logo.png"
                alt="Vitespace"
                className="h-5 w-5 object-contain"
              />
            </span>
            <div>
              <span className="text-[14px] font-semibold tracking-tight text-foreground">Vitespace</span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Internal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
              !isClientView
                ? "bg-brand/10 text-foreground ring-1 ring-brand/10"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Building2 className="h-[18px] w-[18px] shrink-0 opacity-80" />
            All Clients
          </Link>

          {isClientView && clientName && (
            <div className="mt-4">
              <p className="mb-2 truncate px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {clientName}
              </p>
              {clientTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href, tab.end);
                const isMessages = tab.href === messagesHref;

                return (
                  <div key={tab.href} className="mb-0.5">
                    <Link
                      href={tab.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-200",
                        active
                          ? "bg-brand/10 text-foreground ring-1 ring-brand/10"
                          : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "opacity-70")} />
                      <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                      {isMessages && unreadLabel && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
                          {unreadLabel}
                        </span>
                      )}
                    </Link>
                    {isMessages && isMessagesPage && clientId && (
                      <div className="mt-1.5 mb-1 pl-3 pr-1">
                        <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Portal user
                        </p>
                        <MessagesUserPickerSuspense clientId={clientId} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-70" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-[56px] shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:h-[60px] sm:px-8">
          {isClientView && (
            <Link href="/admin" className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clients</span>
            </Link>
          )}
          {isClientView && <span className="hidden text-muted-foreground/40 sm:inline">/</span>}
          <span className="min-w-0 truncate text-[14px] font-medium text-foreground">
            {isClientView ? clientName : "Dashboard"}
          </span>
          {isMessagesPage && clientId && (
            <Suspense fallback={null}>
              <MessagesHeaderUserName clientId={clientId} />
            </Suspense>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground lg:hidden"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>

        {isClientView && (
          <div className="border-b border-border/60 lg:hidden">
            <div className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
              {clientTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href, tab.end);
                const isMessages = tab.href === messagesHref;
                const showUnread = isMessages && unreadLabel;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {showUnread && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
                        {unreadLabel}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            {isMessagesPage && clientId && (
              <div className="px-3 pb-2">
                <MessagesUserPickerSuspense clientId={clientId} compact />
              </div>
            )}
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
