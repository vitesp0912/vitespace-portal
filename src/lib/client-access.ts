import type { ClientSession } from "@/lib/client-auth";
import { portalNavItems, quickLinks, type PortalNavItem } from "@/lib/portal-nav";

/**
 * UI-only helpers. Access control for invoices/notifications is enforced by
 * Supabase RLS + server redirects (see requireInvoiceAccess).
 */
export function canViewInvoices(session: ClientSession | null | undefined): boolean {
  if (!session) return false;
  if (session.isAdmin) return true;
  return session.role === "owner";
}

export function getVisiblePortalNavItems(
  session: ClientSession | null | undefined
): PortalNavItem[] {
  if (canViewInvoices(session)) return portalNavItems;
  return portalNavItems.filter((item) => item.href !== "/invoices");
}

export function getVisibleQuickLinks(session: ClientSession | null | undefined) {
  if (canViewInvoices(session)) return quickLinks;
  return quickLinks.filter((link) => link.href !== "/invoices");
}
