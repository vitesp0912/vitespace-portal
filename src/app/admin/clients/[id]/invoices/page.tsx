"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { InvoicesManager } from "@/components/admin/invoices-manager";

export default function InvoicesAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Invoices" description="Billing records shown on the client Invoices page.">
        <InvoicesManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
