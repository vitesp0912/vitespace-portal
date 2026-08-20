"use client";

import { useMemo, useState } from "react";
import { ChatFrame, ProjectChat } from "@/components/messages/project-chat";
import { useClientAuth } from "@/lib/client-auth";
import { useClientPortal } from "@/lib/portal-store";
import type { Message } from "@/types";

export function MessagesPage() {
  const { session } = useClientAuth();
  const { client, clientId, getMessagesForClient, addMessage, updateMessage } =
    useClientPortal();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadUserId = session?.userId;
  const messages = useMemo(
    () =>
      clientId && threadUserId
        ? getMessagesForClient(clientId, threadUserId)
        : [],
    [clientId, threadUserId, getMessagesForClient]
  );

  async function handleSend(content: string) {
    if (!clientId || !threadUserId || sending) return false;
    setSending(true);
    setError(null);
    const result = await addMessage(
      clientId,
      {
        content,
        userId: threadUserId,
        senderName:
          session?.displayName?.trim() ||
          session?.email ||
          client?.company ||
          "Client",
      },
      "client"
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
    return (
      message.sender === "client" &&
      Boolean(threadUserId) &&
      message.userId === threadUserId
    );
  }

  return (
    <div className="absolute inset-0 flex min-h-0 items-start justify-center px-4 pt-4 pb-8 sm:px-6 sm:pt-5 sm:pb-10 lg:px-8 lg:pt-5 lg:pb-12">
      <ChatFrame>
        <ProjectChat
          title={client?.company ?? "Project chat"}
          subtitle="Your conversation with Vitespace"
          clientAvatar={client?.avatar}
          messages={messages}
          outgoingSender="client"
          onSend={handleSend}
          onEdit={handleEdit}
          canEdit={canEdit}
          sending={sending}
          error={error}
        />
      </ChatFrame>
    </div>
  );
}
