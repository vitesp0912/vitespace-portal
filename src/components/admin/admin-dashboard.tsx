"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, FileText, Loader2, Users } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { AdminMetric } from "@/components/admin/admin-metric";
import { AddClientDialog } from "@/components/admin/client-settings-manager";
import { ServicesManager } from "@/components/admin/services-manager";
import { formatCurrency } from "@/lib/constants";
import { usePortal } from "@/lib/portal-store";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const {
    clients,
    getClientStats,
    refreshFromSupabase,
    loadingData,
    dataError,
  } = usePortal();

  useEffect(() => {
    void refreshFromSupabase({ isAdmin: true });
  }, [refreshFromSupabase]);

  const totalAwaiting = clients.reduce(
    (s, c) => s + getClientStats(c.id).awaitingClient,
    0
  );
  const totalRequests = clients.reduce(
    (s, c) => s + getClientStats(c.id).openRequests,
    0
  );

  return (
    <AdminShell>
      <AdminPage className="space-y-8">
        <AdminSectionHeader
          title="Clients"
          description="Manage client accounts and everything they see in their portal."
          action={<AddClientDialog />}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminMetric
            label="Active Clients"
            value={clients.filter((c) => c.status === "active").length}
            icon={Users}
            accent="brand"
          />
          <AdminMetric
            label="Awaiting Client"
            value={totalAwaiting}
            icon={Clock}
            accent="amber"
          />
          <AdminMetric
            label="Open Requests"
            value={totalRequests}
            icon={FileText}
          />
        </div>

        <section>
          <h2 className="mb-4 text-[13px] font-semibold text-foreground">
            All accounts
          </h2>

          {dataError && (
            <p className="mb-4 text-[13px] text-red-600">{dataError}</p>
          )}

          {loadingData && clients.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-card px-5 py-12 text-[13px] text-muted-foreground ring-1 ring-border/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading clients…
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-2xl bg-card px-5 py-12 text-center ring-1 ring-border/80">
              <p className="text-[13px] text-muted-foreground">
                No clients in the database yet.
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Add a client or seed rows in the{" "}
                <span className="font-medium text-foreground">clients</span>{" "}
                table.
              </p>
              <div className="mt-4 flex justify-center">
                <AddClientDialog />
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {clients.map((client) => {
                const stats = getClientStats(client.id);
                return (
                  <li key={client.id}>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="admin-lift group flex flex-col gap-4 rounded-2xl bg-card px-5 py-4 ring-1 ring-border/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-[15px] font-semibold text-brand">
                          {client.company.charAt(0)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <p className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-brand">
                              {client.company}
                            </p>
                            <StatusBadge status={client.projectStatus} />
                          </div>
                          <p className="mt-0.5 text-[13px] text-muted-foreground">
                            {client.name} ·{" "}
                            {formatCurrency(client.monthlyRetainer)}/mo
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pl-[60px] sm:pl-0">
                        <div className="hidden gap-6 text-[12px] text-muted-foreground sm:flex">
                          <span>
                            <span className="font-medium text-foreground">
                              {stats.inProgress}
                            </span>{" "}
                            active
                          </span>
                          {stats.awaitingClient > 0 && (
                            <span className="text-amber-400">
                              <span className="font-medium">
                                {stats.awaitingClient}
                              </span>{" "}
                              blocked
                            </span>
                          )}
                          <span>
                            Updated {formatRelativeTime(client.lastUpdatedAt)}
                          </span>
                        </div>
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-all",
                            "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-brand"
                          )}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <ServicesManager />
        </section>
      </AdminPage>
    </AdminShell>
  );
}
