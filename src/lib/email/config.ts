import { ADMIN_EMAIL } from "@/lib/admin";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  vitespaceAlertEmail: string;
};

/** Returns null when SMTP is not configured (dev / email disabled). */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  // Gmail app passwords are often copied with spaces; SMTP expects no spaces.
  const pass = process.env.SMTP_APP_PASSWORD?.replace(/\s+/g, "").trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;

  const from =
    process.env.SMTP_FROM?.trim() || `Vitespace Portal <${user}>`;

  const vitespaceAlertEmail =
    process.env.VITESPACE_ALERT_EMAIL?.trim() || ADMIN_EMAIL;

  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    user,
    pass,
    from,
    vitespaceAlertEmail,
  };
}
