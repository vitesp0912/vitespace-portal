"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Receipt,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientAuth } from "@/lib/client-auth";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/requests", label: "Requests", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { session } = useClientAuth();
  const showAdminLink = Boolean(session?.isAdmin);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-12 items-center border-b border-border px-4">
        <Link href="/" className="text-[13px] font-semibold tracking-tight">
          Vitespace
        </Link>
      </div>

      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {showAdminLink && (
        <div className="border-t border-border p-2">
          <Link
            href="/admin"
            className="block rounded-md px-2.5 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Internal admin →
          </Link>
        </div>
      )}
    </aside>
  );
}
