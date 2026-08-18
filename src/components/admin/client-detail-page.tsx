"use client";

import Link from "next/link";
import {
  ArrowRight,
  ListTodo,
  Settings,
  Receipt,
  FolderOpen,
  MessageSquare,
  Bell,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { formatCurrency } from "@/lib/constants";
import { useAdminClient } from "@/lib/portal-store";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ClientDetailPageProps {
  clientId: string;
}

const SECTION_LINKS = (clientId: string) => [
  { href: `/admin/clients/${clientId}/settings`, label: "Settings", desc: "Profile and account details", icon: Settings },
  { href: `/admin/clients/${clientId}/work`, label: "Work Items", desc: "Progress page items", icon: ListTodo },
  { href: `/admin/clients/${clientId}/invoices`, label: "Invoices", desc: "Billing", icon: Receipt },
  { href: `/admin/clients/${clientId}/documents`, label: "Documents", desc: "File library", icon: FolderOpen },
  { href: `/admin/clients/${clientId}/messages`, label: "Messages", desc: "Conversations", icon: MessageSquare },
  { href: `/admin/clients/${clientId}/notifications`, label: "Notifications", desc: "Bell alerts", icon: Bell },
];

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const { client, stats } = useAdminClient(clientId);

  if (!client) {
    return (
      <AdminClientLayout clientId={clientId}>
        <AdminPage><p className="text-muted-foreground">Client not found.</p></AdminPage>
      </AdminClientLayout>
    );
  }

  const totalItems = stats.completed + stats.inProgress + stats.awaitingClient + stats.upcoming;

  const metrics = [
    { label: "Monthly Retainer", value: formatCurrency(client.monthlyRetainer), highlight: false },
    { label: "Completed", value: stats.completed, highlight: false },
    { label: "In Progress", value: stats.inProgress, highlight: false },
    { label: "Awaiting Client", value: stats.awaitingClient, highlight: true },
    { label: "Upcoming", value: stats.upcoming, highlight: false },
  ];

  return (
    <AdminClientLayout clientId={clientId}>
      <AdminPage className="space-y-8">
        <AdminSectionHeader
          title={client.company}
          description={`${client.projectName} · ${client.name}`}
          action={<StatusBadge status={client.projectStatus} />}
        />
        <div className="admin-gradient-accent overflow-hidden rounded-2xl ring-1 ring-brand/20">
          <div className="grid grid-cols-2 divide-x divide-border/80 sm:grid-cols-5">
            {metrics.map((m) => (
              <div key={m.label} className="px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{m.label}</p>
                <p className={cn("mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight", m.highlight && Number(m.value) > 0 ? "text-amber-600" : "text-foreground")}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-[13px] font-semibold">Manage client portal</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SECTION_LINKS(clientId).map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="admin-lift group flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/80"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold group-hover:text-brand">{section.label}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{section.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="admin-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <ListTodo className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold">Progress Items</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {totalItems} total · {stats.awaitingClient} need client action
              </p>
            </div>
          </div>
          <Link href={`/admin/clients/${clientId}/work`} className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground">
            Manage Work Items <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className="text-[12px] text-muted-foreground">
          Last updated {formatRelativeTime(client.lastUpdatedAt)}
        </p>
      </AdminPage>
    </AdminClientLayout>
  );
}
