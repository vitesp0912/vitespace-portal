"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  LayoutGrid,
  ListTodo,
  LogOut,
  Settings,
  Receipt,
  FolderOpen,
  MessageSquare,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientAuth } from "@/lib/client-auth";

interface AdminShellProps {
  clientId?: string;
  clientName?: string;
  children: React.ReactNode;
}

const CLIENT_SECTIONS = (clientId: string) => [
  { href: `/admin/clients/${clientId}`, label: "Overview", icon: LayoutGrid, end: true },
  { href: `/admin/clients/${clientId}/settings`, label: "Settings", icon: Settings },
  { href: `/admin/clients/${clientId}/work`, label: "Work Items", icon: ListTodo },
  { href: `/admin/clients/${clientId}/invoices`, label: "Invoices", icon: Receipt },
  { href: `/admin/clients/${clientId}/documents`, label: "Documents", icon: FolderOpen },
  { href: `/admin/clients/${clientId}/messages`, label: "Messages", icon: MessageSquare },
  { href: `/admin/clients/${clientId}/notifications`, label: "Notifications", icon: Bell },
];

export function AdminShell({ clientId, clientName, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useClientAuth();
  const isClientView = Boolean(clientId);
  const clientTabs = clientId ? CLIENT_SECTIONS(clientId) : [];

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
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-200",
                      active
                        ? "bg-brand/10 text-foreground ring-1 ring-brand/10"
                        : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "opacity-70")} />
                    {tab.label}
                  </Link>
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
          <div className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 py-2 [scrollbar-width:none] lg:hidden">
            {clientTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href, tab.end);
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
                </Link>
              );
            })}
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
