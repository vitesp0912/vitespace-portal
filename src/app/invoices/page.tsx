import { PortalLayout } from "@/components/layout/portal-layout";
import { InvoicesPage } from "@/components/invoices/invoices-page";
import { requireInvoiceAccess } from "@/lib/server/require-invoice-access";

export default async function Invoices() {
  await requireInvoiceAccess();

  return (
    <PortalLayout>
      <InvoicesPage />
    </PortalLayout>
  );
}
