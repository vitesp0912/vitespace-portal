/** Client helper — fire-and-forget portal alert email (server validates auth). */
export function queueClientAlertEmail(
  clientId: string,
  body: {
    audience: "owners" | "vitespace";
    kind: "invoice" | "document" | "message" | "progress" | "update";
    title: string;
    detail: string;
    path: string;
  }
) {
  if (typeof window === "undefined") return;
  void fetch(`/api/clients/${clientId}/alerts/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    /* ignore network errors — alert email is best-effort */
  });
}
