"use client";

import { useState } from "react";
import { ChatFrame, ProjectChat } from "@/components/messages/project-chat";
import { useAdminClient } from "@/lib/portal-store";
import type { Message } from "@/types";

export function MessagesManager({ clientId }: { clientId: string }) {
  const { client, messages, addMessage, updateMessage } = useAdminClient(clientId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(content: string) {
    if (sending) return false;
    setSending(true);
    setError(null);
    const result = await addMessage(clientId, { content }, "vitespace");
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
    return message.sender === "vitespace";
  }

  return (
    <div className="flex justify-center">
      <ChatFrame className="h-[min(42rem,calc(100dvh-9rem))]">
        <ProjectChat
          title={client?.company ?? "Client"}
          subtitle="Project chat"
          clientAvatar={client?.avatar}
          messages={messages}
          outgoingSender="vitespace"
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
