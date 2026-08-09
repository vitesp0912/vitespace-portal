import { Suspense } from "react";
import { PortalLayout } from "@/components/layout/portal-layout";
import { RequestsPage } from "@/components/requests/requests-page";

export default function Requests() {
  return (
    <PortalLayout>
      <Suspense>
        <RequestsPage />
      </Suspense>
    </PortalLayout>
  );
}
