"use client";

import { useEffect } from "react";
import { useClientAuth } from "@/lib/client-auth";
import { playNotificationSound } from "@/lib/message-sound";
import { usePortal } from "@/lib/portal-store";
import { mapNotificationRow } from "@/lib/supabase/data";
import { createClient } from "@/lib/supabase/client";

/**
 * After login: live notifications for the bell.
 * RLS (audience + role) decides which rows each user receives over Realtime.
 */
export function NotificationsRealtime() {
  const { session, hydrated, user } = useClientAuth();
  const { upsertRealtimeNotification, removeRealtimeNotification } = usePortal();

  useEffect(() => {
    if (!hydrated || !session || !user) return;

    // Admins manage notifications in the admin UI; bell alerts are for portal users.
    if (session.isAdmin && !session.clientId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-live:${session.userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string } | null;
            if (oldRow?.id) removeRealtimeNotification(String(oldRow.id));
            return;
          }

          const row = payload.new as Record<string, unknown> | null;
          if (!row) return;

          // Client portal only cares about recipient=client rows
          if (String(row.recipient) !== "client") return;

          const notification = mapNotificationRow(row);
          const isNew = payload.eventType === "INSERT";
          upsertRealtimeNotification(notification);

          if (isNew && !notification.read) {
            playNotificationSound();
          }
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
    session?.clientId,
    user,
    upsertRealtimeNotification,
    removeRealtimeNotification,
  ]);

  return null;
}
