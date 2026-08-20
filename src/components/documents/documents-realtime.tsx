"use client";

import { useEffect } from "react";
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";
import { mapDocumentRow } from "@/lib/supabase/data";
import { createClient } from "@/lib/supabase/client";

/**
 * After login: keep the documents library in sync for client + admin.
 * Bell alerts still come from notifications Realtime (trigger on upload).
 */
export function DocumentsRealtime() {
  const { session, hydrated, user } = useClientAuth();
  const { upsertRealtimeDocument, removeRealtimeDocument } = usePortal();

  useEffect(() => {
    if (!hydrated || !session || !user) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`documents-live:${session.userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string } | null;
            if (oldRow?.id) removeRealtimeDocument(String(oldRow.id));
            return;
          }

          const row = payload.new as Record<string, unknown> | null;
          if (!row) return;
          upsertRealtimeDocument(mapDocumentRow(row));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    hydrated,
    session?.userId,
    user,
    upsertRealtimeDocument,
    removeRealtimeDocument,
  ]);

  return null;
}
