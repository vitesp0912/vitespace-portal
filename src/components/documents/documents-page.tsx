"use client";

import { useState } from "react";
import { Search, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DocumentCategory } from "@/types";

export function DocumentsPage() {
  const { documents } = useClientPortal();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");

  const filtered = documents.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || doc.category === category;
    return matchSearch && matchCat;
  });

  const categories = Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[];

  function handleDownload(name: string) {
    alert(`Download for "${name}" will use signed URL from Supabase Storage when backend is wired.`);
  }

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Documents"
        description="Contracts, reports, deliverables, and assets — always accessible."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="rounded-full border-0 bg-muted/60 pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={category === "all"} onClick={() => setCategory("all")} label="All" />
        {categories.map((cat) => (
          <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)} label={DOCUMENT_CATEGORY_LABELS[cat]} />
        ))}
      </div>

      <ul className="divide-y divide-border/60 rounded-2xl bg-surface ring-1 ring-border/50">
        {filtered.length === 0 ? (
          <li className="px-5 py-12 text-center text-[13px] text-muted-foreground">No documents found.</li>
        ) : (
          filtered.map((doc) => (
            <li key={doc.id} className="group portal-lift flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">{doc.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {DOCUMENT_CATEGORY_LABELS[doc.category]} · {doc.size} · {formatDate(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleDownload(doc.name)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </li>
          ))
        )}
      </ul>
    </PortalPage>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all",
        active ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
