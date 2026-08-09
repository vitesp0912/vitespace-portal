"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { useAdminClient } from "@/lib/portal-store";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, PROJECT_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Document, DocumentCategory } from "@/types";

export function DocumentsManager({ clientId }: { clientId: string }) {
  const { documents, addDocument, updateDocument, deleteDocument } = useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "project_documents" as DocumentCategory,
    size: "1 MB",
    project: "",
    fileUrl: "",
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", category: "project_documents", size: "1 MB", project: "", fileUrl: "" });
    setOpen(true);
  }

  function openEdit(doc: Document) {
    setEditing(doc);
    setForm({ name: doc.name, category: doc.category, size: doc.size, project: doc.project ?? "", fileUrl: doc.fileUrl ?? "" });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      category: form.category,
      size: form.size,
      project: form.project || undefined,
      fileUrl: form.fileUrl || undefined,
    };
    if (editing) updateDocument(editing.id, payload);
    else addDocument(clientId, payload);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{documents.length} document(s) in client library.</p>
        <Button onClick={openCreate} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Document</Button>
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
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(doc)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteDocument(doc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Document</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Report.pdf" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as DocumentCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOCUMENT_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Size</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Project (optional)</Label>
              <Select value={form.project || "__none"} onValueChange={(v) => setForm({ ...form, project: v === "__none" ? "" : (v ?? "") })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {PROJECT_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>File URL (optional, for backend)</Label><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-full">{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
