"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
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
import {
  CLIENT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  formatCurrency,
} from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Client, ProjectStatus } from "@/types";

interface ClientSettingsManagerProps {
  clientId: string;
}

export function ClientSettingsManager({ clientId }: ClientSettingsManagerProps) {
  const { client, updateClient, setActiveClientId, deleteClient } =
    useAdminClient(clientId);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    monthlyRetainer: "",
    status: "active" as Client["status"],
    projectStatus: "on_track" as ProjectStatus,
    projectName: "",
  });

  if (!client) return null;

  function openEdit() {
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

  function handleSave() {
    updateClient(clientId, {
      name: form.name,
      company: form.company,
      email: form.email,
      monthlyRetainer: Number(form.monthlyRetainer) || 0,
      status: form.status,
      projectStatus: form.projectStatus,
      projectName: form.projectName,
    });
    setEditOpen(false);
  }

  function handleDelete() {
    if (!client) return;
    if (
      confirm(
        `Delete ${client.company}? All associated data will be removed. This cannot be undone.`
      )
    ) {
      deleteClient(clientId);
      window.location.href = "/admin";
    }
  }

  function previewAsClient() {
    setActiveClientId(clientId);
    window.open("/", "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="admin-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold">Client Profile</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Controls what the client sees in their portal header and overview.
            </p>
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

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-destructive hover:text-destructive"
          onClick={handleDelete}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSave} className="rounded-full">Save Changes</Button>
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
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    monthlyRetainer: "",
    projectName: "Website Operations",
  });

  function handleAdd() {
    if (!form.company.trim() || !form.name.trim()) return;
    const client = addClient({
      name: form.name,
      company: form.company,
      email: form.email,
      monthlyRetainer: Number(form.monthlyRetainer) || 0,
      status: "active",
      projectStatus: "on_track",
      projectName: form.projectName,
    });
    setOpen(false);
    setForm({ name: "", company: "", email: "", monthlyRetainer: "", projectName: "Website Operations" });
    window.location.href = `/admin/clients/${client.id}/settings`;
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.company.trim()} className="rounded-full">Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

