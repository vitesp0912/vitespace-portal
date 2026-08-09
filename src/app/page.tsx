import { PortalLayout } from "@/components/layout/portal-layout";
import { OverviewPage } from "@/components/overview/overview-page";

export default function Home() {
  return (
    <PortalLayout>
      <OverviewPage />
    </PortalLayout>
  );
}
