/** Only this email may use the Vitespace admin / internal portal. */
export const ADMIN_EMAIL = "admin@vitespace.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
}
