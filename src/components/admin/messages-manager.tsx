"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatFrame, ProjectChat } from "@/components/messages/project-chat";
import { useAdminClient } from "@/lib/portal-store";
import type { Message } from "@/types";

type PortalUser = {
  userId: string;
  name: string | null;
  email: string | null;
};

function MessagesManagerInner({ clientId }: { clientId: string }) {
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("user") ?? "";
  const { client, getMessagesForClient, addMessage, updateMessage } =
    useAdminClient(clientId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/clients/${clientId}/users`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load users");
        return (data.users as PortalUser[]) ?? [];
      })
      .then((list) => {
        if (!cancelled) setPortalUsers(list);
      })
      .catch(() => {
        if (!cancelled) setPortalUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const selectedUser = portalUsers.find((u) => u.userId === selectedUserId);
  const selectedUserName = selectedUser?.name?.trim() || null;
  const companyName = client?.company ?? "Client";

  const messages = useMemo(
    () =>
      selectedUserId
        ? getMessagesForClient(clientId, selectedUserId)
        : [],
    [clientId, selectedUserId, getMessagesForClient]
  );

  async function handleSend(content: string) {
    if (!selectedUserId || sending) return false;
    setSending(true);
    setError(null);
    const result = await addMessage(
      clientId,
      {
        content,
        userId: selectedUserId,
        senderName: "Vitespace",
      },
      "vitespace"
    );
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    return true;
  }

  async function handleEdit(id: string, content: string) {
    setError(null);
    const result = await updateMessage(id, content);
    if (!result.ok) setError(result.error);
  }

  function canEdit(message: Message) {
    return message.sender === "vitespace" && message.userId === selectedUserId;
  }

  return (
    <div className="flex justify-center">
      <ChatFrame className="h-[min(42rem,calc(100dvh-9rem))]">
        <ProjectChat
          title={
            selectedUserName
              ? `${companyName} · ${selectedUserName}`
              : companyName
          }
          subtitle={
            selectedUserId
              ? "Project chat"
              : "Select a portal user in the sidebar"
          }
          clientAvatar={client?.avatar}
          messages={messages}
          outgoingSender="vitespace"
          onSend={handleSend}
          onEdit={handleEdit}
          canEdit={canEdit}
          sending={sending}
          error={
            error ||
            (!selectedUserId
              ? "Select a portal user in the sidebar to view and reply."
              : null)
          }
        />
      </ChatFrame>
    </div>
  );
}

export function MessagesManager({ clientId }: { clientId: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16 text-[13px] text-muted-foreground">
          Loading conversation…
        </div>
      }
    >
      <MessagesManagerInner clientId={clientId} />
    </Suspense>
  );
}
