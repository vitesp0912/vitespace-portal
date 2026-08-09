import { PortalShell } from "@/components/portal/portal-shell";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
