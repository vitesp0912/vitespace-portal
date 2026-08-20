/** Tracks which message thread the user is currently viewing (for read + sound). */
export type ActiveMessageThread = {
  clientId: string;
  threadUserId: string;
  reader: "client" | "vitespace";
};

let active: ActiveMessageThread | null = null;

export function setActiveMessageThread(next: ActiveMessageThread | null) {
  active = next;
}

export function getActiveMessageThread() {
  return active;
}

export function isViewingThread(clientId: string, threadUserId: string) {
  return (
    active?.clientId === clientId && active?.threadUserId === threadUserId
  );
}

export function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}
