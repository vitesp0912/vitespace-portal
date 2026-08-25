import { getMailTransporter } from "@/lib/email/smtp";
import { getClientOwnerEmails } from "@/lib/email/recipients";
import { buildAlertEmail } from "@/lib/email/template";

export type PortalAlertKind =
  | "invoice"
  | "document"
  | "message"
  | "progress"
  | "update";

export type PortalAlertAudience = "owners" | "vitespace";

export type PortalAlertInput = {
  clientId: string;
  audience: PortalAlertAudience;
  kind: PortalAlertKind;
  title: string;
  detail: string;
  path: string;
};

const KIND_LABEL: Record<PortalAlertKind, string> = {
  invoice: "Invoice",
  document: "Document",
  message: "Message",
  progress: "Progress",
  update: "Update",
};

const CTA: Record<PortalAlertKind, string> = {
  invoice: "View invoice",
  document: "View document",
  message: "Open messages",
  progress: "View progress",
  update: "Open portal",
};

/**
 * Sends a short portal alert email.
 * Never throws to callers that fire-and-forget — returns a result instead.
 * No-ops cleanly when SMTP env is missing.
 */
export async function dispatchPortalAlert(
  input: PortalAlertInput
): Promise<{ ok: true; sent: number } | { ok: false; error: string; skipped?: boolean }> {
  try {
    const mail = getMailTransporter();
    if (!mail) {
      return { ok: false, error: "SMTP is not configured.", skipped: true };
    }

    const { company, emails: ownerEmails } = await getClientOwnerEmails(
      input.clientId
    );

    const to =
      input.audience === "owners"
        ? ownerEmails
        : [mail.config.vitespaceAlertEmail];

    const recipients = [...new Set(to.map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (recipients.length === 0) {
      return { ok: false, error: "No recipients found.", skipped: true };
    }

    const label = KIND_LABEL[input.kind];
    const subject =
      input.audience === "owners"
        ? `${label} · ${company}`
        : `${label} from ${company}`;

    const { text, html } = buildAlertEmail({
      subject,
      preheader: input.detail.slice(0, 100),
      eyebrow: label,
      title: input.title.trim(),
      detail: input.detail.trim(),
      ctaLabel: CTA[input.kind],
      path: input.path,
      company,
    });

    await mail.transporter.sendMail({
      from: mail.config.from,
      to: recipients.join(", "),
      subject,
      text,
      html,
    });

    return { ok: true, sent: recipients.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    console.error("[email]", message);
    return { ok: false, error: message };
  }
}

/** Fire-and-forget wrapper — never blocks the main request path. */
export function queuePortalAlert(input: PortalAlertInput) {
  void dispatchPortalAlert(input);
}
