import type {
  ApprovalStatus,
  DocumentCategory,
  InvoiceStatus,
  ProjectStatus,
  RequestStatus,
  RoadmapStatus,
  TaskStatus,
} from "@/types";

/** Display / sort order for work items */
export const TASK_STATUS_ORDER: TaskStatus[] = [
  "pending",
  "in_progress",
  "requested",
  "pending_approval",
  "approved",
  "completed",
  "rejected",
  "cancelled",
];

export const WORK_ITEM_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  requested: "Requested",
  pending_approval: "Pending Approval",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const PROJECT_OPTIONS = [
  "Website",
  "SEO",
  "Creative",
  "Forest Walk Villa",
  "Other",
];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  changes_requested: "Changes Requested",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  blocked: "Blocked",
  completed: "Completed",
};

export const CLIENT_STATUS_LABELS = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
} as const;

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  committed: "Committed",
  in_progress: "In Progress",
  planned: "Planned",
  proposed: "Proposed",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contracts: "Contracts",
  invoices: "Invoices",
  seo_reports: "SEO Reports",
  property_data: "Property Data",
  creative_assets: "Creative Assets",
  project_documents: "Project Documents",
  minutes_of_meeting: "Minutes of Meeting",
};

export const DOCUMENT_CATEGORIES = Object.entries(DOCUMENT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as DocumentCategory, label })
);

export const ACTION_ITEM_TYPE_LABELS = {
  approval: "Approval",
  data_required: "Data Required",
  change_request: "Change Request",
  payment: "Payment",
} as const;

export const MESSAGE_CONTEXT_LABELS = {
  project: "Project",
  work_item: "Work Item",
  change_request: "Change Request",
  invoice: "Invoice",
  document: "Document",
} as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
