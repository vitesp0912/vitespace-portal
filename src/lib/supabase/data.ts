import type {
  Client,
  Document,
  DocumentCategory,
  Invoice,
  InvoiceStatus,
  Message,
  Notification,
  Service,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskRow = {
  id: string;
  clientId: string;
  serviceId: string;
  serviceName?: string;
  parentId?: string;
  title: string;
  description?: string;
  status: string;
  createdBy: "client" | "vitespace";
  createdByUserId?: string;
  createdByEmail?: string;
  timelineStart?: string;
  timelineEnd?: string;
  days?: number;
  deliverableUrl?: string;
  deliverableLabel?: string;
  deliveredItems?: string[];
  createdAt: string;
  updatedAt: string;
};

export type PortalSnapshot = {
  clients: Client[];
  services: Service[];
  invoices: Invoice[];
  documents: Document[];
  messages: Message[];
  notifications: Notification[];
  tasks: TaskRow[];
};

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    name: String(row.name),
    company: String(row.company),
    email: String(row.email),
    avatar: row.avatar ? String(row.avatar) : undefined,
    monthlyRetainer: Number(row.monthly_retainer ?? 0),
    status: row.status as Client["status"],
    projectStatus: row.project_status as Client["projectStatus"],
    projectName: String(row.project_name),
    lastUpdatedAt: String(row.last_updated_at ?? new Date().toISOString()),
  };
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    number: String(row.number),
    title: String(row.title),
    amount: Number(row.amount ?? 0),
    issuedAt: String(row.issued_at ?? ""),
    dueAt: String(row.due_at ?? ""),
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
    status: (row.status as InvoiceStatus) || "pending",
    fileUrl: row.file_url ? String(row.file_url) : undefined,
    fileName: row.file_name ? String(row.file_name) : undefined,
    fileSize: row.file_size ? String(row.file_size) : undefined,
  };
}

function mapDocument(row: Record<string, unknown>): Document {
  const category = (row.category as DocumentCategory) || "project_documents";
  const uploadedBy =
    row.uploaded_by === "client" || row.uploaded_by === "vitespace"
      ? row.uploaded_by
      : undefined;
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    category,
    uploadedAt: String(row.uploaded_at ?? "").split("T")[0],
    size: String(row.file_size ?? ""),
    fileUrl: row.file_url ? String(row.file_url) : undefined,
    mimeType: row.mime_type ? String(row.mime_type) : undefined,
    uploadedBy,
    uploadedByUserId: row.uploaded_by_user_id
      ? String(row.uploaded_by_user_id)
      : undefined,
    uploadedByEmail: row.uploaded_by_email
      ? String(row.uploaded_by_email)
      : undefined,
    editedAt: row.edited_at ? String(row.edited_at) : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    sender: row.sender as Message["sender"],
    senderName: String(row.sender_name),
    content: String(row.content),
    timestamp: String(row.created_at ?? new Date().toISOString()),
    editedAt: row.edited_at ? String(row.edited_at) : undefined,
  };
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    title: String(row.title),
    message: String(row.message),
    timestamp: String(row.created_at ?? new Date().toISOString()),
    read: Boolean(row.read),
    href: row.href ? String(row.href) : "/",
  };
}

function mapTask(row: Record<string, unknown>): TaskRow {
  const serviceJoin = row.services as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    serviceId: String(row.service_id),
    serviceName: serviceJoin?.name ? String(serviceJoin.name) : undefined,
    parentId: row.parent_id ? String(row.parent_id) : undefined,
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    status: String(row.status),
    createdBy: row.created_by as TaskRow["createdBy"],
    createdByUserId: row.created_by_user_id
      ? String(row.created_by_user_id)
      : undefined,
    createdByEmail: row.created_by_email
      ? String(row.created_by_email)
      : undefined,
    timelineStart: row.timeline_start ? String(row.timeline_start) : undefined,
    timelineEnd: row.timeline_end ? String(row.timeline_end) : undefined,
    days: row.days != null ? Number(row.days) : undefined,
    deliverableUrl: row.deliverable_url
      ? String(row.deliverable_url)
      : undefined,
    deliverableLabel: row.deliverable_label
      ? String(row.deliverable_label)
      : undefined,
    deliveredItems: Array.isArray(row.delivered_items)
      ? (row.delivered_items as string[])
      : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapServiceRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    createdAt: String(row.created_at ?? ""),
  };
}

/** Load portal entities visible to the current auth user (RLS applies). */
export async function fetchPortalSnapshot(
  supabase: SupabaseClient,
  options?: { notificationRecipient?: "client" | "vitespace" }
): Promise<PortalSnapshot> {
  const recipient = options?.notificationRecipient;

  const [
    clientsRes,
    servicesRes,
    invoicesRes,
    documentsRes,
    messagesRes,
    notificationsRes,
    tasksRes,
  ] = await Promise.all([
    supabase.from("clients").select("*").order("company"),
    supabase.from("services").select("*").order("name"),
    supabase.from("invoices").select("*").order("issued_at", { ascending: false }),
    supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: true }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*, services(name)")
      .order("updated_at", { ascending: false }),
  ]);

  const firstError =
    clientsRes.error ||
    servicesRes.error ||
    invoicesRes.error ||
    documentsRes.error ||
    messagesRes.error ||
    notificationsRes.error ||
    tasksRes.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  let notifications = (notificationsRes.data ?? []).map(mapNotification);
  if (recipient) {
    notifications = (notificationsRes.data ?? [])
      .filter((row) => String(row.recipient) === recipient)
      .map(mapNotification);
  }

  return {
    clients: (clientsRes.data ?? []).map(mapClient),
    services: (servicesRes.data ?? []).map(mapServiceRow),
    invoices: (invoicesRes.data ?? []).map(mapInvoice),
    documents: (documentsRes.data ?? []).map(mapDocument),
    messages: (messagesRes.data ?? []).map(mapMessage),
    notifications,
    tasks: (tasksRes.data ?? []).map(mapTask),
  };
}

export async function resolveUserAccess(supabase: SupabaseClient, userId: string) {
  const membershipRes = await supabase
    .from("client_users")
    .select("client_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipRes.error) throw new Error(membershipRes.error.message);

  // admin_users powers RLS; app admin gate is hardcoded ADMIN_EMAIL
  let isAdmin = false;
  const adminRes = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!adminRes.error) {
    isAdmin = Boolean(adminRes.data);
  }

  return {
    isAdmin,
    clientId: membershipRes.data?.client_id ?? null,
    role: membershipRes.data?.role ?? null,
  };
}
