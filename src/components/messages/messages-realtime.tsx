"use client";

import { useEffect, useRef } from "react";
import { useClientAuth } from "@/lib/client-auth";
import { playMessageSound } from "@/lib/message-sound";
import { isViewingThread } from "@/lib/message-thread-view";
import { usePortal } from "@/lib/portal-store";
import { mapMessageRow } from "@/lib/supabase/data";
import { createClient } from "@/lib/supabase/client";

/**
 * After login: subscribe to messages Realtime globally so chat + nav badges
 * stay live on every page (client + admin).
 */
export function MessagesRealtime() {
  const { session, hydrated, user } = useClientAuth();
  const {
    upsertRealtimeMessage,
    removeRealtimeMessage,
    markThreadRead,
  } = usePortal();
  const roleRef = useRef<"client" | "vitespace">("client");
  const userIdRef = useRef<string>("");

  useEffect(() => {
    if (!session) return;
    roleRef.current = session.isAdmin ? "vitespace" : "client";
    userIdRef.current = session.userId;
  }, [session]);

  useEffect(() => {
    if (!hydrated || !session || !user) return;

    const supabase = createClient();
    const myUserId = session.userId;

    const channel = supabase
      .channel(`messages-live:${myUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const myRole = roleRef.current;

          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string } | null;
            if (oldRow?.id) removeRealtimeMessage(String(oldRow.id));
            return;
          }

          const row = payload.new as Record<string, unknown> | null;
          if (!row) return;
          const message = mapMessageRow(row);

          if (
            myRole === "client" &&
            message.userId &&
            message.userId !== myUserId
          ) {
            return;
          }

          const isNew = payload.eventType === "INSERT";
          upsertRealtimeMessage(message);

          if (!isNew) return;

          const incoming =
            (myRole === "client" && message.sender === "vitespace") ||
            (myRole === "vitespace" && message.sender === "client");

          if (!incoming) return;

          const threadId = message.userId;
          if (threadId && isViewingThread(message.clientId, threadId)) {
            void markThreadRead(message.clientId, threadId, myRole);
          }

          playMessageSound();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    hydrated,
    session?.userId,
    session?.isAdmin,
    user,
    upsertRealtimeMessage,
    removeRealtimeMessage,
    markThreadRead,
  ]);

  return null;
}
