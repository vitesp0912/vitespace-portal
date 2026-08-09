"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminClient } from "@/lib/portal-store";
import { formatRelativeTime } from "@/lib/format";
import type { Notification } from "@/types";

export function NotificationsManager({ clientId }: { clientId: string }) {
  const { notifications, addNotification, updateNotification, deleteNotification } =
    useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Notification | null>(null);
  const [form, setForm] = useState({ title: "", message: "", href: "/", read: false });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", message: "", href: "/", read: false });
    setOpen(true);
  }

  function openEdit(n: Notification) {
    setEditing(n);
    setForm({ title: n.title, message: n.message, href: n.href, read: n.read });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    if (editing) updateNotification(editing.id, form);
    else addNotification(clientId, form);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{notifications.length} notification(s) in client bell menu.</p>
        <Button onClick={openCreate} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Notification</Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {notifications.map((n) => (
          <li key={n.id} className="group flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium">{n.title}</p>
                {!n.read && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">Unread</span>}
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">→ {n.href} · {formatRelativeTime(n.timestamp)}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(n)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => deleteNotification(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Notification</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Link (href)</Label><Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/approvals" /></div>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.read} onChange={(e) => setForm({ ...form, read: e.target.checked })} />
              Mark as read
            </label>
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
