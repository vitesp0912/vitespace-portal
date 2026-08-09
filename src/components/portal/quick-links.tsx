import Link from "next/link";
import {
  TrendingUp,
  FileText,
  Receipt,
  FolderOpen,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { quickLinks } from "@/lib/portal-nav";

const iconMap = {
  "/progress": TrendingUp,
  "/requests": FileText,
  "/invoices": Receipt,
  "/documents": FolderOpen,
  "/messages": MessageSquare,
  "/approvals": CheckCircle2,
};

export function QuickLinks() {
  return (
    <section>
      <h2 className="mb-4 text-[15px] font-semibold tracking-tight">
        Quick Links
      </h2>
      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => {
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
