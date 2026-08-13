"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { ClientSettingsManager } from "@/components/admin/client-settings-manager";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage
        title="Client Settings"
        description="Profile and account details for this client portal."
      >
        <ClientSettingsManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
