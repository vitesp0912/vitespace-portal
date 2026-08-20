"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { portalNavItems } from "@/lib/portal-nav";
import { formatUnreadBadge } from "@/lib/message-thread-view";
import { useClientAuth } from "@/lib/client-auth";
import { useClientPortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

function MessageBadge({ count }: { count: number }) {
  const label = formatUnreadBadge(count);
  if (!label) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
      {label}
    </span>
  );
}

export function PortalNavDesktop() {
  const pathname = usePathname();
  const { session } = useClientAuth();
  const { actionItems, clientId, getUnreadMessageCount } = useClientPortal();
  const unreadMessages =
    clientId && session?.userId
      ? getUnreadMessageCount(clientId, "client", session.userId)
      : 0;

  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-[60px] items-center px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Vitespace"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Vitespace
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2">
        {portalNavItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const overviewBadge = item.href === "/" ? actionItems.length : 0;
          const isMessages = item.href === "/messages";

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
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-indigo-300"
                    : "opacity-70 group-hover:opacity-100"
                )}
              />
              {item.label}
              {overviewBadge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-300">
                  {overviewBadge}
                </span>
              )}
              {isMessages && <MessageBadge count={unreadMessages} />}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 mt-auto rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]">
        <p className="text-[12px] font-medium text-white/90">Need something?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/50">
          Raise a request or start a conversation.
        </p>
        <Link
          href="/requests"
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Get started
        </Link>
      </div>
    </aside>
  );
}

export function PortalNavMobile() {
  const pathname = usePathname();
  const { session } = useClientAuth();
  const { clientId, getUnreadMessageCount } = useClientPortal();
  const mobileItems = portalNavItems.filter((i) => i.mobile);
  const unreadMessages =
    clientId && session?.userId
      ? getUnreadMessageCount(clientId, "client", session.userId)
      : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-1 pt-1 backdrop-blur-lg lg:hidden pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="flex items-stretch justify-around">
        {mobileItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isMessages = item.href === "/messages";
          const badge = isMessages ? formatUnreadBadge(unreadMessages) : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 transition-colors",
                isActive ? "text-brand" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {badge && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate text-[9px] font-medium leading-none sm:text-[10px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
