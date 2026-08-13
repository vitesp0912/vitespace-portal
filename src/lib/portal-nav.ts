import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Receipt,
  FolderOpen,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
}

export const portalNavItems: PortalNavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, mobile: true },
  { href: "/progress", label: "Progress", icon: TrendingUp, mobile: true },
  { href: "/requests", label: "Requests", icon: FileText, mobile: true },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/messages", label: "Messages", icon: MessageSquare, mobile: true },
];

export const quickLinks = [
  { href: "/progress", label: "View Progress" },
  { href: "/requests", label: "Raise Request" },
  { href: "/invoices", label: "Invoices" },
  { href: "/documents", label: "Documents" },
  { href: "/messages", label: "Messages" },
];
