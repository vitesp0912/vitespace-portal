"use client";

import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { WorkItemsManager } from "@/components/admin/work-items-manager";
import { usePortal } from "@/lib/portal-store";

interface ClientWorkPageProps {
  clientId: string;
}

export function ClientWorkPage({ clientId }: ClientWorkPageProps) {
  const { getClient, loadingData } = usePortal();
  const client = getClient(clientId);

  if (!client) {
    return (
      <AdminClientLayout clientId={clientId}>
        <AdminClientPage title="Work Items">
          <p className="text-muted-foreground">
            {loadingData ? "Loading…" : "Client not found."}
          </p>
        </AdminClientPage>
      </AdminClientLayout>
    );
  }

  return (
    <AdminClientLayout clientId={clientId}>
      <AdminClientPage
        title="Work Items"
        description={`Manage what ${client.company} sees on their Progress page.`}
      >
        <WorkItemsManager clientId={clientId} clientName={client.company} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
