"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { portalNavItems } from "@/lib/portal-nav";
import { useClientPortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export function PortalNavDesktop() {
  const pathname = usePathname();
  const { actionItems, approvals } = useClientPortal();
  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;

  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-[60px] items-center px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
            <span className="text-sm font-bold text-white">V</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">Vitespace</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2">
        {portalNavItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badge =
            item.href === "/approvals"
              ? pendingApprovals
              : item.href === "/"
                ? actionItems.length
                : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                  : "text-sidebar-foreground hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActive ? "text-indigo-300" : "opacity-70 group-hover:opacity-100")} />
              {item.label}
              {badge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-300">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 mt-auto rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]">
        <p className="text-[12px] font-medium text-white/90">Need something?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/50">Raise a request or start a conversation.</p>
        <Link href="/requests" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-300 transition-colors hover:text-indigo-200">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Get started
        </Link>
      </div>
    </aside>
  );
}

export function PortalNavMobile() {
  const pathname = usePathname();
  const mobileItems = portalNavItems.filter((i) => i.mobile);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-surface/95 px-2 py-2 backdrop-blur-lg lg:hidden">
      {mobileItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors", isActive ? "text-brand" : "text-muted-foreground")}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
