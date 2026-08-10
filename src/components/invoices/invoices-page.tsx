"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { formatCurrency } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-700" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-700" },
  overdue: { label: "Overdue", className: "bg-red-500/10 text-red-700" },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export function InvoicesPage() {
  const { invoices } = useClientPortal();
  const outstanding = invoices.filter(
    (i) => i.status === "pending" || i.status === "overdue"
  );
  const paid = invoices.filter((i) => i.status === "paid");
  const other = invoices.filter(
    (i) => !["pending", "overdue", "paid"].includes(i.status)
  );

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Invoices"
        description="Invoices uploaded by Vitespace appear here. Download when a file is attached."
      />

      {invoices.length === 0 ? (
        <div className="rounded-2xl bg-surface px-5 py-12 text-center portal-shadow ring-1 ring-border/50">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-[13px] text-muted-foreground">
            No invoices yet. When Vitespace uploads one, it will show up here.
          </p>
        </div>
      ) : (
        <>
          {outstanding.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Outstanding
              </h2>
              {outstanding.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </section>
          )}

          {paid.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Paid
              </h2>
              {paid.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </section>
          )}

          {other.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Other
              </h2>
              {other.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </section>
          )}
        </>
      )}
    </PortalPage>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const config = statusConfig[invoice.status] ?? statusConfig.pending;
  const hasFile = Boolean(invoice.fileUrl);

  function handleDownload() {
    if (!invoice.fileUrl) return;
    window.open(invoice.fileUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="portal-lift flex flex-col gap-4 rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] text-muted-foreground">
            {invoice.number}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              config.className
            )}
          >
            {config.label}
          </span>
        </div>
        <p className="mt-1 text-[14px] font-medium">{invoice.title}</p>
        <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-tight">
          {formatCurrency(invoice.amount)}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Issued {formatDate(invoice.issuedAt)}
          {invoice.status === "paid" && invoice.paidAt
            ? ` · Paid ${formatDate(invoice.paidAt)}`
            : invoice.dueAt
              ? ` · Due ${formatDate(invoice.dueAt)}`
              : ""}
          {invoice.fileName ? ` · ${invoice.fileName}` : ""}
          {invoice.fileSize ? ` · ${invoice.fileSize}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {hasFile ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={handleDownload}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        ) : (
          <p className="text-[12px] text-muted-foreground">No file attached</p>
        )}
      </div>
    </div>
  );
}
