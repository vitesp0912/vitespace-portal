"use client";

import { AdminPage } from "@/components/admin/admin-page";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";

interface AdminClientPageProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminClientPage({
  title,
  description,
  action,
  children,
}: AdminClientPageProps) {
  return (
    <AdminPage className="space-y-6">
      <AdminSectionHeader
        title={title}
        description={description}
        action={action}
      />
      {children}
    </AdminPage>
  );
}
