"use client";

import { useRef, useState } from "react";
import { Search, FileText, Upload, Loader2, Eye, X, Pencil, Check } from "lucide-react";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Document | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
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
    setTitle("");
    setDescription("");
    setFile(null);
    setUploadPercent(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadOpen(true);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!next) return;

    if (next.size > MAX_BYTES) {
      setError("File must be 15 MB or smaller.");
      return;
    }

    setError(null);
    setFile(next);
    if (!title.trim()) setTitle(next.name.replace(/\.[^.]+$/, "") || next.name);

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
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
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
    body.set("name", title.trim());
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
      name: local.name,
      description: local.description || description.trim() || undefined,
      category: (local.category as DocumentCategory) || "project_documents",
      size: local.size,
      fileUrl: local.fileUrl,
      mimeType: local.mimeType || file.type || undefined,
      uploadedByUserId: local.uploadedByUserId,
    });

    setUploadOpen(false);
    setFile(null);
    setTitle("");
    setDescription("");
    setUploadPercent(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploading(false);
  }

  function startEditTitle(doc: Document) {
    setEditingId(doc.id);
    setEditTitle(doc.name);
    setError(null);
  }

  async function saveTitle() {
    if (!editingId || !editTitle.trim() || savingTitle) return;
    setSavingTitle(true);
    const result = await updateDocument(editingId, { name: editTitle.trim() });
    setSavingTitle(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setEditTitle("");
  }

  const pickKind = file ? getDocumentMediaKind(file.type, file.name) : "other";

  return (
    <PortalPage className="space-y-8">
      <PortalSectionHeader
        title="Documents"
        description="Upload files with a title and note. Photos and videos preview instantly."
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
            const isEditing = editingId === doc.id;

            return (
              <li key={doc.id} className="group/doc px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void saveTitle();
                                }
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-full"
                              onClick={() => setEditingId(null)}
                              disabled={savingTitle}
                              aria-label="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              className="rounded-full"
                              onClick={() => void saveTitle()}
                              disabled={!editTitle.trim() || savingTitle}
                              aria-label="Save title"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-medium">{doc.name}</p>
                            <button
                              type="button"
                              className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/doc:opacity-100"
                              onClick={() => startEditTitle(doc)}
                              aria-label="Edit title"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {doc.description && (
                          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                            {doc.description}
                          </p>
                        )}
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

                  {showView && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-full"
                      onClick={() => setViewer(doc)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      View
                    </Button>
                  )}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                disabled={uploading}
                className="block w-full text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-[12px] file:font-medium"
                onChange={onPickFile}
              />
              <p className="text-[11px] text-muted-foreground">Any file type · max 15 MB</p>
            </div>

            {previewUrl && pickKind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 w-full rounded-xl object-cover ring-1 ring-border/60"
              />
            )}
            {previewUrl && pickKind === "video" && (
              <video
                src={previewUrl}
                controls
                className="max-h-48 w-full rounded-xl ring-1 ring-border/60"
              />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-text">Text / note</Label>
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
              disabled={uploading || !file || !title.trim()}
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
