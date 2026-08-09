"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Paperclip, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PortalPage } from "@/components/portal/portal-page";
import { PortalSectionHeader } from "@/components/portal/portal-section-header";
import { useClientPortal } from "@/lib/portal-store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MessagesPage() {
  const { clientId, messages, addMessage } = useClientPortal();
  const [draft, setDraft] = useState("");

  const grouped = messages.reduce(
    (acc, msg) => {
      const key = msg.contextLabel;
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
      return acc;
    },
    {} as Record<string, typeof messages>
  );

  function handleSend() {
    if (!draft.trim()) return;
    const lastContext = messages[messages.length - 1];
    addMessage(
      clientId,
      {
        content: draft.trim(),
        context: lastContext?.context ?? "project",
        contextLabel: lastContext?.contextLabel ?? "General",
        contextHref: lastContext?.contextHref ?? "/messages",
      },
      "client"
    );
    setDraft("");
  }

  return (
    <PortalPage className="flex min-h-[calc(100vh-140px)] flex-col space-y-6 pb-24 lg:pb-8">
      <PortalSectionHeader
        title="Messages"
        description="Every conversation is tied to your work — not a generic chat room."
      />

      <div className="flex-1 space-y-6">
        {Object.entries(grouped).map(([context, msgs]) => (
          <section key={context} className="rounded-2xl bg-surface p-5 portal-shadow ring-1 ring-border/50 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{context}</h2>
              {msgs[0]?.contextHref && (
                <Link href={msgs[0].contextHref} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-brand">
                  View context <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {msgs.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.sender === "client" && "flex-row-reverse")}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={cn("text-[10px] font-semibold", msg.sender === "vitespace" ? "bg-brand/10 text-brand" : "bg-muted")}>
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[80%]", msg.sender === "client" && "text-right")}>
                    <p className="text-[11px] text-muted-foreground">{msg.senderName} · {formatDateTime(msg.timestamp)}</p>
                    <div className={cn("mt-1 inline-block rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed", msg.sender === "vitespace" ? "rounded-tl-sm bg-muted/70 text-foreground" : "rounded-tr-sm bg-brand text-white")}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-20 lg:bottom-4 rounded-2xl bg-surface p-3 portal-shadow ring-1 ring-border/50">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent focus-visible:ring-0"
          />
          <div className="flex flex-col gap-1.5">
            <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => alert("File upload will connect to Supabase Storage when backend is wired.")}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button size="icon-sm" className="rounded-full" onClick={handleSend} disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PortalPage>
  );
}
