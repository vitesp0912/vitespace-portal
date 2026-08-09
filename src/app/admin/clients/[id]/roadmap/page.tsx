"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { RoadmapManager } from "@/components/admin/roadmap-manager";

export default function RoadmapAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminClientLayout clientId={id}>
      <AdminClientPage title="Roadmap" description="Planned work shown at the bottom of the client Progress page.">
        <RoadmapManager clientId={id} />
      </AdminClientPage>
    </AdminClientLayout>
  );
}
