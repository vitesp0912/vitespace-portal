"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { ChangeRequestsManager } from "@/components/admin/change-requests-manager";

export default function RequestsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Change Requests" description="Manage change requests visible on the client Requests page.">
        <ChangeRequestsManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
