"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePortal } from "@/lib/portal-store";
import type { Service } from "@/types";

/** Global services catalog — managed on the admin home page. */
export function ServicesManager() {
  const { getServices, addService, updateService, deleteService } = usePortal();
  const services = getServices();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setName(service.name);
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const result = editing
      ? await updateService(editing.id, { name })
      : await addService({ name });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    const result = await deleteService(id);
    if (!result.ok) alert(result.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold">Services</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Global catalog. Assign any service to tasks across all clients.
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="shrink-0 rounded-full">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Service
        </Button>
      </div>

      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {services.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-muted-foreground">
            No services yet. Add ones like Development, SEO, Creative…
          </li>
        ) : (
          services.map((svc) => (
            <li
              key={svc.id}
              className="group flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <p className="text-[14px] font-medium">{svc.name}</p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => openEdit(svc)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => void handleDelete(svc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Development"
              />
            </div>
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void handleSave()}
              disabled={saving || !name.trim()}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
