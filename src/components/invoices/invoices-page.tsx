"use client";

import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-700" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-700" },
  overdue: { label: "Overdue", className: "bg-red-500/10 text-red-700" },
};

export function InvoicesPage() {
  const { invoices } = useClientPortal();
  const pending = invoices.filter((i) => i.status !== "paid");
  const paid = invoices.filter((i) => i.status === "paid");

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Invoices"
        description="View, download, and pay invoices — no chasing copies over email."
      />

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Outstanding</h2>
          {pending.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </section>
      )}

      {paid.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Paid</h2>
          {paid.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </section>
      )}
    </PortalPage>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const config = statusConfig[invoice.status];

  function handlePay() {
    alert(`Payment flow for ${invoice.number} will connect to Razorpay/Stripe when backend is wired.`);
  }

  function handleDownload() {
    alert(`Download for ${invoice.number} will use signed URL from Supabase Storage when backend is wired.`);
  }

  return (
    <div className="portal-lift flex flex-col gap-4 rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] text-muted-foreground">{invoice.number}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", config.className)}>{config.label}</span>
        </div>
        <p className="mt-1 text-[14px] font-medium">{invoice.title}</p>
        <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-tight">{formatCurrency(invoice.amount)}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Issued {formatDate(invoice.issuedAt)}
          {invoice.status !== "paid" ? ` · Due ${formatDate(invoice.dueAt)}` : invoice.paidAt && ` · Paid ${formatDate(invoice.paidAt)}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {invoice.status === "pending" || invoice.status === "overdue" ? (
          <>
            <Button size="sm" className="rounded-full" onClick={handlePay}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Pay Now
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={handleDownload}>View</Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="rounded-full" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
