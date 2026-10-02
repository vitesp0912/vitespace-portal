"use client";

import { AdminPage } from "@/components/admin/admin-page";
import { AdminShell } from "@/components/admin/admin-shell";
import { FinancesManager } from "@/components/admin/finances-manager";

export default function FinancesPage() {
  return (
    <AdminShell>
      <AdminPage>
        <FinancesManager />
      </AdminPage>
    </AdminShell>
  );
}
