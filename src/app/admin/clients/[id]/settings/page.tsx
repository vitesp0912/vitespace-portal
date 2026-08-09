"use client";

import { use } from "react";
import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { AdminClientPage } from "@/components/admin/admin-client-page";
import { ClientSettingsManager } from "@/components/admin/client-settings-manager";
import { ProgressAreasManager } from "@/components/admin/progress-areas-manager";
import { ActionItemsManager } from "@/components/admin/action-items-manager";

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
        description="Profile, progress overview, and action-required items shown on the client dashboard."
      >
        <ClientSettingsManager clientId={id} />
        <div className="space-y-2 pt-4">
          <h3 className="text-[15px] font-semibold">Progress Areas</h3>
          <ProgressAreasManager clientId={id} />
        </div>
        <div className="space-y-2 pt-4">
          <h3 className="text-[15px] font-semibold">Action Items</h3>
          <ActionItemsManager clientId={id} />
        </div>
      </AdminClientPage>
    </AdminClientLayout>
  );
}
