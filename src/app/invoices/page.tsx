import { PortalLayout } from "@/components/layout/portal-layout";
import { InvoicesPage } from "@/components/invoices/invoices-page";

export default function Invoices() {
  return (
    <PortalLayout>
      <InvoicesPage />
    </PortalLayout>
  );
}
