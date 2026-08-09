"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { DocumentsManager } from "@/components/admin/documents-manager";

export default function DocumentsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Documents" description="Files in the client document library.">
        <DocumentsManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
