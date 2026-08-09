"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { usePortal } from "@/lib/portal-store";

interface AdminClientLayoutProps {
  clientId: string;
  children: React.ReactNode;
}

export function AdminClientLayout({ clientId, children }: AdminClientLayoutProps) {
  const { getClient } = usePortal();
  const client = getClient(clientId);

  return (
    <AdminShell clientId={clientId} clientName={client?.company ?? "Client"}>
      {children}
    </AdminShell>
  );
}
