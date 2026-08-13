"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminClient, usePortal } from "@/lib/portal-store";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Document, DocumentCategory } from "@/types";

export function DocumentsManager({ clientId }: { clientId: string }) {
  const { getClient } = usePortal();
  const { documents, addDocument, updateDocument, deleteDocument } =
    useAdminClient(clientId);
  const client = getClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "project_documents" as DocumentCategory,
  });

  function openCreate() {
    setEditing(null);
    setFile(null);
    setError(null);
    setForm({ name: "", description: "", category: "project_documents" });
    setOpen(true);
  }

  function openEdit(doc: Document) {
    setEditing(doc);
    setFile(null);
    setError(null);
    setForm({
      name: doc.name,
      description: doc.description ?? "",
      category: doc.category,
    });
    setOpen(true);
  }

  async function handleSubmit() {
    setError(null);

    if (editing && !file) {
      if (!form.name.trim()) return;
      const result = await updateDocument(editing.id, {
        name: form.name,
        description: form.description.trim(),
        category: form.category,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      return;
    }

    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.set("kind", "documents");
      body.set("file", file);
      body.set("name", form.name.trim() || file.name);
      body.set("description", form.description.trim());
      body.set("category", form.category);
      body.set("uploadedBy", "vitespace");
      if (client?.company) body.set("company", client.company);

      const res = await fetch(`/api/clients/${clientId}/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const local = data.local as {
        id: string;
        name: string;
        category: string;
        uploadedAt: string;
        size: string;
        fileUrl?: string;
        mimeType?: string;
        description?: string;
        uploadedBy?: "client" | "vitespace";
        uploadedByUserId?: string;
        uploadedByEmail?: string;
      };

      const payload = {
        id: local.id,
        name: local.name,
        category: (local.category as DocumentCategory) || form.category,
        size: local.size,
        fileUrl: local.fileUrl,
        mimeType: local.mimeType,
        description: local.description,
        uploadedBy: local.uploadedBy,
        uploadedByUserId: local.uploadedByUserId,
        uploadedByEmail: local.uploadedByEmail,
      };

      if (editing && local.id !== editing.id) {
        deleteDocument(editing.id);
      }
      addDocument(clientId, payload);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Document
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {documents.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-muted-foreground">
            No documents yet.
          </li>
        ) : (
          documents.map((doc) => (
            <li
              key={doc.id}
              className="group flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{doc.name}</p>
                {doc.description && (
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">
                    {doc.description}
                  </p>
                )}
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {DOCUMENT_CATEGORY_LABELS[doc.category]} · {doc.size} ·{" "}
                  {formatDate(doc.uploadedAt)}
                  {doc.uploadedByEmail ? ` · ${doc.uploadedByEmail}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {doc.fileUrl && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    title="Open file"
                    onClick={() =>
                      window.open(doc.fileUrl, "_blank", "noopener,noreferrer")
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => openEdit(doc)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => deleteDocument(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] overflow-x-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Document</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 max-w-full gap-4 overflow-x-hidden py-1">
            <div className="min-w-0 max-w-full space-y-1.5 overflow-hidden">
              <Label>File {!editing && "(required)"}</Label>
              <input
                type="file"
                className="sr-only"
                id="document-file-input"
                disabled={uploading}
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  setFile(next);
                  if (next && !form.name.trim()) {
                    setForm((f) => ({ ...f, name: next.name }));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={uploading}
                onClick={() =>
                  document.getElementById("document-file-input")?.click()
                }
              >
                Choose file
              </Button>
              <p
                className="max-w-full overflow-hidden break-all text-[13px] text-muted-foreground"
                title={file?.name}
              >
                {file
                  ? file.name
                  : editing
                    ? "Keep current file, or choose a new one"
                    : "No file chosen"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Defaults to uploaded filename"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Add a note about this file…"
                rows={3}
                className="min-h-0 resize-none"
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  v && setForm({ ...form, category: v as DocumentCategory })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {DOCUMENT_CATEGORY_LABELS[form.category]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              className="rounded-full"
              disabled={uploading}
            >
              {uploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Upload & Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
