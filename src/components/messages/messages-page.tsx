"use client";

import { useState } from "react";
import { Send, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function MessagesPage() {
  const { clientId, messages, addMessage, updateMessage } = useClientPortal();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleSend() {
    if (!draft.trim() || !clientId || sending) return;
    setSending(true);
    setError(null);
    const result = await addMessage(clientId, { content: draft.trim() }, "client");
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft("");
  }

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditDraft(msg.content);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit() {
    if (!editingId || !editDraft.trim() || savingEdit) return;
    setSavingEdit(true);
    setError(null);
    const result = await updateMessage(editingId, editDraft);
    setSavingEdit(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setEditDraft("");
  }

  return (
    <PortalPage className="flex min-h-[calc(100vh-140px)] flex-col space-y-6 pb-24 lg:pb-8">
      <PortalSectionHeader
        title="Messages"
        description="Chat with the Vitespace team about your project."
      />

      <div className="flex-1 rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 sm:p-6">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-muted-foreground">
            No messages yet. Send the first one below.
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isClient = msg.sender === "client";
              const isEditing = editingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", isClient && "flex-row-reverse")}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold",
                        msg.sender === "vitespace"
                          ? "bg-brand/10 text-brand"
                          : "bg-muted"
                      )}
                    >
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[80%]", isClient && "text-right")}>
                    <p className="text-[11px] text-muted-foreground">
                      {msg.senderName} ·{" "}
                      {msg.editedAt
                        ? `Edited ${formatDateTime(msg.editedAt)}`
                        : formatDateTime(msg.timestamp)}
                    </p>

                    {isEditing ? (
                      <div className="mt-1 space-y-2 text-left">
                        <Textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          className="min-h-0 resize-none text-[13px]"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            className="rounded-full"
                            onClick={saveEdit}
                            disabled={!editDraft.trim() || savingEdit}
                            aria-label="Save edit"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "group/msg relative mt-1 inline-block rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                          msg.sender === "vitespace"
                            ? "rounded-tl-sm bg-muted/70 text-foreground"
                            : "rounded-tr-sm bg-brand text-white"
                        )}
                      >
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                        {isClient && (
                          <button
                            type="button"
                            className={cn(
                              "absolute -left-8 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-0 transition-opacity group-hover/msg:opacity-100",
                              "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => startEdit(msg)}
                            aria-label="Edit message"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-20 rounded-2xl bg-surface p-3 portal-shadow ring-1 ring-border/50 lg:bottom-4">
        {error && (
          <p className="mb-2 px-1 text-[12px] text-red-600">{error}</p>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent focus-visible:ring-0"
            disabled={sending}
          />
          <Button
            size="icon-sm"
            className="self-end rounded-full"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PortalPage>
  );
}
