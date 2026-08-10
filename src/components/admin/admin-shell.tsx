"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  LayoutGrid,
  ListTodo,
  ExternalLink,
  Settings,
  FileText,
  CheckCircle2,
  Receipt,
  FolderOpen,
  MessageSquare,
  Map,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  clientId?: string;
  clientName?: string;
  children: React.ReactNode;
}

const CLIENT_SECTIONS = (clientId: string) => [
  { href: `/admin/clients/${clientId}`, label: "Overview", icon: LayoutGrid, end: true },
  { href: `/admin/clients/${clientId}/settings`, label: "Settings", icon: Settings },
  { href: `/admin/clients/${clientId}/work`, label: "Work Items", icon: ListTodo },
  { href: `/admin/clients/${clientId}/requests`, label: "Requests", icon: FileText },
  { href: `/admin/clients/${clientId}/approvals`, label: "Approvals", icon: CheckCircle2 },
  { href: `/admin/clients/${clientId}/invoices`, label: "Invoices", icon: Receipt },
  { href: `/admin/clients/${clientId}/documents`, label: "Documents", icon: FolderOpen },
  { href: `/admin/clients/${clientId}/messages`, label: "Messages", icon: MessageSquare },
  { href: `/admin/clients/${clientId}/roadmap`, label: "Roadmap", icon: Map },
  { href: `/admin/clients/${clientId}/notifications`, label: "Notifications", icon: Bell },
];

export function AdminShell({ clientId, clientName, children }: AdminShellProps) {
  const pathname = usePathname();
  const isClientView = Boolean(clientId);
  const clientTabs = clientId ? CLIENT_SECTIONS(clientId) : [];

  function isActive(href: string, end?: boolean) {
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-[60px] items-center px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 ring-1 ring-brand/30">
              <span className="text-sm font-bold text-brand">V</span>
            </div>
            <div>
              <span className="text-[14px] font-semibold tracking-tight text-white">Vitespace</span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">Internal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
              !isClientView
                ? "bg-white/10 text-white ring-1 ring-white/10"
                : "text-sidebar-foreground hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <Building2 className="h-[18px] w-[18px] shrink-0 opacity-80" />
            All Clients
          </Link>

          {isClientView && clientName && (
            <div className="mt-4">
              <p className="mb-2 truncate px-3 text-[10px] font-medium uppercase tracking-widest text-white/35">
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
                        ? "bg-white/10 text-white ring-1 ring-white/10"
                        : "text-sidebar-foreground hover:bg-white/[0.06] hover:text-white"
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
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
            Client Portal
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-5 backdrop-blur-xl sm:px-8">
          {isClientView && (
            <Link href="/admin" className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Clients
            </Link>
          )}
          {isClientView && <span className="text-muted-foreground/40">/</span>}
          <span className="text-[14px] font-medium text-foreground">
            {isClientView ? clientName : "Dashboard"}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
