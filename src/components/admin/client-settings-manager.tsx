"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Loader2, Upload } from "lucide-react";
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
import { useClientAuth } from "@/lib/client-auth";
import {
  CLIENT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  formatCurrency,
} from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Client, DocumentCategory, ProjectStatus } from "@/types";
import { ClientUsersManager } from "@/components/admin/client-users-manager";
import { ClientAvatar } from "@/components/shared/client-avatar";

interface ClientSettingsManagerProps {
  clientId: string;
}

export function ClientSettingsManager({ clientId }: ClientSettingsManagerProps) {
  const {
    client,
    documents,
    addDocument,
    updateClient,
    deleteClient,
    loadingData,
    refreshFromSupabase,
  } = useAdminClient(clientId);
  const { signInAsClient } = useClientAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    monthlyRetainer: "",
    status: "active" as Client["status"],
    projectStatus: "on_track" as ProjectStatus,
    projectName: "",
  });

  useEffect(() => {
    void refreshFromSupabase({ isAdmin: true });
  }, [refreshFromSupabase]);

  if (loadingData && !client) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile…
      </div>
    );
  }

  if (!client) {
    return (
      <p className="py-8 text-[13px] text-muted-foreground">
        Client not found in the database.
      </p>
    );
  }

  function openEdit() {
    setError(null);
    setForm({
      name: client!.name,
      company: client!.company,
      email: client!.email,
      monthlyRetainer: String(client!.monthlyRetainer),
      status: client!.status,
      projectStatus: client!.projectStatus,
      projectName: client!.projectName,
    });
    setEditOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateClient(clientId, {
      name: form.name,
      company: form.company,
      email: form.email,
      monthlyRetainer: Number(form.monthlyRetainer) || 0,
      status: form.status,
      projectStatus: form.projectStatus,
      projectName: form.projectName,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditOpen(false);
  }

  async function handleDelete() {
    if (!client) return;
    if (
      !confirm(
        `Delete ${client.company}? All associated data will be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    const result = await deleteClient(clientId);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    window.location.href = "/admin";
  }

  function previewAsClient() {
    signInAsClient(clientId, client!.email);
    window.open("/", "_blank");
  }

  async function handleLogoFile(file: File) {
    if (!client) return;
    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)) {
      setLogoError("Choose an image file (PNG, JPG, WebP, GIF, or SVG).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setLogoError("Logo must be 15 MB or smaller.");
      return;
    }

    setUploadingLogo(true);
    setLogoError(null);
    try {
      const body = new FormData();
      body.set("kind", "documents");
      body.set("file", file);
      body.set("asLogo", "true");
      body.set("name", "Logo");
      body.set("uploadedBy", "vitespace");
      body.set("company", client.company);

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
        size: string;
        fileUrl?: string;
        mimeType?: string;
        description?: string;
        uploadedBy?: "client" | "vitespace";
        uploadedByUserId?: string;
        uploadedByEmail?: string;
      };
      const avatarUrl = (data.avatar as string | undefined) || local?.fileUrl;
      if (avatarUrl) {
        await updateClient(clientId, { avatar: avatarUrl });
      }

      if (local) {
        const existing = documents.find((d) => d.id === local.id);
        if (!existing) {
          addDocument(clientId, {
            id: local.id,
            name: local.name || "Logo",
            category: (local.category as DocumentCategory) || "creative_assets",
            size: local.size,
            fileUrl: local.fileUrl,
            mimeType: local.mimeType,
            description: local.description,
            uploadedBy: local.uploadedBy,
            uploadedByUserId: local.uploadedByUserId,
            uploadedByEmail: local.uploadedByEmail,
          });
        }
      }

      await refreshFromSupabase({ isAdmin: true });
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <ClientAvatar
              src={client.avatar}
              name={client.company}
              rounded="xl"
              className="h-14 w-14 text-[16px]"
            />
            <div>
              <h3 className="text-[15px] font-semibold">Client Profile</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Loaded from the clients table. Edits save back to the database.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={previewAsClient}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview Portal
            </Button>
            <Button size="sm" className="rounded-full" onClick={openEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium">Client logo</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Uploads to this client's documents folder as Logo and becomes their
              profile picture.
            </p>
            {logoError && (
              <p className="mt-1.5 text-[12px] text-red-600">{logoError}</p>
            )}
          </div>
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (next) void handleLogoFile(next);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingLogo ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              {client.avatar ? "Replace logo" : "Upload logo"}
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Company" value={client.company} />
          <Field label="Contact" value={client.name} />
          <Field label="Email" value={client.email} />
          <Field label="Monthly Retainer" value={formatCurrency(client.monthlyRetainer)} />
          <Field label="Account Status" value={CLIENT_STATUS_LABELS[client.status]} />
          <Field label="Project Status" value={PROJECT_STATUS_LABELS[client.projectStatus]} />
          <Field label="Project Name" value={client.projectName} className="sm:col-span-2" />
          <Field
            label="Last Updated"
            value={formatRelativeTime(client.lastUpdatedAt)}
            className="sm:col-span-2"
          />
        </dl>
      </div>

      <ClientUsersManager clientId={clientId} />

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-destructive hover:text-destructive"
          onClick={() => void handleDelete()}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete Client
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <FieldInput label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <FieldInput label="Contact Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <FieldInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <FieldInput
              label="Monthly Retainer (INR)"
              value={form.monthlyRetainer}
              onChange={(v) => setForm({ ...form, monthlyRetainer: v })}
              type="number"
            />
            <FieldInput label="Project Name" value={form.projectName} onChange={(v) => setForm({ ...form, projectName: v })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Account Status</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v as Client["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLIENT_STATUS_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Project Health</Label>
                <Select value={form.projectStatus} onValueChange={(v) => v && setForm({ ...form, projectStatus: v as ProjectStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-full" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} className="rounded-full" disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[14px] font-medium">{value}</dd>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Add client dialog for dashboard */
export function AddClientDialog() {
  const { addClient } = usePortal();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    monthlyRetainer: "",
    projectName: "Website Operations",
  });

  async function handleAdd() {
    if (!form.company.trim() || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    const result = await addClient({
      name: form.name,
      company: form.company,
      email: form.email,
      monthlyRetainer: Number(form.monthlyRetainer) || 0,
      status: "active",
      projectStatus: "on_track",
      projectName: form.projectName,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setForm({ name: "", company: "", email: "", monthlyRetainer: "", projectName: "Website Operations" });
    window.location.href = `/admin/clients/${result.client.id}/settings`;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-full">
        <Plus className="mr-1.5 h-4 w-4" />
        Add Client
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <FieldInput label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <FieldInput label="Contact Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <FieldInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <FieldInput label="Monthly Retainer (INR)" value={form.monthlyRetainer} onChange={(v) => setForm({ ...form, monthlyRetainer: v })} type="number" />
            <FieldInput label="Project Name" value={form.projectName} onChange={(v) => setForm({ ...form, projectName: v })} />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleAdd()}
              disabled={!form.company.trim() || saving}
              className="rounded-full"
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
