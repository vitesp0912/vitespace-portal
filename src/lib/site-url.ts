/** Production portal origin used in password-reset emails. */
export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://portal.vitespace.com"
  );
}

export function getPasswordResetRedirectUrl() {
  return `${getSiteUrl()}/reset-password`;
}
