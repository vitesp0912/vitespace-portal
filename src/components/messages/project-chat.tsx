"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { chatDayKey, formatChatDay, formatChatTime } from "@/lib/format";
import type { Message } from "@/types";
import { ClientAvatar } from "@/components/shared/client-avatar";

const CLUSTER_MS = 5 * 60 * 1000;
const PIN_LINE = 22;

type MsgRow = {
  message: Message;
  grouped: boolean;
  showMeta: boolean;
};

type DayGroup = {
  key: string;
  label: string;
  messages: MsgRow[];
};

function buildDayGroups(messages: Message[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let lastSender = "";
  let lastTs = 0;
  let lastDay = "";

  messages.forEach((message, index) => {
    const day = chatDayKey(message.timestamp);
    if (day !== lastDay) {
      groups.push({
        key: day,
        label: formatChatDay(message.timestamp),
        messages: [],
      });
      lastDay = day;
      lastSender = "";
      lastTs = 0;
    }

    const ts = new Date(message.timestamp).getTime();
    const grouped = message.sender === lastSender && ts - lastTs < CLUSTER_MS;
    const next = messages[index + 1];
    const nextTs = next ? new Date(next.timestamp).getTime() : 0;
    const showMeta = !(
      next &&
      next.sender === message.sender &&
      chatDayKey(next.timestamp) === day &&
      nextTs - ts < CLUSTER_MS
    );

    groups[groups.length - 1].messages.push({ message, grouped, showMeta });
    lastSender = message.sender;
    lastTs = ts;
  });

  return groups;
}

function MessageFace({
  kind,
  name,
  avatar,
  visible,
}: {
  kind: "vitespace" | "client";
  name: string;
  avatar?: string | null;
  visible: boolean;
}) {
  return (
    <div
      className={cn("h-7 w-7 shrink-0", !visible && "opacity-0")}
      aria-hidden={!visible}
    >
      {kind === "vitespace" ? (
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-black">
          <img src="/logo.png" alt="" className="h-4 w-4 object-contain" />
        </span>
      ) : (
        <ClientAvatar src={avatar} name={name} className="h-7 w-7 text-[10px]" />
      )}
    </div>
  );
}

export function ChatFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[min(42rem,calc(100dvh-8rem))] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border/50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ProjectChat({
  title,
  subtitle,
  messages,
  outgoingSender,
  clientAvatar,
  onSend,
  onEdit,
  canEdit,
  sending = false,
  error = null,
}: {
  title: string;
  subtitle?: string;
  messages: Message[];
  outgoingSender: "client" | "vitespace";
  clientAvatar?: string | null;
  onSend: (content: string) => Promise<boolean | void>;
  onEdit?: (id: string, content: string) => Promise<void>;
  canEdit?: (message: Message) => boolean;
  sending?: boolean;
  error?: string | null;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const groups = useMemo(() => buildDayGroups(messages), [messages]);

  const updatePinnedDay = useCallback(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const markers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-chat-day]")
    );
    if (markers.length === 0) {
      setPinnedLabel("");
      return;
    }

    const rootTop = root.getBoundingClientRect().top;
    let active = markers[0];
    for (const marker of markers) {
      if (marker.getBoundingClientRect().top - rootTop <= PIN_LINE) {
        active = marker;
      }
    }
    setPinnedLabel(active.dataset.dayLabel ?? "");

    for (const marker of markers) {
      const top = marker.getBoundingClientRect().top - rootTop;
      marker.dataset.pinning = top <= PIN_LINE + 6 ? "true" : "false";
    }
  }, []);

  function handleThreadScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    updatePinnedDay();
  }

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
    requestAnimationFrame(updatePinnedDay);
  }, [messages, updatePinnedDay]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    stickToBottom.current = true;
    const ok = await onSend(content);
    if (ok === false) return;
    setDraft("");
    if (composerRef.current) {
      composerRef.current.style.height = "auto";
    }
  }

  function startEdit(message: Message) {
    setEditingId(message.id);
    setEditDraft(message.content);
  }

  async function saveEdit() {
    if (!editingId || !onEdit || !editDraft.trim() || savingEdit) return;
    setSavingEdit(true);
    await onEdit(editingId, editDraft.trim());
    setSavingEdit(false);
    setEditingId(null);
    setEditDraft("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-surface px-4 py-3">
        <ClientAvatar
          src={clientAvatar}
          name={title}
          className="h-10 w-10 text-[13px]"
        />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-[12px] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {messages.length > 0 && pinnedLabel && (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center">
            <span className="rounded-full bg-surface/95 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/60">
              {pinnedLabel}
            </span>
          </div>
        )}
        <div
          ref={scrollerRef}
          onScroll={handleThreadScroll}
          className="chat-canvas h-full overflow-x-hidden overflow-y-auto overscroll-contain"
        >

        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-sm rounded-2xl bg-surface/90 px-5 py-6 text-center shadow-sm ring-1 ring-border/50">
              <p className="text-[14px] font-medium">Project chat</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Messages stay here with your Vitespace team — same thread, this
                project only.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-full w-full flex-col justify-end px-3 py-4 sm:px-5">
            {groups.map((group) => (
              <div
                key={group.key}
                data-chat-day={group.key}
                data-day-label={group.label}
                className="data-[pinning=true]:[&_.chat-day-chip]:opacity-0"
              >
                <div className="chat-day-chip flex justify-center py-2 transition-opacity duration-150">
                  <span className="rounded-full bg-surface/95 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/60">
                    {group.label}
                  </span>
                </div>

                {group.messages.map(({ message, grouped, showMeta }) => {
                  const outgoing = message.sender === outgoingSender;
                  const editing = editingId === message.id;
                  const editable = Boolean(canEdit?.(message) && onEdit);
                  const face = (
                    <MessageFace
                      kind={message.sender === "vitespace" ? "vitespace" : "client"}
                      name={message.senderName}
                      avatar={clientAvatar}
                      visible={showMeta}
                    />
                  );

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end gap-1.5",
                        outgoing ? "justify-end" : "justify-start",
                        grouped ? "mt-0.5" : "mt-3"
                      )}
                    >
                      {!outgoing && face}
                      <div
                        className={cn(
                          "group/msg min-w-0 max-w-[78%] lg:max-w-[30rem]",
                          outgoing ? "items-end" : "items-start"
                        )}
                      >
                        {!grouped && !outgoing && (
                          <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
                            {message.senderName}
                          </p>
                        )}

                        {editing ? (
                          <div className="min-w-[220px] space-y-2 rounded-2xl bg-surface p-2.5 ring-1 ring-border/60">
                            <Textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={3}
                              className="min-h-0 resize-none text-[13px]"
                              autoFocus
                            />
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-full"
                                onClick={() => setEditingId(null)}
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
                          <div className="relative">
                            {editable && (
                              <button
                                type="button"
                                className={cn(
                                  "absolute top-1/2 rounded-full p-1.5 text-muted-foreground transition-opacity hover:text-foreground md:opacity-0 md:group-hover/msg:opacity-100",
                                  outgoing
                                    ? "right-full mr-1 -translate-y-1/2"
                                    : "left-full ml-1 -translate-y-1/2"
                                )}
                                onClick={() => startEdit(message)}
                                aria-label="Edit message"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <div
                              className={cn(
                                "px-3 py-2 text-[14px] leading-relaxed break-words whitespace-pre-wrap shadow-sm",
                                outgoing
                                  ? "rounded-2xl rounded-br-md bg-brand text-white"
                                  : "rounded-2xl rounded-bl-md bg-surface text-foreground ring-1 ring-border/50"
                              )}
                            >
                              {message.content}
                              {showMeta && (
                                <span
                                  className={cn(
                                    "mt-1 flex items-center justify-end gap-1 text-[10px] leading-none",
                                    outgoing
                                      ? "text-white/70"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {message.editedAt ? "Edited · " : ""}
                                  {formatChatTime(message.timestamp)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {outgoing && face}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-surface px-3 py-2.5 sm:px-5">
        {error && (
          <p className="mb-2 px-1 text-[12px] text-red-600">{error}</p>
        )}
        <div className="flex w-full items-end gap-2">
          <div className="min-w-0 flex-1 rounded-[22px] bg-muted/80 px-3.5 py-1.5 ring-1 ring-border/40">
            <textarea
              ref={composerRef}
              rows={1}
              placeholder="Message"
              value={draft}
              disabled={sending}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              className="max-h-[120px] min-h-[28px] w-full resize-none bg-transparent py-1.5 text-[14px] leading-snug text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
