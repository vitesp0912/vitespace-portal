"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, PROJECT_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Document, DocumentCategory } from "@/types";

export function DocumentsManager({ clientId }: { clientId: string }) {
  const { getClient } = usePortal();
  const { documents, addDocument, updateDocument, deleteDocument } = useAdminClient(clientId);
  const client = getClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "project_documents" as DocumentCategory,
    project: "",
  });

  function openCreate() {
    setEditing(null);
    setFile(null);
    setError(null);
    setForm({ name: "", category: "project_documents", project: "" });
    setOpen(true);
  }

  function openEdit(doc: Document) {
    setEditing(doc);
    setFile(null);
    setError(null);
    setForm({
      name: doc.name,
      category: doc.category,
      project: doc.project ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit() {
    setError(null);

    if (editing && !file) {
      if (!form.name.trim()) return;
      await updateDocument(editing.id, {
        name: form.name,
        category: form.category,
        project: form.project || undefined,
      });
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
        name: string;
        category: string;
        uploadedAt: string;
        size: string;
        fileUrl?: string;
      };

      if (editing) {
        await updateDocument(editing.id, {
          name: local.name,
          category: (local.category as DocumentCategory) || form.category,
          size: local.size,
          project: form.project || undefined,
          fileUrl: local.fileUrl,
        });
      } else {
        addDocument(clientId, {
          name: local.name,
          category: (local.category as DocumentCategory) || form.category,
          size: local.size,
          project: form.project || undefined,
          fileUrl: local.fileUrl,
        });
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          {documents.length} document(s). Files go to R2 under{" "}
          <span className="font-medium text-foreground">
            {client?.company || "Company"}/documents/
          </span>
        </p>
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Document
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {documents.map((doc) => (
          <li key={doc.id} className="group flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-[14px] font-medium">{doc.name}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {DOCUMENT_CATEGORY_LABELS[doc.category]} · {doc.size} · {formatDate(doc.uploadedAt)}
                {doc.project && ` · ${doc.project}`}
              </p>
            </div>
            <div className="flex gap-1">
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
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label>File {!editing && "(required)"}</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  setFile(next);
                  if (next && !form.name.trim()) {
                    setForm((f) => ({ ...f, name: next.name }));
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Stored as{" "}
                {client?.company || "Company"}
                /documents/
                {file?.name || "original-filename"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Defaults to uploaded filename"
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
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label>Project (optional)</Label>
              <Select
                value={form.project || "__none"}
                onValueChange={(v) =>
                  setForm({ ...form, project: v === "__none" ? "" : (v ?? "") })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {PROJECT_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
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
            <Button onClick={handleSubmit} className="rounded-full" disabled={uploading}>
              {uploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Upload & Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
