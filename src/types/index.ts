export type TaskStatus =
  | "pending"
  | "requested"
  | "pending_approval"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled";

/** @deprecated Use TaskStatus — kept as alias for gradual migration */
export type WorkItemStatus = TaskStatus;

export type ProjectStatus = "on_track" | "at_risk" | "blocked" | "completed";

export type RequestStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "rejected"
  | "in_progress"
  | "completed";

export type ApprovalStatus = "pending" | "approved" | "changes_requested";

export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export type RoadmapStatus = "committed" | "in_progress" | "planned" | "proposed";

export type DocumentCategory =
  | "contracts"
  | "invoices"
  | "seo_reports"
  | "property_data"
  | "creative_assets"
  | "project_documents"
  | "minutes_of_meeting";

export type ConversationContext =
  | "project"
  | "work_item"
  | "change_request"
  | "invoice"
  | "document";

export type ActionItemType =
  | "approval"
  | "data_required"
  | "change_request"
  | "payment";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  avatar?: string;
  monthlyRetainer: number;
  status: "active" | "paused" | "completed";
  projectStatus: ProjectStatus;
  projectName: string;
  lastUpdatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  clientId: string;
  serviceId: string;
  /** Joined from services.name for display */
  serviceName: string;
  parentId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy: "client" | "vitespace";
  createdByUserId?: string;
  createdByEmail?: string;
  timelineStart?: string;
  timelineEnd?: string;
  /** Inclusive day count from start→end (same day = 1) */
  days?: number;
  /** Public URL to the shipped output (live page, doc, module, etc.) */
  deliverableUrl?: string;
  /** CTA label, e.g. "View Page", "View Property" */
  deliverableLabel?: string;
  /** Bullet list shown in deliverable detail panel */
  deliveredItems?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  clientId: string;
  title: string;
  type: ActionItemType;
  linkedEntityId?: string;
  priority: "high" | "normal";
  requestedAt: string;
}

export interface ProgressArea {
  id: string;
  clientId: string;
  label: string;
  value: number;
  sortOrder: number;
}

export interface ChangeRequest {
  id: string;
  clientId: string;
  number: string;
  title: string;
  description: string;
  project: string;
  status: RequestStatus;
  requestedBy: string;
  requestedAt: string;
  estimatedHours?: number;
  additionalCost?: number;
  priority: "normal" | "high";
}

export interface Approval {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  items: string[];
  requestedAt: string;
  dueDate?: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  title: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  status: InvoiceStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface Document {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  uploadedAt: string;
  size: string;
  fileUrl?: string;
  mimeType?: string;
  uploadedBy?: "client" | "vitespace";
  uploadedByUserId?: string;
  uploadedByEmail?: string;
  editedAt?: string;
}

export interface Message {
  id: string;
  clientId: string;
  /** Portal user (auth.users.id) who owns this DM thread with Vitespace */
  userId?: string;
  sender: "client" | "vitespace";
  senderName: string;
  content: string;
  timestamp: string;
  editedAt?: string;
  /** Optional legacy UI fields — not stored in Supabase messages table */
  context?: ConversationContext;
  contextLabel?: string;
  contextHref?: string;
}

export interface RoadmapItem {
  id: string;
  clientId: string;
  title: string;
  category: "website" | "seo" | "other";
  status: RoadmapStatus;
  month: string;
}

export interface Notification {
  id: string;
  clientId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  href: string;
}

/** Computed dashboard stats for admin client list */
export interface ClientDashboardStats {
  awaitingClient: number;
  openRequests: number;
  pendingInvoices: number;
  pendingApprovals: number;
  inProgress: number;
  completed: number;
}
