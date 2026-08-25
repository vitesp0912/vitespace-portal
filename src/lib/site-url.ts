/** Production portal origin used in password-reset / alert emails. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return raw || "https://portal.vitespace.com";
}

export function getPasswordResetRedirectUrl() {
  return `${getSiteUrl()}/reset-password`;
}
