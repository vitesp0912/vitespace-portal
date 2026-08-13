"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Pencil, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminClient } from "@/lib/portal-store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function MessagesManager({ clientId }: { clientId: string }) {
  const { client, messages, addMessage, updateMessage, deleteMessage } =
    useAdminClient(clientId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    const result = await addMessage(
      clientId,
      { content: draft.trim() },
      "vitespace"
    );
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

  function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    deleteMessage(id);
    if (editingId === id) cancelEdit();
  }

  return (
    <div className="flex min-h-[calc(100vh-220px)] flex-col gap-15">
      <div className="flex-1 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-border/80 sm:p-6">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-muted-foreground">
            No messages yet. Send the first one below.
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender === "vitespace";
              const isEditing = editingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", isMine && "flex-row-reverse")}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold",
                        isMine ? "bg-brand/10 text-brand" : "bg-muted"
                      )}
                    >
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[80%]", isMine && "text-right")}>
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
                            onClick={() => void saveEdit()}
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
                          isMine
                            ? "rounded-tr-sm bg-brand text-white"
                            : "rounded-tl-sm bg-muted/70 text-foreground"
                        )}
                      >
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                        <div
                          className={cn(
                            "absolute top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100",
                            isMine ? "-left-16" : "-right-16"
                          )}
                        >
                          {isMine && (
                            <button
                              type="button"
                              className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(msg)}
                              aria-label="Edit message"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(msg.id)}
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-4 rounded-2xl bg-card p-3 ring-1 ring-border/80">
        {error && (
          <p className="mb-2 px-1 text-[12px] text-red-600">{error}</p>
        )}
        <p className="mb-1.5 px-1 text-[11px] text-muted-foreground">
          Replying as Vitespace
          {client?.company ? ` to ${client.company}` : ""}
        </p>
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
    </div>
  );
}
