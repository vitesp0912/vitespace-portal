import { Suspense } from "react";
import { PortalLayout } from "@/components/layout/portal-layout";
import { ProgressPage } from "@/components/progress/progress-page";

export default function Progress() {
  return (
    <PortalLayout>
      <Suspense>
        <ProgressPage />
      </Suspense>
    </PortalLayout>
  );
}
