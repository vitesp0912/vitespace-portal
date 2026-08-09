"use client";

import { PortalShell } from "@/components/portal/portal-shell";
import { PortalAuthGuard } from "@/components/portal/portal-auth-guard";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGuard>
      <PortalShell>{children}</PortalShell>
    </PortalAuthGuard>
  );
}
