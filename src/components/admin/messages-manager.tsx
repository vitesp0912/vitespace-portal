"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { MESSAGE_CONTEXT_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { ConversationContext } from "@/types";

export function MessagesManager({ clientId }: { clientId: string }) {
  const { messages, addMessage, deleteMessage } = useAdminClient(clientId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    content: "",
    context: "project" as ConversationContext,
    contextLabel: "General",
    contextHref: "",
    sender: "vitespace" as "client" | "vitespace",
  });

  function handleSubmit() {
    if (!form.content.trim()) return;
    addMessage(
      clientId,
      {
        content: form.content,
        context: form.context,
        contextLabel: form.contextLabel,
        contextHref: form.contextHref || undefined,
      },
      form.sender
    );
    setForm({ content: "", context: "project", contextLabel: "General", contextHref: "", sender: "vitespace" });
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">{messages.length} message(s) in client thread.</p>
        <Button onClick={() => setOpen(true)} className="rounded-full"><Plus className="mr-1.5 h-4 w-4" />Add Message</Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/80">
        {messages.map((msg) => (
          <li key={msg.id} className="group flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-[12px] text-muted-foreground">
                {msg.senderName} · {MESSAGE_CONTEXT_LABELS[msg.context]} · {msg.contextLabel} · {formatDateTime(msg.timestamp)}
              </p>
              <p className="mt-1 text-[14px]">{msg.content}</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="rounded-full opacity-0 group-hover:opacity-100" onClick={() => deleteMessage(msg.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Message</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5"><Label>Message</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sender</Label>
                <Select value={form.sender} onValueChange={(v) => v && setForm({ ...form, sender: v as "client" | "vitespace" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="vitespace">Vitespace</SelectItem><SelectItem value="client">Client</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Context</Label>
                <Select value={form.context} onValueChange={(v) => v && setForm({ ...form, context: v as ConversationContext })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(MESSAGE_CONTEXT_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Context Label</Label><Input value={form.contextLabel} onChange={(e) => setForm({ ...form, contextLabel: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Context Link</Label><Input value={form.contextHref} onChange={(e) => setForm({ ...form, contextHref: e.target.value })} placeholder="/progress" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-full">Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
