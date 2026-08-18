"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useClientPortal } from "@/lib/portal-store";
import { getActionItemHref } from "@/lib/action-item-utils";
import { formatShortRelative } from "@/lib/format";

export function ActionRequiredPanel() {
  const { actionItems } = useClientPortal();
  if (actionItems.length === 0) return null;

  return (
    <section className="rounded-2xl bg-amber-50/80 px-5 py-5 ring-1 ring-amber-200/60 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-semibold text-amber-950">Action Required</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold text-amber-800">
            {actionItems.length}
          </span>
        </div>
        <Link href="/progress?tab=awaiting_client" className="group flex shrink-0 items-center gap-1 text-[12px] font-medium text-amber-800 transition-colors hover:text-amber-950">
          View all actions
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="mt-4 space-y-1">
        {actionItems.map((item) => (
          <li key={item.id}>
            <Link
              href={getActionItemHref(item)}
              className="group portal-lift flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-amber-100/60"
            >
              <div>
                <p className="text-[14px] font-medium text-amber-950 group-hover:text-amber-900">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-amber-700/70">
                  Requested {formatShortRelative(item.requestedAt)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-amber-600 opacity-70 sm:opacity-0 sm:transition-all sm:group-hover:translate-x-0.5 sm:group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
