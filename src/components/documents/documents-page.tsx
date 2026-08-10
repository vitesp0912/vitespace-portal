"use client";

import { useRef, useState } from "react";
import { Search, FileText, Upload, Loader2, Eye, X, Pencil, Check, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { getDocumentMediaKind } from "@/lib/document-media";
import { uploadFormDataWithProgress } from "@/lib/upload-progress";
import { cn } from "@/lib/utils";
import type { Document, DocumentCategory } from "@/types";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export function DocumentsPage() {
  const { clientId, client, documents, addDocument, updateDocument } = useClientPortal();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Document | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || doc.category === category;
    return matchSearch && matchCat;
  });

  const categories = Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[];

  function openUploadDialog() {
    setError(null);
    if (!clientId) {
      setError("Not signed in to a client account yet. Refresh and try again.");
      return;
    }
    setDescription("");
    setFile(null);
    setUploadPercent(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadOpen(true);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    if (!next) return;

    if (next.size > MAX_BYTES) {
      setError("File must be 15 MB or smaller.");
      e.target.value = "";
      return;
    }

    setError(null);
    setFile(next);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const kind = getDocumentMediaKind(next.type, next.name);
    if (kind === "image" || kind === "video") {
      setPreviewUrl(URL.createObjectURL(next));
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleUpload() {
    if (!clientId || !file || uploading) return;
    if (file.size > MAX_BYTES) {
      setError("File must be 15 MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setError(null);

    const body = new FormData();
    body.set("kind", "documents");
    body.set("file", file);
    // Asset title stays the original filename — not editable
    body.set("name", file.name);
    body.set("description", description.trim());
    body.set("uploadedBy", "client");
    body.set("category", "project_documents");
    if (client?.company) body.set("company", client.company);

    const result = await uploadFormDataWithProgress(
      `/api/clients/${clientId}/upload`,
      body,
      setUploadPercent
    );

    if (!result.ok) {
      setError(result.error);
      setUploading(false);
      return;
    }

    const payload = result.data as {
      local?: {
        id: string;
        name: string;
        description?: string;
        category: string;
        size: string;
        fileUrl?: string;
        mimeType?: string;
        uploadedByUserId?: string;
      };
    };

    const local = payload.local;
    if (!local) {
      setError("Upload succeeded but response was incomplete.");
      setUploading(false);
      return;
    }

    addDocument(clientId, {
      id: local.id,
      name: local.name || file.name,
      description: local.description || description.trim() || undefined,
      category: (local.category as DocumentCategory) || "project_documents",
      size: local.size,
      fileUrl: local.fileUrl,
      mimeType: local.mimeType || file.type || undefined,
      uploadedByUserId: local.uploadedByUserId,
    });

    setUploadOpen(false);
    setFile(null);
    setDescription("");
    setUploadPercent(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploading(false);
  }

  function startEditNote(doc: Document) {
    setEditingNoteId(doc.id);
    setEditNote(doc.description ?? "");
    setError(null);
  }

  async function saveNote() {
    if (!editingNoteId || savingNote) return;
    setSavingNote(true);
    const result = await updateDocument(editingNoteId, {
      description: editNote.trim(),
    });
    setSavingNote(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditingNoteId(null);
    setEditNote("");
  }

  const pickKind = file ? getDocumentMediaKind(file.type, file.name) : "other";

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Documents"
        description="Upload files with an optional note. The file name stays as the title."
        action={
          <Button type="button" className="rounded-full" onClick={openUploadDialog}>
            <Upload className="mr-1.5 h-4 w-4" />
            Upload file
          </Button>
        }
      />

      {error && !uploadOpen && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-700 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

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
          <FilterChip
            key={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
            label={DOCUMENT_CATEGORY_LABELS[cat]}
          />
        ))}
      </div>

      <ul className="divide-y divide-border/60 rounded-2xl bg-surface ring-1 ring-border/50">
        {filtered.length === 0 ? (
          <li className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">No documents yet.</p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={openUploadDialog}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload file
            </Button>
          </li>
        ) : (
          filtered.map((doc) => {
            const kind = getDocumentMediaKind(doc.mimeType, doc.name);
            const showView = Boolean(doc.fileUrl) && (kind === "image" || kind === "video");
            const isEditingNote = editingNoteId === doc.id;

            return (
              <li key={doc.id} className="group/doc px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium">{doc.name}</p>

                        {isEditingNote ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              rows={3}
                              className="min-h-0 resize-none text-[13px]"
                              placeholder="Add a note about this file…"
                              autoFocus
                            />
                            <div className="flex gap-1.5">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-full"
                                onClick={() => setEditingNoteId(null)}
                                disabled={savingNote}
                                aria-label="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                className="rounded-full"
                                onClick={() => void saveNote()}
                                disabled={savingNote}
                                aria-label="Save note"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : doc.description ? (
                          <div className="mt-1 flex items-start gap-2">
                            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                              {doc.description}
                            </p>
                            <button
                              type="button"
                              className="shrink-0 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/doc:opacity-100"
                              onClick={() => startEditNote(doc)}
                              aria-label="Edit note"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}

                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {doc.size}
                          {" · "}
                          {doc.editedAt
                            ? `Edited ${formatDateTime(doc.editedAt)}`
                            : formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {doc.fileUrl && kind === "image" && (
                      <button
                        type="button"
                        className="mt-3 block overflow-hidden rounded-xl ring-1 ring-border/60"
                        onClick={() => setViewer(doc)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={doc.fileUrl}
                          alt={doc.name}
                          className="max-h-56 w-full max-w-md object-cover"
                        />
                      </button>
                    )}

                    {doc.fileUrl && kind === "video" && (
                      <video
                        src={doc.fileUrl}
                        controls
                        className="mt-3 max-h-56 w-full max-w-md rounded-xl ring-1 ring-border/60"
                      />
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {doc.fileUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() =>
                          window.open(doc.fileUrl, "_blank", "noopener,noreferrer")
                        }
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                    )}
                    {showView && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setViewer(doc)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (uploading) return;
          setUploadOpen(open);
        }}
      >
        <DialogContent className="w-full max-w-[calc(100%-2rem)] overflow-x-hidden sm:max-w-md">
          <DialogHeader className="min-w-0">
            <DialogTitle>Upload file</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 max-w-full gap-4 overflow-x-hidden py-1">
            <div className="min-w-0 max-w-full space-y-1.5 overflow-hidden">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                disabled={uploading}
                className="sr-only"
                onChange={onPickFile}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
              <p
                className="max-w-full overflow-hidden break-all text-[13px] text-muted-foreground"
                title={file?.name}
              >
                {file ? file.name : "No file chosen"}
              </p>
              <p className="text-[11px] text-muted-foreground">Any file type · max 15 MB</p>
            </div>

            {previewUrl && pickKind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 w-full max-w-full rounded-xl object-cover ring-1 ring-border/60"
              />
            )}
            {previewUrl && pickKind === "video" && (
              <video
                src={previewUrl}
                controls
                className="max-h-48 w-full max-w-full rounded-xl ring-1 ring-border/60"
              />
            )}

            <div className="min-w-0 max-w-full space-y-1.5 overflow-hidden">
              <Label htmlFor="doc-text">Note (optional)</Label>
              <Textarea
                id="doc-text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note about this file…"
                rows={3}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Uploading…</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {uploadPercent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-150 ease-out"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {error && uploadOpen && (
              <p className="text-[13px] text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => void handleUpload()}
              disabled={uploading || !file}
            >
              {uploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {uploading ? `${uploadPercent}%` : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewer)} onOpenChange={(open) => !open && setViewer(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{viewer?.name}</DialogTitle>
          </DialogHeader>
          {viewer?.fileUrl &&
            getDocumentMediaKind(viewer.mimeType, viewer.name) === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewer.fileUrl}
                alt={viewer.name}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            )}
          {viewer?.fileUrl &&
            getDocumentMediaKind(viewer.mimeType, viewer.name) === "video" && (
              <video
                src={viewer.fileUrl}
                controls
                autoPlay
                className="max-h-[70vh] w-full rounded-xl"
              />
            )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setViewer(null)}
          >
            <X className="mr-1.5 h-4 w-4" />
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </PortalPage>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "bg-foreground text-background"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
