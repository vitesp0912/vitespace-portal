import { getSiteUrl } from "@/lib/site-url";

export type AlertEmailContent = {
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  detail: string;
  ctaLabel: string;
  path: string;
  company: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAlertEmail(content: AlertEmailContent): {
  subject: string;
  text: string;
  html: string;
} {
  const url = `${getSiteUrl()}${content.path.startsWith("/") ? content.path : `/${content.path}`}`;
  const title = escapeHtml(content.title);
  const detail = escapeHtml(content.detail);
  const company = escapeHtml(content.company);
  const eyebrow = escapeHtml(content.eyebrow);
  const cta = escapeHtml(content.ctaLabel);
  const preheader = escapeHtml(content.preheader);

  const text = [
    content.title,
    content.detail,
    "",
    `${content.ctaLabel}: ${url}`,
    "",
    `— Vitespace · ${content.company}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0c0e1a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid rgba(12,14,26,0.08);border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5c6478;font-weight:600;">
              Vitespace · ${company}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 24px 0;font-size:12px;color:#4c46e8;font-weight:600;">
              ${eyebrow}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 24px 0;font-size:20px;line-height:1.3;font-weight:650;color:#0c0e1a;">
              ${title}
            </td>
          </tr>
          <tr>
            <td style="padding:10px 24px 0;font-size:14px;line-height:1.55;color:#5c6478;">
              ${detail}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px 28px;">
              <a href="${url}" style="display:inline-block;background:#4c46e8;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:11px 16px;border-radius:999px;">
                ${cta}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#8b93a7;">
          Please check the portal for details.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: content.subject, text, html };
}
