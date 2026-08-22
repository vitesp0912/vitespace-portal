"use client";

import Link from "next/link";
import {
  TrendingUp,
  FileText,
  Receipt,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import { getVisibleQuickLinks } from "@/lib/client-access";
import { useClientAuth } from "@/lib/client-auth";

const iconMap = {
  "/progress": TrendingUp,
  "/requests": FileText,
  "/invoices": Receipt,
  "/documents": FolderOpen,
  "/messages": MessageSquare,
};

export function QuickLinks() {
  const { session } = useClientAuth();
  const links = getVisibleQuickLinks(session);

  return (
    <section>
      <h2 className="mb-4 text-[15px] font-semibold tracking-tight">
        Quick Links
      </h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const Icon = iconMap[link.href as keyof typeof iconMap] ?? FileText;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="portal-lift group inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-medium text-foreground ring-1 ring-border/60 transition-all hover:ring-brand/30 hover:portal-shadow-hover"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-brand" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
