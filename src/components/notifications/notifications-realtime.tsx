"use client";

import { useEffect } from "react";
import { useClientAuth } from "@/lib/client-auth";
import { playNotificationSound } from "@/lib/message-sound";
import { usePortal } from "@/lib/portal-store";
import {
  mapNotificationReadRow,
  mapNotificationRow,
} from "@/lib/supabase/data";
import { createClient } from "@/lib/supabase/client";

/**
 * After login: live notifications for the bell.
 * Unread is per-user via notification_reads (not shared notifications.read).
 * RLS (audience + role) decides which notification rows each user receives.
 */
export function NotificationsRealtime() {
  const { session, hydrated, user } = useClientAuth();
  const {
    upsertRealtimeNotification,
    upsertRealtimeNotificationRead,
    removeRealtimeNotification,
    getNotificationLastReadAt,
  } = usePortal();

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

          if (String(row.recipient) !== "client") return;

          if (
            session.clientId &&
            String(row.client_id) !== session.clientId
          ) {
            return;
          }

          const notification = mapNotificationRow(row);
          const isNew = payload.eventType === "INSERT";
          upsertRealtimeNotification(notification);

          if (isNew && session.clientId) {
            const lastReadAt = getNotificationLastReadAt(
              session.clientId,
              session.userId
            );
            const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
            if (new Date(notification.timestamp).getTime() > since) {
              playNotificationSound();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_reads",
          filter: `user_id=eq.${session.userId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as Record<string, unknown> | null;
          if (!row) return;
          upsertRealtimeNotificationRead(mapNotificationReadRow(row));
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
    upsertRealtimeNotificationRead,
    removeRealtimeNotification,
    getNotificationLastReadAt,
  ]);

  return null;
}
