"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { MessagesManager } from "@/components/admin/messages-manager";

export default function MessagesAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <MessagesManager clientId={id} />
    </AdminClientLayout>
  );
}
