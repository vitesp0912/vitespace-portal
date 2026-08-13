import type {
  ActionItem,
  Approval,
  ChangeRequest,
  Client,
  Document,
  Invoice,
  Message,
  Notification,
  ProgressArea,
  RoadmapItem,
  WorkItem,
} from "@/types";

const TS = "2026-08-10T00:00:00.000Z";

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "celeste-abode",
    name: "Vaibhav",
    company: "Celeste Abode",
    email: "vaibhav@celesteabode.com",
    monthlyRetainer: 40000,
    status: "active",
    projectStatus: "on_track",
    projectName: "Website Operations & SEO",
    lastUpdatedAt: "2026-08-09T14:30:00",
  },
  {
    id: "petrofi",
    name: "Rajesh",
    company: "PetroFI",
    email: "rajesh@petrofi.com",
    monthlyRetainer: 55000,
    status: "active",
    projectStatus: "on_track",
    projectName: "Digital Marketing & Web",
    lastUpdatedAt: "2026-08-08T10:00:00",
  },
  {
    id: "aam-altair",
    name: "Priya",
    company: "AAM Altair",
    email: "priya@aamaltair.com",
    monthlyRetainer: 35000,
    status: "active",
    projectStatus: "at_risk",
    projectName: "Brand & Website",
    lastUpdatedAt: "2026-08-09T09:00:00",
  },
  {
    id: "green-valley",
    name: "Arun",
    company: "Green Valley",
    email: "arun@greenvalley.com",
    monthlyRetainer: 28000,
    status: "active",
    projectStatus: "on_track",
    projectName: "SEO & Content",
    lastUpdatedAt: "2026-08-09T11:00:00",
  },
];

export const INITIAL_WORK_ITEMS: WorkItem[] = [];

export const INITIAL_ACTION_ITEMS: ActionItem[] = [
  { id: "ai1", clientId: "celeste-abode", title: "Approve August SEO Plan", type: "approval", linkedEntityId: "ap1", priority: "high", requestedAt: "2026-08-09T16:00:00" },
  { id: "ai2", clientId: "celeste-abode", title: "Provide ACE Terra pricing data", type: "data_required", linkedEntityId: "w12", priority: "high", requestedAt: "2026-08-09T14:00:00" },
];

export const INITIAL_PROGRESS_AREAS: ProgressArea[] = [
  { id: "pa1", clientId: "celeste-abode", label: "Website Operations", value: 85, sortOrder: 0 },
  { id: "pa2", clientId: "celeste-abode", label: "SEO Performance", value: 72, sortOrder: 1 },
  { id: "pa3", clientId: "celeste-abode", label: "New Properties", value: 65, sortOrder: 2 },
  { id: "pa4", clientId: "celeste-abode", label: "Lead Generation", value: 40, sortOrder: 3 },
];

export const INITIAL_CHANGE_REQUESTS: ChangeRequest[] = [
  { id: "cr24", clientId: "celeste-abode", number: "CR-024", title: "Change property CTA", description: "Update CTA text on Forest Walk Villa page", project: "Forest Walk Villa", status: "under_review", requestedBy: "Vaibhav", requestedAt: "2026-08-09", estimatedHours: 1.5, additionalCost: 1125, priority: "normal" },
  { id: "cr23", clientId: "celeste-abode", number: "CR-023", title: "Add video section to homepage", description: "Embed property walkthrough video above featured listings", project: "Website", status: "approved", requestedBy: "Vaibhav", requestedAt: "2026-08-01", estimatedHours: 3, additionalCost: 2250, priority: "normal" },
  { id: "cr22", clientId: "celeste-abode", number: "CR-022", title: "Update contact form fields", description: "Add budget range and preferred location fields", project: "Website", status: "in_progress", requestedBy: "Vaibhav", requestedAt: "2026-07-28", estimatedHours: 2, additionalCost: 1500, priority: "high" },
  { id: "cr21", clientId: "celeste-abode", number: "CR-021", title: "Revise footer links", description: "Reorganize footer navigation", project: "Website", status: "completed", requestedBy: "Vaibhav", requestedAt: "2026-07-15", estimatedHours: 1, additionalCost: 750, priority: "normal" },
];

export const INITIAL_APPROVALS: Approval[] = [
  { id: "ap1", clientId: "celeste-abode", title: "August SEO Content Plan", description: "12 articles proposed for August publishing cycle", status: "pending", items: ["Article titles", "Target keywords", "Search intent mapping", "Publishing schedule"], requestedAt: "2026-08-07", dueDate: "2026-08-12" },
  { id: "ap2", clientId: "celeste-abode", title: "Q3 Property Page Designs", description: "Design mockups for 4 upcoming property pages", status: "approved", items: ["Forest Walk Villa", "ACE Terra", "Green Valley Residences", "Skyline Towers"], requestedAt: "2026-07-25" },
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: "inv18", clientId: "celeste-abode", number: "INV-2026-018", title: "August 2026", amount: 47200, issuedAt: "2026-08-05", dueAt: "2026-08-20", status: "pending" },
  { id: "inv17", clientId: "celeste-abode", number: "INV-2026-017", title: "July 2026", amount: 47200, issuedAt: "2026-07-05", dueAt: "2026-07-20", paidAt: "2026-07-08", status: "paid" },
  { id: "inv16", clientId: "celeste-abode", number: "INV-2026-016", title: "June 2026", amount: 47200, issuedAt: "2026-06-05", dueAt: "2026-06-20", paidAt: "2026-06-12", status: "paid" },
];

export const INITIAL_DOCUMENTS: Document[] = [
  { id: "d1", clientId: "celeste-abode", name: "Service Agreement 2026.pdf", category: "contracts", uploadedAt: "2026-01-15", size: "245 KB" },
  { id: "d2", clientId: "celeste-abode", name: "INV-2026-017.pdf", category: "invoices", uploadedAt: "2026-07-05", size: "128 KB" },
  { id: "d3", clientId: "celeste-abode", name: "July SEO Report.pdf", category: "seo_reports", uploadedAt: "2026-08-01", size: "2.4 MB" },
  { id: "d4", clientId: "celeste-abode", name: "Property Data Q3.xlsx", category: "property_data", uploadedAt: "2026-07-20", size: "890 KB" },
  { id: "d5", clientId: "celeste-abode", name: "Brand Guidelines.pdf", category: "creative_assets", uploadedAt: "2026-03-10", size: "5.1 MB" },
  { id: "d6", clientId: "celeste-abode", name: "Website Architecture.docx", category: "project_documents", uploadedAt: "2026-02-28", size: "340 KB" },
];

export const INITIAL_MESSAGES: Message[] = [
  { id: "m1", clientId: "celeste-abode", sender: "vitespace", senderName: "Vitespace", content: "The revised property structure is now implemented. We've also added the new CTA section.", timestamp: "2026-08-09T16:32:00", context: "work_item", contextLabel: "Forest Walk Villa", contextHref: "/progress" },
  { id: "m2", clientId: "celeste-abode", sender: "client", senderName: "Vaibhav", content: "Can we change the CTA text?", timestamp: "2026-08-09T17:10:00", context: "work_item", contextLabel: "Forest Walk Villa", contextHref: "/progress" },
  { id: "m3", clientId: "celeste-abode", sender: "vitespace", senderName: "Vitespace", content: "Yes. We've logged this as Change Request #24.", timestamp: "2026-08-09T17:18:00", context: "change_request", contextLabel: "CR-024", contextHref: "/requests" },
  { id: "m4", clientId: "celeste-abode", sender: "vitespace", senderName: "Vitespace", content: "The July SEO report is ready. Organic traffic up 18%.", timestamp: "2026-08-08T10:00:00", context: "document", contextLabel: "July SEO Report", contextHref: "/documents" },
];

export const INITIAL_ROADMAP: RoadmapItem[] = [
  { id: "r1", clientId: "celeste-abode", title: "New property pages", category: "website", status: "in_progress", month: "August" },
  { id: "r2", clientId: "celeste-abode", title: "Performance improvements", category: "website", status: "committed", month: "August" },
  { id: "r3", clientId: "celeste-abode", title: "Admin panel improvements", category: "website", status: "planned", month: "August" },
  { id: "r4", clientId: "celeste-abode", title: "4 blogs", category: "seo", status: "in_progress", month: "August" },
  { id: "r5", clientId: "celeste-abode", title: "On-page optimization", category: "seo", status: "committed", month: "August" },
  { id: "r6", clientId: "celeste-abode", title: "Backlink activities", category: "seo", status: "planned", month: "August" },
  { id: "r7", clientId: "celeste-abode", title: "Lead intent tracker", category: "website", status: "proposed", month: "September" },
  { id: "r8", clientId: "celeste-abode", title: "Conversion improvements", category: "website", status: "proposed", month: "September" },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", clientId: "celeste-abode", title: "Approval required", message: "August SEO Content Plan needs your review", timestamp: "2026-08-07T09:00:00", read: false, href: "/progress" },
  { id: "n2", clientId: "celeste-abode", title: "Client action required", message: "ACE Terra pricing data is needed", timestamp: "2026-08-06T14:00:00", read: false, href: "/progress?tab=awaiting" },
  { id: "n3", clientId: "celeste-abode", title: "Change request updated", message: "CR-024 is now under review", timestamp: "2026-08-09T17:20:00", read: true, href: "/requests" },
  { id: "n4", clientId: "celeste-abode", title: "Invoice generated", message: "INV-2026-018 for August 2026 is ready", timestamp: "2026-08-05T11:00:00", read: true, href: "/invoices" },
];

export const WORK_ITEM_STATUS_LABELS = {
  completed: "Completed",
  in_progress: "In Progress",
  upcoming: "Upcoming",
  awaiting_client: "Awaiting Client",
} as const;

export const PROJECT_OPTIONS = ["Website", "SEO", "Creative", "Forest Walk Villa", "Other"];

export const DOCUMENT_CATEGORIES = [
  { value: "contracts", label: "Contracts" },
  { value: "invoices", label: "Invoices" },
  { value: "seo_reports", label: "SEO Reports" },
  { value: "property_data", label: "Property Data" },
  { value: "creative_assets", label: "Creative Assets" },
  { value: "project_documents", label: "Project Documents" },
] as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
