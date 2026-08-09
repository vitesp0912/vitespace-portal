"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { MessagesManager } from "@/components/admin/messages-manager";

export default function MessagesAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Messages" description="Conversation threads on the client Messages page.">
        <MessagesManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
