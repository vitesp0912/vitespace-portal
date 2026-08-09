import { Suspense } from "react";
import { PortalLayout } from "@/components/layout/portal-layout";
import { ApprovalsPage } from "@/components/approvals/approvals-page";

export default function Approvals() {
  return (
    <PortalLayout>
      <Suspense>
        <ApprovalsPage />
      </Suspense>
    </PortalLayout>
  );
}
