"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { ApprovalsManager } from "@/components/admin/approvals-manager";

export default function ApprovalsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Approvals" description="Plans and deliverables awaiting client sign-off.">
        <ApprovalsManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
