import type { ActionItem } from "@/types";

/** Derive client portal link from action item type */
export function getActionItemHref(item: ActionItem): string {
  switch (item.type) {
    case "approval":
      return "/progress";
    case "data_required":
      return "/progress?tab=awaiting_client";
    case "change_request":
      return "/requests";
    case "payment":
      return "/invoices";
    default:
      return "/";
  }
}
