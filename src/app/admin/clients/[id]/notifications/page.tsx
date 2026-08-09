"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { NotificationsManager } from "@/components/admin/notifications-manager";

export default function NotificationsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Notifications" description="Bell menu alerts for the client portal header.">
        <NotificationsManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
