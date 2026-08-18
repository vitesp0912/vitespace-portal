import { PortalNavDesktop, PortalNavMobile } from "./portal-nav";
import { PortalHeader } from "./portal-header";

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PortalNavDesktop />
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <PortalHeader />
        <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
      <PortalNavMobile />
    </div>
  );
}
