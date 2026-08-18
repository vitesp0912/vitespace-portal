"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Loader2,
  Eye,
  X,
  Pencil,
  Check,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Film,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientAuth } from "@/lib/client-auth";
import { useClientPortal } from "@/lib/portal-store";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { getDocumentMediaKind } from "@/lib/document-media";
import { uploadFormDataWithProgress } from "@/lib/upload-progress";
import { cn } from "@/lib/utils";
import { FitLabel, FILTER_SELECT_TRIGGER } from "@/components/ui/fit-label";
import type { Document, DocumentCategory } from "@/types";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export function DocumentsPage() {
  const { session } = useClientAuth();
  const { clientId, client, documents, addDocument, updateDocument } =
    useClientPortal();
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [uploadCategory, setUploadCategory] =
    useState<DocumentCategory>("project_documents");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Document | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter(
    (doc) => category === "all" || doc.category === category
  );

  function openUploadDialog() {
    setError(null);
    if (!clientId) {
      setError("Not signed in to a client account yet. Refresh and try again.");
      return;
    }
    setDescription("");
    setUploadCategory("project_documents");
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
    body.set("name", file.name);
    body.set("description", description.trim());
    body.set("uploadedBy", "client");
    body.set("category", uploadCategory);
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
        uploadedBy?: "client" | "vitespace";
        uploadedByUserId?: string;
        uploadedByEmail?: string;
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
      category: (local.category as DocumentCategory) || uploadCategory,
      size: local.size,
      fileUrl: local.fileUrl,
      mimeType: local.mimeType || file.type || undefined,
      uploadedBy: local.uploadedBy,
      uploadedByUserId: local.uploadedByUserId,
      uploadedByEmail: local.uploadedByEmail,
    });

    setUploadOpen(false);
    setFile(null);
    setDescription("");
    setUploadPercent(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploading(false);
  }

  function canEditDocument(doc: Document) {
    return Boolean(session?.userId && doc.uploadedByUserId === session.userId);
  }

  function startEditNote(doc: Document) {
    if (!canEditDocument(doc)) return;
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
  const categoryLabel =
    category === "all" ? "All types" : DOCUMENT_CATEGORY_LABELS[category];

  return (
    <PortalPage className="space-y-6 sm:space-y-8">
      <PortalSectionHeader
        title="Documents"
        description="Upload files with an optional note. The file name stays as the title."
        className="lg:items-center"
        action={
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end sm:gap-2">
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v as DocumentCategory | "all")}
            >
              <SelectTrigger className={FILTER_SELECT_TRIGGER}>
                <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue>
                  <FitLabel>{categoryLabel}</FitLabel>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                <SelectItem value="all">All types</SelectItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="h-11 w-full rounded-xl px-4 text-sm sm:w-44"
              onClick={openUploadDialog}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload file
            </Button>
          </div>
        }
      />

      {error && !uploadOpen && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-700 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-5 py-12 text-center ring-1 ring-border/50">
            <p className="text-[13px] text-muted-foreground">
              {documents.length === 0
                ? "No documents yet."
                : "No documents match this filter."}
            </p>
            {documents.length === 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={openUploadDialog}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Upload file
              </Button>
            )}
          </li>
        ) : (
          filtered.map((doc) => {
            const kind = getDocumentMediaKind(doc.mimeType, doc.name);
            const showView =
              Boolean(doc.fileUrl) && (kind === "image" || kind === "video");
            const isEditingNote = editingNoteId === doc.id;
            const ThumbIcon =
              kind === "image" ? ImageIcon : kind === "video" ? Film : FileText;

            return (
              <li
                key={doc.id}
                className="group/doc overflow-hidden rounded-2xl bg-surface p-4 ring-1 ring-border/50 sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {kind === "image" && doc.fileUrl ? (
                      <button
                        type="button"
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/60"
                        onClick={() => setViewer(doc)}
                        aria-label={`Preview ${doc.name}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={doc.fileUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                        <ThumbIcon className="h-4 w-4" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className="break-all text-[14px] font-medium leading-snug sm:truncate"
                        title={doc.name}
                      >
                        {doc.name}
                      </p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
                      </p>

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
                      ) : (
                        <div className="mt-1.5 flex items-start gap-2">
                          {doc.description ? (
                            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                              {doc.description}
                            </p>
                          ) : canEditDocument(doc) ? (
                            <p className="min-w-0 flex-1 text-[13px] text-muted-foreground/70">
                              No note yet
                            </p>
                          ) : null}
                          {canEditDocument(doc) && (
                            <button
                              type="button"
                              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-opacity hover:text-foreground md:opacity-0 md:group-hover/doc:opacity-100"
                              onClick={() => startEditNote(doc)}
                              aria-label="Edit note"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      <p className="mt-1.5 text-[12px] text-muted-foreground">
                        {doc.size}
                        {" · "}
                        {doc.editedAt
                          ? `Edited ${formatDateTime(doc.editedAt)}`
                          : formatDate(doc.uploadedAt)}
                        {doc.uploadedByEmail ? (
                          <span className="hidden sm:inline">
                            {" · "}
                            {doc.uploadedByEmail}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "grid shrink-0 gap-2 sm:flex sm:items-center",
                      showView ? "grid-cols-2" : "grid-cols-1"
                    )}
                  >
                    {doc.fileUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-full rounded-xl sm:w-auto"
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
                        className="h-9 w-full rounded-xl sm:w-auto"
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
            <div className="min-w-0 max-w-full space-y-1.5">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                disabled={uploading}
                className="sr-only"
                onChange={onPickFile}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/70 disabled:opacity-50"
              >
                <span className="min-w-0 truncate text-[13px] text-muted-foreground">
                  {file ? file.name : "Choose a file"}
                </span>
                <span className="shrink-0 text-[12px] font-medium text-foreground">
                  Browse
                </span>
              </button>
              <p className="text-[11px] text-muted-foreground">
                Any file type · max 15 MB
              </p>
            </div>

            {previewUrl && pickKind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-40 w-full max-w-full rounded-xl object-cover ring-1 ring-border/60"
              />
            )}
            {previewUrl && pickKind === "video" && (
              <video
                src={previewUrl}
                controls
                className="max-h-40 w-full max-w-full rounded-xl ring-1 ring-border/60"
              />
            )}

            <div className="min-w-0 space-y-1.5">
              <Label>Type</Label>
              <Select
                value={uploadCategory}
                onValueChange={(v) =>
                  v && setUploadCategory(v as DocumentCategory)
                }
                disabled={uploading}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue>
                    {DOCUMENT_CATEGORY_LABELS[uploadCategory]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 max-w-full space-y-1.5">
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
              className="w-full rounded-xl sm:w-auto"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full rounded-xl sm:w-auto"
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
        <DialogContent className="w-[calc(100%-2rem)] max-h-[min(90dvh,900px)] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8 break-all">{viewer?.name}</DialogTitle>
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
            className="w-full rounded-xl sm:w-auto"
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
