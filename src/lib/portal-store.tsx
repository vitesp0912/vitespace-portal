"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ActionItem,
  Approval,
  ApprovalStatus,
  ChangeRequest,
  Client,
  ClientDashboardStats,
  Document,
  Invoice,
  InvoiceStatus,
  Message,
  Notification,
  ProgressArea,
  ProjectStatus,
  RequestStatus,
  RoadmapItem,
  Service,
  TaskStatus,
  WorkItem,
  MessageRead,
  NotificationRead,
} from "@/types";
import { createClient } from "@/lib/supabase/client";
import { fetchPortalSnapshot } from "@/lib/supabase/data";
import { taskInclusiveDays, taskToWorkItem, workItemToTaskInsert } from "@/lib/tasks";

export interface PortalState {
  clients: Client[];
  services: Service[];
  workItems: WorkItem[];
  actionItems: ActionItem[];
  progressAreas: ProgressArea[];
  changeRequests: ChangeRequest[];
  approvals: Approval[];
  invoices: Invoice[];
  documents: Document[];
  messages: Message[];
  messageReads: MessageRead[];
  notificationReads: NotificationRead[];
  roadmapItems: RoadmapItem[];
  notifications: Notification[];
  activeClientId: string;
}

const EMPTY_STATE: PortalState = {
  clients: [],
  services: [],
  workItems: [],
  actionItems: [],
  progressAreas: [],
  changeRequests: [],
  approvals: [],
  invoices: [],
  documents: [],
  messages: [],
  messageReads: [],
  notificationReads: [],
  roadmapItems: [],
  notifications: [],
  activeClientId: "",
};

function uid(prefix: string) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function isThisMonth(dateString?: string) {
  if (!dateString) return false;
  const datePart = dateString.split("T")[0];
  const [year, month] = datePart.split("-").map(Number);
  if (!year || !month) return false;
  const now = new Date();
  return month === now.getMonth() + 1 && year === now.getFullYear();
}

function workItemMonthDate(item: WorkItem) {
  return item.timelineStart || item.timelineEnd || item.createdAt;
}

function filterClient<T extends { clientId: string }>(items: T[], clientId: string) {
  return items.filter((i) => i.clientId === clientId);
}

export interface ClientInput {
  name: string;
  company: string;
  email: string;
  monthlyRetainer: number;
  status: Client["status"];
  projectStatus: ProjectStatus;
  projectName: string;
  avatar?: string;
}

export interface WorkItemInput {
  title: string;
  status: TaskStatus;
  serviceId: string;
  description?: string;
  timelineStart?: string;
  timelineEnd?: string;
  parentId?: string;
  createdBy?: "client" | "vitespace";
  createdByUserId?: string;
  createdByEmail?: string;
  deliverableUrl?: string;
  deliverableLabel?: string;
  deliveredItems?: string[];
}

export interface ServiceInput {
  name: string;
}

export interface ActionItemInput {
  title: string;
  type: ActionItem["type"];
  priority: ActionItem["priority"];
  linkedEntityId?: string;
}

export interface ProgressAreaInput {
  label: string;
  value: number;
  sortOrder: number;
}

export interface ChangeRequestInput {
  title: string;
  description: string;
  project: string;
  status: RequestStatus;
  requestedBy: string;
  estimatedHours?: number;
  additionalCost?: number;
  priority: "normal" | "high";
}

export interface ApprovalInput {
  title: string;
  description: string;
  status: ApprovalStatus;
  items: string[];
  dueDate?: string;
}

export interface InvoiceInput {
  id?: string;
  number: string;
  title: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  paidAt?: string;
  /** Pass null to clear the attached file */
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
}

export interface DocumentInput {
  id?: string;
  name: string;
  category: Document["category"];
  size: string;
  fileUrl?: string;
  description?: string;
  mimeType?: string;
  uploadedBy?: Document["uploadedBy"];
  uploadedByUserId?: string;
  uploadedByEmail?: string;
  editedAt?: string;
}

export interface MessageInput {
  content: string;
  /** Auth user id of the portal user for this DM thread (required) */
  userId: string;
  /** Override display name (e.g. portal user name from client_users) */
  senderName?: string;
  context?: Message["context"];
  contextLabel?: string;
  contextHref?: string;
}

export interface RoadmapInput {
  title: string;
  category: RoadmapItem["category"];
  status: RoadmapItem["status"];
  month: string;
}

export interface NotificationInput {
  title: string;
  message: string;
  href: string;
  read?: boolean;
}

type PortalContextValue = PortalState & {
  hydrated: boolean;
  activeClient: Client | undefined;
  setActiveClientId: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  getClientStats: (clientId: string) => ClientDashboardStats & {
    completedThisMonth: number;
    upcoming: number;
  };
  getWorkItemsForClient: (clientId: string) => WorkItem[];
  getServices: () => Service[];
  getActionItemsForClient: (clientId: string) => ActionItem[];
  getProgressAreasForClient: (clientId: string) => ProgressArea[];
  getChangeRequestsForClient: (clientId: string) => ChangeRequest[];
  getApprovalsForClient: (clientId: string) => Approval[];
  getInvoicesForClient: (clientId: string) => Invoice[];
  getDocumentsForClient: (clientId: string) => Document[];
  getMessagesForClient: (clientId: string, threadUserId?: string) => Message[];
  getUnreadMessageCount: (
    clientId: string,
    reader: "client" | "vitespace",
    threadUserId?: string
  ) => number;
  markThreadRead: (
    clientId: string,
    threadUserId: string,
    reader: "client" | "vitespace"
  ) => Promise<void>;
  upsertRealtimeMessage: (message: Message) => void;
  removeRealtimeMessage: (id: string) => void;
  getRoadmapForClient: (clientId: string) => RoadmapItem[];
  getNotificationsForClient: (clientId: string) => Notification[];
  /** Client bell: notifications with per-user `read` derived from notification_reads. */
  getNotificationsForUser: (clientId: string, userId: string) => Notification[];
  getUnreadNotificationCount: (clientId: string, userId: string) => number;
  getNotificationLastReadAt: (clientId: string, userId: string) => string | null;
  getOverallProgress: (clientId: string) => number;
  addClient: (
    input: ClientInput
  ) => Promise<{ ok: true; client: Client } | { ok: false; error: string }>;
  updateClient: (
    id: string,
    input: Partial<ClientInput>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteClient: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  touchClientUpdated: (clientId: string) => void;
  addWorkItem: (
    clientId: string,
    input: WorkItemInput
  ) => Promise<{ ok: true; item: WorkItem } | { ok: false; error: string }>;
  updateWorkItem: (
    id: string,
    input: Partial<WorkItemInput>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteWorkItem: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  addService: (
    input: ServiceInput
  ) => Promise<{ ok: true; service: Service } | { ok: false; error: string }>;
  updateService: (
    id: string,
    input: Partial<ServiceInput>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteService: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  addActionItem: (clientId: string, input: ActionItemInput) => ActionItem;
  updateActionItem: (id: string, input: Partial<ActionItemInput>) => void;
  deleteActionItem: (id: string) => void;
  addProgressArea: (clientId: string, input: ProgressAreaInput) => ProgressArea;
  updateProgressArea: (id: string, input: Partial<ProgressAreaInput>) => void;
  deleteProgressArea: (id: string) => void;
  addChangeRequest: (clientId: string, input: ChangeRequestInput) => ChangeRequest;
  updateChangeRequest: (id: string, input: Partial<ChangeRequestInput>) => void;
  deleteChangeRequest: (id: string) => void;
  submitChangeRequest: (clientId: string, input: Omit<ChangeRequestInput, "status" | "requestedBy">) => ChangeRequest;
  addApproval: (clientId: string, input: ApprovalInput) => Approval;
  updateApproval: (id: string, input: Partial<ApprovalInput>) => void;
  deleteApproval: (id: string) => void;
  respondToApproval: (id: string, status: ApprovalStatus) => void;
  addInvoice: (clientId: string, input: InvoiceInput) => Invoice;
  updateInvoice: (
    id: string,
    input: Partial<InvoiceInput>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteInvoice: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  markInvoicePaid: (
    id: string,
    paidAt?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  addDocument: (clientId: string, input: DocumentInput) => Document;
  updateDocument: (
    id: string,
    input: Partial<DocumentInput>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteDocument: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  addMessage: (
    clientId: string,
    input: MessageInput,
    sender?: "client" | "vitespace"
  ) => Promise<{ ok: true; message: Message } | { ok: false; error: string }>;
  updateMessage: (
    id: string,
    content: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteMessage: (id: string) => void;
  addRoadmapItem: (clientId: string, input: RoadmapInput) => RoadmapItem;
  updateRoadmapItem: (id: string, input: Partial<RoadmapInput>) => void;
  deleteRoadmapItem: (id: string) => void;
  addNotification: (clientId: string, input: NotificationInput) => Notification;
  updateNotification: (id: string, input: Partial<NotificationInput>) => void;
  deleteNotification: (id: string) => void;
  markNotificationRead: (id: string, read?: boolean) => void;
  /** Per-user cursor — does not flip shared notifications.read. */
  markNotificationsReadForUser: (clientId: string, userId: string) => void;
  upsertRealtimeNotification: (notification: Notification) => void;
  upsertRealtimeNotificationRead: (read: NotificationRead) => void;
  removeRealtimeNotification: (id: string) => void;
  upsertRealtimeDocument: (document: Document) => void;
  removeRealtimeDocument: (id: string) => void;
  refreshFromSupabase: (options?: {
    isAdmin?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  dataError: string | null;
  loadingData: boolean;
  resetToSeed: () => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PortalState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem("vitespace-portal-state");
      localStorage.removeItem("vitespace-client-session");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const patch = useCallback((fn: (s: PortalState) => PortalState) => {
    setState(fn);
  }, []);

  const refreshFromSupabase = useCallback(
    async (options?: { isAdmin?: boolean }) => {
      setLoadingData(true);
      setDataError(null);
      try {
        const supabase = createClient();
        const snapshot = await fetchPortalSnapshot(supabase, {
          notificationRecipient: options?.isAdmin ? "vitespace" : "client",
        });
        setState((s) => ({
          ...s,
          clients: snapshot.clients,
          services: snapshot.services,
          invoices: snapshot.invoices,
          documents: snapshot.documents,
          messages: snapshot.messages,
          messageReads: snapshot.messageReads,
          notificationReads: snapshot.notificationReads,
          notifications: snapshot.notifications,
          workItems: snapshot.tasks.map((t) =>
            taskToWorkItem(t, t.serviceName)
          ),
          // Legacy entities not in Supabase yet — keep empty
          actionItems: [],
          progressAreas: [],
          changeRequests: [],
          approvals: [],
          roadmapItems: [],
        }));
        return { ok: true as const };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load data";
        setDataError(message);
        return { ok: false as const, error: message };
      } finally {
        setLoadingData(false);
      }
    },
    []
  );

  const activeClient = useMemo(
    () => state.clients.find((c) => c.id === state.activeClientId),
    [state.clients, state.activeClientId]
  );

  const setActiveClientId = useCallback((id: string) => {
    patch((s) => ({ ...s, activeClientId: id }));
  }, [patch]);

  const getClient = useCallback(
    (id: string) => state.clients.find((c) => c.id === id),
    [state.clients]
  );

  const getWorkItemsForClient = useCallback(
    (clientId: string) =>
      filterClient(state.workItems, clientId).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [state.workItems]
  );

  const getServices = useCallback(
    () => [...state.services].sort((a, b) => a.name.localeCompare(b.name)),
    [state.services]
  );

  const getClientStats = useCallback(
    (clientId: string) => {
      const items = filterClient(state.workItems, clientId);
      return {
        completed: items.filter((i) => i.status === "completed").length,
        inProgress: items.filter((i) => i.status === "in_progress").length,
        awaitingClient: items.filter((i) => i.status === "pending_approval")
          .length,
        upcoming: items.filter((i) =>
          ["requested", "approved"].includes(i.status)
        ).length,
        completedThisMonth: items.filter(
          (i) =>
            i.status === "completed" &&
            isThisMonth(workItemMonthDate(i))
        ).length,
        openRequests: filterClient(state.changeRequests, clientId).filter(
          (r) => !["completed", "rejected"].includes(r.status)
        ).length,
        pendingInvoices: filterClient(state.invoices, clientId).filter(
          (i) => i.status === "pending" || i.status === "overdue"
        ).length,
        pendingApprovals: filterClient(state.approvals, clientId).filter(
          (a) => a.status === "pending"
        ).length,
      };
    },
    [state.workItems, state.changeRequests, state.invoices, state.approvals]
  );

  const getOverallProgress = useCallback(
    (clientId: string) => {
      const areas = filterClient(state.progressAreas, clientId);
      if (!areas.length) return 0;
      return Math.round(areas.reduce((s, a) => s + a.value, 0) / areas.length);
    },
    [state.progressAreas]
  );

  const touchClientUpdated = useCallback(
    (clientId: string) => {
      patch((s) => ({
        ...s,
        clients: s.clients.map((c) =>
          c.id === clientId ? { ...c, lastUpdatedAt: new Date().toISOString() } : c
        ),
      }));
    },
    [patch]
  );

  const addClient = useCallback(
    async (
      input: ClientInput
    ): Promise<{ ok: true; client: Client } | { ok: false; error: string }> => {
      const base = input.company
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24);
      const id = base || `client-${Date.now()}`;
      const client: Client = {
        id,
        ...input,
        lastUpdatedAt: new Date().toISOString(),
      };

      const { error } = await createClient().from("clients").upsert({
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        monthly_retainer: client.monthlyRetainer,
        status: client.status,
        project_status: client.projectStatus,
        project_name: client.projectName,
        last_updated_at: client.lastUpdatedAt,
      });

      if (error) return { ok: false, error: error.message };

      patch((s) => ({ ...s, clients: [...s.clients, client] }));
      return { ok: true, client };
    },
    [patch]
  );

  const updateClient = useCallback(
    async (
      id: string,
      input: Partial<ClientInput>
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const lastUpdatedAt = new Date().toISOString();
      const row: Record<string, unknown> = { last_updated_at: lastUpdatedAt };
      if (input.name !== undefined) row.name = input.name;
      if (input.company !== undefined) row.company = input.company;
      if (input.email !== undefined) row.email = input.email;
      if (input.monthlyRetainer !== undefined)
        row.monthly_retainer = input.monthlyRetainer;
      if (input.status !== undefined) row.status = input.status;
      if (input.projectStatus !== undefined)
        row.project_status = input.projectStatus;
      if (input.projectName !== undefined) row.project_name = input.projectName;
      if (input.avatar !== undefined) row.avatar = input.avatar || null;

      const { error } = await createClient()
        .from("clients")
        .update(row)
        .eq("id", id);

      if (error) return { ok: false, error: error.message };

      patch((s) => ({
        ...s,
        clients: s.clients.map((c) =>
          c.id === id ? { ...c, ...input, lastUpdatedAt } : c
        ),
      }));
      return { ok: true };
    },
    [patch]
  );

  const deleteClient = useCallback(
    async (
      id: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const { error } = await createClient().from("clients").delete().eq("id", id);
      if (error) return { ok: false, error: error.message };

      patch((s) => ({
        ...s,
        clients: s.clients.filter((c) => c.id !== id),
        workItems: s.workItems.filter((i) => i.clientId !== id),
        actionItems: s.actionItems.filter((i) => i.clientId !== id),
        progressAreas: s.progressAreas.filter((i) => i.clientId !== id),
        changeRequests: s.changeRequests.filter((i) => i.clientId !== id),
        approvals: s.approvals.filter((i) => i.clientId !== id),
        invoices: s.invoices.filter((i) => i.clientId !== id),
        documents: s.documents.filter((i) => i.clientId !== id),
        messages: s.messages.filter((i) => i.clientId !== id),
        messageReads: s.messageReads.filter((i) => i.clientId !== id),
        notificationReads: s.notificationReads.filter((i) => i.clientId !== id),
        roadmapItems: s.roadmapItems.filter((i) => i.clientId !== id),
        notifications: s.notifications.filter((i) => i.clientId !== id),
        activeClientId: s.activeClientId === id ? "" : s.activeClientId,
      }));
      return { ok: true };
    },
    [patch]
  );

  const addWorkItem = useCallback(
    async (
      clientId: string,
      input: WorkItemInput
    ): Promise<{ ok: true; item: WorkItem } | { ok: false; error: string }> => {
      if (!input.serviceId) {
        return { ok: false, error: "Select a service for this task." };
      }

      const service = state.services.find((s) => s.id === input.serviceId);
      if (!service) {
        return { ok: false, error: "Invalid service." };
      }

      const ts = new Date().toISOString();
      const createdBy = input.createdBy ?? "vitespace";
      const item: WorkItem = {
        id: uid("task_"),
        clientId,
        serviceId: input.serviceId,
        serviceName: service.name,
        parentId: input.parentId,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        status: input.status,
        createdBy,
        createdByUserId: input.createdByUserId,
        createdByEmail: input.createdByEmail,
        timelineStart: input.timelineStart || undefined,
        timelineEnd: input.timelineEnd || undefined,
        days: taskInclusiveDays(input.timelineStart, input.timelineEnd),
        deliverableUrl: input.deliverableUrl?.trim() || undefined,
        deliverableLabel: input.deliverableLabel?.trim() || undefined,
        deliveredItems: input.deliveredItems?.length
          ? input.deliveredItems
          : undefined,
        createdAt: ts,
        updatedAt: ts,
      };

      const { error } = await createClient()
        .from("tasks")
        .insert(workItemToTaskInsert(item, createdBy));

      if (error) return { ok: false, error: error.message };

      patch((s) => ({ ...s, workItems: [item, ...s.workItems] }));
      touchClientUpdated(clientId);
      return { ok: true, item };
    },
    [patch, state.services, touchClientUpdated]
  );

  const updateWorkItem = useCallback(
    async (
      id: string,
      input: Partial<WorkItemInput>
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const existing = state.workItems.find((i) => i.id === id);
      if (!existing) return { ok: false, error: "Task not found." };

      let serviceName = existing.serviceName;
      const serviceId = input.serviceId ?? existing.serviceId;
      if (input.serviceId) {
        const service = state.services.find((s) => s.id === input.serviceId);
        if (!service) {
          return { ok: false, error: "Invalid service." };
        }
        serviceName = service.name;
      }

      const ts = new Date().toISOString();
      const next: WorkItem = {
        ...existing,
        serviceId,
        serviceName,
        parentId:
          input.parentId !== undefined ? input.parentId : existing.parentId,
        title: input.title?.trim() ?? existing.title,
        description:
          input.description !== undefined
            ? input.description.trim() || undefined
            : existing.description,
        status: input.status ?? existing.status,
        createdBy: input.createdBy ?? existing.createdBy,
        createdByUserId:
          input.createdByUserId !== undefined
            ? input.createdByUserId
            : existing.createdByUserId,
        createdByEmail:
          input.createdByEmail !== undefined
            ? input.createdByEmail
            : existing.createdByEmail,
        timelineStart:
          input.timelineStart !== undefined
            ? input.timelineStart || undefined
            : existing.timelineStart,
        timelineEnd:
          input.timelineEnd !== undefined
            ? input.timelineEnd || undefined
            : existing.timelineEnd,
        deliverableUrl:
          input.deliverableUrl !== undefined
            ? input.deliverableUrl.trim() || undefined
            : existing.deliverableUrl,
        deliverableLabel:
          input.deliverableLabel !== undefined
            ? input.deliverableLabel.trim() || undefined
            : existing.deliverableLabel,
        deliveredItems:
          input.deliveredItems !== undefined
            ? input.deliveredItems.length
              ? input.deliveredItems
              : undefined
            : existing.deliveredItems,
        updatedAt: ts,
      };
      next.days = taskInclusiveDays(next.timelineStart, next.timelineEnd);

      const row: Record<string, unknown> = {
        updated_at: ts,
        service_id: next.serviceId,
        parent_id: next.parentId ?? null,
        title: next.title,
        description: next.description ?? null,
        status: next.status,
        created_by: next.createdBy,
        created_by_user_id: next.createdByUserId ?? null,
        created_by_email: next.createdByEmail ?? null,
        timeline_start: next.timelineStart || null,
        timeline_end: next.timelineEnd || null,
        deliverable_url: next.deliverableUrl ?? null,
        deliverable_label: next.deliverableLabel ?? null,
        delivered_items: next.deliveredItems?.length ? next.deliveredItems : [],
      };

      const { error } = await createClient()
        .from("tasks")
        .update(row)
        .eq("id", id);

      if (error) return { ok: false, error: error.message };

      patch((s) => ({
        ...s,
        workItems: s.workItems.map((item) => (item.id === id ? next : item)),
      }));
      return { ok: true };
    },
    [patch, state.workItems, state.services]
  );

  const deleteWorkItem = useCallback(
    async (
      id: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const { error } = await createClient().from("tasks").delete().eq("id", id);
      if (error) return { ok: false, error: error.message };
      patch((s) => ({ ...s, workItems: s.workItems.filter((i) => i.id !== id) }));
      return { ok: true };
    },
    [patch]
  );

  const addService = useCallback(
    async (
      input: ServiceInput
    ): Promise<{ ok: true; service: Service } | { ok: false; error: string }> => {
      const name = input.name.trim();
      if (!name) return { ok: false, error: "Service name is required." };

      const service: Service = {
        id: uid("svc_"),
        name,
        createdAt: new Date().toISOString(),
      };

      const { error } = await createClient().from("services").insert({
        id: service.id,
        name: service.name,
        created_at: service.createdAt,
      });

      if (error) return { ok: false, error: error.message };

      patch((s) => ({ ...s, services: [...s.services, service] }));
      return { ok: true, service };
    },
    [patch]
  );

  const updateService = useCallback(
    async (
      id: string,
      input: Partial<ServiceInput>
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const name = input.name?.trim();
      if (name !== undefined && !name) {
        return { ok: false, error: "Service name is required." };
      }

      const row: Record<string, unknown> = {};
      if (name !== undefined) row.name = name;

      if (Object.keys(row).length) {
        const { error } = await createClient()
          .from("services")
          .update(row)
          .eq("id", id);
        if (error) return { ok: false, error: error.message };
      }

      patch((s) => ({
        ...s,
        services: s.services.map((svc) =>
          svc.id === id ? { ...svc, ...(name !== undefined ? { name } : {}) } : svc
        ),
        workItems: s.workItems.map((item) =>
          item.serviceId === id && name !== undefined
            ? { ...item, serviceName: name }
            : item
        ),
      }));
      return { ok: true };
    },
    [patch]
  );

  const deleteService = useCallback(
    async (
      id: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const inUse = state.workItems.some((w) => w.serviceId === id);
      if (inUse) {
        return {
          ok: false,
          error: "Cannot delete a service that still has tasks. Reassign or delete those tasks first.",
        };
      }

      const { error } = await createClient()
        .from("services")
        .delete()
        .eq("id", id);
      if (error) return { ok: false, error: error.message };

      patch((s) => ({
        ...s,
        services: s.services.filter((svc) => svc.id !== id),
      }));
      return { ok: true };
    },
    [patch, state.workItems]
  );

  const getActionItemsForClient = useCallback(
    (clientId: string) => filterClient(state.actionItems, clientId),
    [state.actionItems]
  );
  const getProgressAreasForClient = useCallback(
    (clientId: string) =>
      filterClient(state.progressAreas, clientId).sort((a, b) => a.sortOrder - b.sortOrder),
    [state.progressAreas]
  );
  const getChangeRequestsForClient = useCallback(
    (clientId: string) =>
      filterClient(state.changeRequests, clientId).sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      ),
    [state.changeRequests]
  );
  const getApprovalsForClient = useCallback(
    (clientId: string) => filterClient(state.approvals, clientId),
    [state.approvals]
  );
  const getInvoicesForClient = useCallback(
    (clientId: string) =>
      filterClient(state.invoices, clientId).sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
      ),
    [state.invoices]
  );
  const getDocumentsForClient = useCallback(
    (clientId: string) =>
      filterClient(state.documents, clientId).sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ),
    [state.documents]
  );
  const getMessagesForClient = useCallback(
    (clientId: string, threadUserId?: string) =>
      filterClient(state.messages, clientId)
        .filter((m) =>
          threadUserId ? m.userId === threadUserId : true
        )
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
    [state.messages]
  );

  const getUnreadMessageCount = useCallback(
    (
      clientId: string,
      reader: "client" | "vitespace",
      threadUserId?: string
    ) => {
      const incomingSender = reader === "client" ? "vitespace" : "client";
      const threads = filterClient(state.messages, clientId).filter((m) =>
        threadUserId ? m.userId === threadUserId : Boolean(m.userId)
      );

      let count = 0;
      const threadIds = new Set(
        threads
          .map((m) => m.userId)
          .filter((id): id is string => Boolean(id))
      );

      for (const tid of threadIds) {
        const read = state.messageReads.find(
          (r) =>
            r.clientId === clientId &&
            r.threadUserId === tid &&
            r.reader === reader
        );
        const since = read ? new Date(read.lastReadAt).getTime() : Date.now();
        count += threads.filter(
          (m) =>
            m.userId === tid &&
            m.sender === incomingSender &&
            new Date(m.timestamp).getTime() > since
        ).length;
      }
      return count;
    },
    [state.messages, state.messageReads]
  );

  const markThreadRead = useCallback(
    async (
      clientId: string,
      threadUserId: string,
      reader: "client" | "vitespace"
    ) => {
      const lastReadAt = new Date().toISOString();
      patch((s) => {
        const without = s.messageReads.filter(
          (r) =>
            !(
              r.clientId === clientId &&
              r.threadUserId === threadUserId &&
              r.reader === reader
            )
        );
        return {
          ...s,
          messageReads: [
            ...without,
            { clientId, threadUserId, reader, lastReadAt },
          ],
        };
      });

      const supabase = createClient();
      await supabase.from("message_reads").upsert(
        {
          client_id: clientId,
          thread_user_id: threadUserId,
          reader,
          last_read_at: lastReadAt,
        },
        { onConflict: "client_id,thread_user_id,reader" }
      );
    },
    [patch]
  );

  const upsertRealtimeMessage = useCallback(
    (message: Message) => {
      patch((s) => {
        const idx = s.messages.findIndex((m) => m.id === message.id);
        if (idx === -1) {
          return { ...s, messages: [...s.messages, message] };
        }
        const next = s.messages.slice();
        next[idx] = message;
        return { ...s, messages: next };
      });
    },
    [patch]
  );

  const removeRealtimeMessage = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        messages: s.messages.filter((m) => m.id !== id),
      }));
    },
    [patch]
  );

  const getRoadmapForClient = useCallback(
    (clientId: string) => filterClient(state.roadmapItems, clientId),
    [state.roadmapItems]
  );
  const getNotificationsForClient = useCallback(
    (clientId: string) =>
      filterClient(state.notifications, clientId).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [state.notifications]
  );

  const getNotificationLastReadAt = useCallback(
    (clientId: string, userId: string): string | null => {
      const row = state.notificationReads.find(
        (r) => r.clientId === clientId && r.userId === userId
      );
      return row?.lastReadAt ?? null;
    },
    [state.notificationReads]
  );

  const getNotificationsForUser = useCallback(
    (clientId: string, userId: string) => {
      const lastReadAt = getNotificationLastReadAt(clientId, userId);
      const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
      return getNotificationsForClient(clientId).map((n) => ({
        ...n,
        read: new Date(n.timestamp).getTime() <= since,
      }));
    },
    [getNotificationsForClient, getNotificationLastReadAt]
  );

  const getUnreadNotificationCount = useCallback(
    (clientId: string, userId: string) => {
      const lastReadAt = getNotificationLastReadAt(clientId, userId);
      const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
      return getNotificationsForClient(clientId).filter(
        (n) => new Date(n.timestamp).getTime() > since
      ).length;
    },
    [getNotificationsForClient, getNotificationLastReadAt]
  );

  const addActionItem = useCallback(
    (clientId: string, input: ActionItemInput): ActionItem => {
      const item: ActionItem = {
        id: uid("ai"),
        clientId,
        ...input,
        requestedAt: new Date().toISOString(),
      };
      patch((s) => ({ ...s, actionItems: [...s.actionItems, item] }));
      return item;
    },
    [patch]
  );
  const updateActionItem = useCallback(
    (id: string, input: Partial<ActionItemInput>) => {
      patch((s) => ({
        ...s,
        actionItems: s.actionItems.map((i) => (i.id === id ? { ...i, ...input } : i)),
      }));
    },
    [patch]
  );
  const deleteActionItem = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, actionItems: s.actionItems.filter((i) => i.id !== id) }));
    },
    [patch]
  );

  const addProgressArea = useCallback(
    (clientId: string, input: ProgressAreaInput): ProgressArea => {
      const area: ProgressArea = { id: uid("pa"), clientId, ...input };
      patch((s) => ({ ...s, progressAreas: [...s.progressAreas, area] }));
      return area;
    },
    [patch]
  );
  const updateProgressArea = useCallback(
    (id: string, input: Partial<ProgressAreaInput>) => {
      patch((s) => ({
        ...s,
        progressAreas: s.progressAreas.map((a) => (a.id === id ? { ...a, ...input } : a)),
      }));
    },
    [patch]
  );
  const deleteProgressArea = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, progressAreas: s.progressAreas.filter((a) => a.id !== id) }));
    },
    [patch]
  );

  const nextCrNumber = (clientId: string, crs: ChangeRequest[]) => {
    const nums = filterClient(crs, clientId).map((cr) =>
      parseInt(cr.number.replace(/\D/g, ""), 10)
    );
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `CR-${String(next).padStart(3, "0")}`;
  };

  const addChangeRequest = useCallback(
    (clientId: string, input: ChangeRequestInput): ChangeRequest => {
      const cr: ChangeRequest = {
        id: uid("cr"),
        clientId,
        number: nextCrNumber(clientId, state.changeRequests),
        requestedAt: new Date().toISOString().split("T")[0],
        ...input,
      };
      patch((s) => ({ ...s, changeRequests: [cr, ...s.changeRequests] }));
      touchClientUpdated(clientId);
      return cr;
    },
    [patch, state.changeRequests, touchClientUpdated]
  );

  const submitChangeRequest = useCallback(
    (clientId: string, input: Omit<ChangeRequestInput, "status" | "requestedBy">) => {
      const client = state.clients.find((c) => c.id === clientId);
      return addChangeRequest(clientId, {
        ...input,
        status: "under_review",
        requestedBy: client?.name ?? "Client",
      });
    },
    [addChangeRequest, state.clients]
  );

  const updateChangeRequest = useCallback(
    (id: string, input: Partial<ChangeRequestInput>) => {
      patch((s) => ({
        ...s,
        changeRequests: s.changeRequests.map((cr) =>
          cr.id === id ? { ...cr, ...input } : cr
        ),
      }));
    },
    [patch]
  );
  const deleteChangeRequest = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, changeRequests: s.changeRequests.filter((cr) => cr.id !== id) }));
    },
    [patch]
  );

  const addApproval = useCallback(
    (clientId: string, input: ApprovalInput): Approval => {
      const ap: Approval = {
        id: uid("ap"),
        clientId,
        requestedAt: new Date().toISOString().split("T")[0],
        ...input,
      };
      patch((s) => ({ ...s, approvals: [ap, ...s.approvals] }));
      return ap;
    },
    [patch]
  );
  const updateApproval = useCallback(
    (id: string, input: Partial<ApprovalInput>) => {
      patch((s) => ({
        ...s,
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, ...input } : a)),
      }));
    },
    [patch]
  );
  const deleteApproval = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, approvals: s.approvals.filter((a) => a.id !== id) }));
    },
    [patch]
  );
  const respondToApproval = useCallback(
    (id: string, status: ApprovalStatus) => {
      updateApproval(id, { status });
    },
    [updateApproval]
  );

  const addInvoice = useCallback(
    (clientId: string, input: InvoiceInput): Invoice => {
      const inv: Invoice = {
        id: input.id ?? uid("inv"),
        clientId,
        number: input.number,
        title: input.title,
        amount: input.amount,
        issuedAt: input.issuedAt,
        dueAt: input.dueAt,
        status: input.status,
        paidAt: input.paidAt,
        fileUrl: input.fileUrl ?? undefined,
        fileName: input.fileName ?? undefined,
        fileSize: input.fileSize ?? undefined,
      };
      patch((s) => {
        const without = s.invoices.filter((i) => i.id !== inv.id);
        return { ...s, invoices: [inv, ...without] };
      });
      return inv;
    },
    [patch]
  );
  const updateInvoice = useCallback(
    async (
      id: string,
      input: Partial<InvoiceInput>
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const existing = state.invoices.find((i) => i.id === id);
      if (!existing) return { ok: false, error: "Invoice not found." };

      const payload: Record<string, unknown> = {};
      if (input.number !== undefined) payload.number = input.number;
      if (input.title !== undefined) payload.title = input.title;
      if (input.amount !== undefined) payload.amount = input.amount;
      if (input.issuedAt !== undefined) payload.issuedAt = input.issuedAt;
      if (input.dueAt !== undefined) payload.dueAt = input.dueAt;
      if (input.status !== undefined) payload.status = input.status;
      if (input.fileUrl !== undefined) payload.fileUrl = input.fileUrl;
      if (input.fileName !== undefined) payload.fileName = input.fileName;
      if (input.fileSize !== undefined) payload.fileSize = input.fileSize;
      if (
        input.fileUrl === null &&
        input.fileName === null &&
        input.fileSize === null
      ) {
        payload.clearFile = true;
      }

      const res = await fetch(
        `/api/clients/${existing.clientId}/invoices/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error: (data as { error?: string }).error || "Failed to update invoice.",
        };
      }

      const local = (data as { local?: Invoice }).local;
      const clearFile = input.fileUrl === null;
      const next: Invoice = {
        ...existing,
        number: local?.number ?? input.number ?? existing.number,
        title: local?.title ?? input.title ?? existing.title,
        amount: local?.amount ?? input.amount ?? existing.amount,
        issuedAt: local?.issuedAt ?? input.issuedAt ?? existing.issuedAt,
        dueAt:
          input.dueAt !== undefined
            ? input.dueAt
            : local?.dueAt ?? existing.dueAt,
        status: local?.status ?? input.status ?? existing.status,
        paidAt: input.paidAt !== undefined ? input.paidAt : existing.paidAt,
        fileUrl: clearFile
          ? undefined
          : local?.fileUrl ||
            (input.fileUrl === undefined ? existing.fileUrl : input.fileUrl) ||
            undefined,
        fileName: clearFile
          ? undefined
          : local?.fileName ||
            (input.fileName === undefined ? existing.fileName : input.fileName) ||
            undefined,
        fileSize: clearFile
          ? undefined
          : local?.fileSize ||
            (input.fileSize === undefined ? existing.fileSize : input.fileSize) ||
            undefined,
      };

      patch((s) => ({
        ...s,
        invoices: s.invoices.map((i) => (i.id === id ? next : i)),
      }));
      return { ok: true };
    },
    [patch, state.invoices]
  );
  const deleteInvoice = useCallback(
    async (
      id: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const existing = state.invoices.find((i) => i.id === id);
      if (!existing) return { ok: false, error: "Invoice not found." };

      const res = await fetch(
        `/api/clients/${existing.clientId}/invoices/${id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error: (data as { error?: string }).error || "Failed to delete invoice.",
        };
      }

      patch((s) => ({
        ...s,
        invoices: s.invoices.filter((i) => i.id !== id),
        notifications: s.notifications.filter((n) => n.id !== `n_inv_${id}`),
      }));
      return { ok: true };
    },
    [patch, state.invoices]
  );
  const markInvoicePaid = useCallback(
    async (id: string, paidAt?: string) => {
      return updateInvoice(id, {
        status: "paid",
        paidAt: paidAt || new Date().toISOString().split("T")[0],
      });
    },
    [updateInvoice]
  );

  const addDocument = useCallback(
    (clientId: string, input: DocumentInput): Document => {
      const doc: Document = {
        id: input.id ?? uid("d"),
        clientId,
        uploadedAt: new Date().toISOString().split("T")[0],
        name: input.name,
        category: input.category,
        size: input.size,
        fileUrl: input.fileUrl,
        description: input.description,
        mimeType: input.mimeType,
        uploadedBy: input.uploadedBy,
        uploadedByUserId: input.uploadedByUserId,
        uploadedByEmail: input.uploadedByEmail,
        editedAt: input.editedAt,
      };
      patch((s) => {
        const without = s.documents.filter((d) => d.id !== doc.id);
        return { ...s, documents: [doc, ...without] };
      });
      return doc;
    },
    [patch]
  );
  const updateDocument = useCallback(
    async (
      id: string,
      input: Partial<DocumentInput>
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const existing = state.documents.find((d) => d.id === id);
      if (!existing) return { ok: false, error: "Document not found." };

      const editedAt =
        input.description !== undefined
          ? new Date().toISOString()
          : undefined;

      // Portal clients update their own docs via RLS; admin falls back to API if blocked.
      {
        const row: Record<string, unknown> = {};
        if (input.name !== undefined) row.name = input.name.trim();
        if (input.description !== undefined) {
          row.description = input.description;
          row.edited_at = editedAt;
        }
        if (input.category !== undefined) row.category = input.category;
        if (input.size !== undefined && input.size !== "") {
          row.file_size = input.size;
        }
        if (input.fileUrl !== undefined && input.fileUrl) {
          row.file_url = input.fileUrl;
        }
        if (input.mimeType !== undefined && input.mimeType) {
          row.mime_type = input.mimeType;
        }

        if (Object.keys(row).length) {
          const { error } = await createClient()
            .from("documents")
            .update(row)
            .eq("id", id);

          if (!error) {
            patch((s) => ({
              ...s,
              documents: s.documents.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      ...input,
                      name:
                        input.name !== undefined
                          ? input.name.trim()
                          : d.name,
                      description:
                        input.description !== undefined
                          ? input.description
                          : d.description,
                      fileUrl: input.fileUrl || d.fileUrl,
                      mimeType: input.mimeType || d.mimeType,
                      editedAt: editedAt ?? d.editedAt,
                    }
                  : d
              ),
            }));
            return { ok: true };
          }
          // Fall through to admin API if RLS blocked (typical for Vitespace admin)
        }
      }

      const payload: Record<string, unknown> = {};
      if (input.name !== undefined) payload.name = input.name;
      if (input.description !== undefined) payload.description = input.description;
      if (input.category !== undefined) payload.category = input.category;
      if (input.size !== undefined && input.size !== "") payload.size = input.size;
      if (input.fileUrl) payload.fileUrl = input.fileUrl;
      if (input.mimeType) payload.mimeType = input.mimeType;

      const res = await fetch(
        `/api/clients/${existing.clientId}/documents/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error:
            (data as { error?: string }).error || "Failed to update document.",
        };
      }

      const local = (data as { local?: Document }).local;
      patch((s) => ({
        ...s,
        documents: s.documents.map((d) =>
          d.id === id
            ? {
                ...d,
                ...(local
                  ? {
                      name: local.name,
                      description: local.description,
                      category: local.category,
                      size: local.size,
                      fileUrl: local.fileUrl,
                      mimeType: local.mimeType,
                      editedAt: local.editedAt ?? d.editedAt,
                    }
                  : {
                      ...input,
                      name:
                        input.name !== undefined
                          ? input.name.trim()
                          : d.name,
                      fileUrl: input.fileUrl || d.fileUrl,
                      mimeType: input.mimeType || d.mimeType,
                      editedAt: editedAt ?? d.editedAt,
                    }),
              }
            : d
        ),
      }));
      return { ok: true };
    },
    [patch, state.documents]
  );
  const deleteDocument = useCallback(
    async (
      id: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const existing = state.documents.find((d) => d.id === id);
      if (!existing) return { ok: false, error: "Document not found." };

      const res = await fetch(
        `/api/clients/${existing.clientId}/documents/${id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error:
            (data as { error?: string }).error || "Failed to delete document.",
        };
      }

      patch((s) => ({
        ...s,
        documents: s.documents.filter((d) => d.id !== id),
        notifications: s.notifications.filter((n) => n.id !== `n_doc_${id}`),
      }));
      return { ok: true };
    },
    [patch, state.documents]
  );

  const addMessage = useCallback(
    async (
      clientId: string,
      input: MessageInput,
      sender: "client" | "vitespace" = "vitespace"
    ): Promise<{ ok: true; message: Message } | { ok: false; error: string }> => {
      const threadUserId = input.userId?.trim();
      if (!threadUserId) {
        return { ok: false, error: "Select a portal user for this conversation." };
      }

      const client = state.clients.find((c) => c.id === clientId);
      const msg: Message = {
        id: uid("m"),
        clientId,
        userId: threadUserId,
        sender,
        senderName:
          input.senderName?.trim() ||
          (sender === "client" ? (client?.company ?? "Client") : "Vitespace"),
        content: input.content.trim(),
        timestamp: new Date().toISOString(),
        context: input.context,
        contextLabel: input.contextLabel,
        contextHref: input.contextHref,
      };

      const supabase = createClient();
      const { error } = await supabase.from("messages").insert({
        id: msg.id,
        client_id: clientId,
        user_id: threadUserId,
        sender: msg.sender,
        sender_name: msg.senderName,
        content: msg.content,
        created_at: msg.timestamp,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      patch((s) => ({ ...s, messages: [...s.messages, msg] }));
      touchClientUpdated(clientId);

      void supabase.from("notifications").insert({
        id: uid("n"),
        client_id: clientId,
        recipient: sender === "client" ? "vitespace" : "client",
        title: "New message",
        message: msg.content.slice(0, 120),
        href: "/messages",
        read: false,
      });

      return { ok: true, message: msg };
    },
    [patch, state.clients, touchClientUpdated]
  );

  const updateMessage = useCallback(
    async (
      id: string,
      content: string
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const trimmed = content.trim();
      if (!trimmed) return { ok: false, error: "Message cannot be empty." };

      const editedAt = new Date().toISOString();
      const supabase = createClient();
      const { error } = await supabase
        .from("messages")
        .update({ content: trimmed, edited_at: editedAt })
        .eq("id", id);

      if (error) {
        return { ok: false, error: error.message };
      }

      patch((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, content: trimmed, editedAt } : m
        ),
      }));
      return { ok: true };
    },
    [patch]
  );

  const deleteMessage = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== id) }));
      void createClient().from("messages").delete().eq("id", id);
    },
    [patch]
  );

  const addRoadmapItem = useCallback(
    (clientId: string, input: RoadmapInput): RoadmapItem => {
      const item: RoadmapItem = { id: uid("r"), clientId, ...input };
      patch((s) => ({ ...s, roadmapItems: [...s.roadmapItems, item] }));
      return item;
    },
    [patch]
  );
  const updateRoadmapItem = useCallback(
    (id: string, input: Partial<RoadmapInput>) => {
      patch((s) => ({
        ...s,
        roadmapItems: s.roadmapItems.map((r) => (r.id === id ? { ...r, ...input } : r)),
      }));
    },
    [patch]
  );
  const deleteRoadmapItem = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, roadmapItems: s.roadmapItems.filter((r) => r.id !== id) }));
    },
    [patch]
  );

  const addNotification = useCallback(
    (clientId: string, input: NotificationInput): Notification => {
      const n: Notification = {
        id: uid("n"),
        clientId,
        timestamp: new Date().toISOString(),
        read: input.read ?? false,
        ...input,
      };
      patch((s) => ({ ...s, notifications: [n, ...s.notifications] }));
      return n;
    },
    [patch]
  );
  const updateNotification = useCallback(
    (id: string, input: Partial<NotificationInput>) => {
      patch((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, ...input } : n
        ),
      }));
    },
    [patch]
  );
  const deleteNotification = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }));
    },
    [patch]
  );
  const markNotificationRead = useCallback(
    (id: string, read = true) => {
      patch((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read } : n
        ),
      }));
      void createClient().from("notifications").update({ read }).eq("id", id);
    },
    [patch]
  );

  const markNotificationsReadForUser = useCallback(
    (clientId: string, userId: string) => {
      // Cursor must be at/after every current notification timestamp so the badge
      // reliably clears (avoids ms clock skew leaving items "unread").
      const latestMs = filterClient(state.notifications, clientId).reduce(
        (max, n) => Math.max(max, new Date(n.timestamp).getTime() || 0),
        0
      );
      const lastReadAt = new Date(Math.max(Date.now(), latestMs)).toISOString();

      patch((s) => {
        const without = s.notificationReads.filter(
          (r) => !(r.clientId === clientId && r.userId === userId)
        );
        return {
          ...s,
          notificationReads: [
            ...without,
            { clientId, userId, lastReadAt },
          ],
        };
      });

      void createClient().from("notification_reads").upsert(
        {
          client_id: clientId,
          user_id: userId,
          last_read_at: lastReadAt,
        },
        { onConflict: "client_id,user_id" }
      );
    },
    [patch, state.notifications]
  );

  const upsertRealtimeNotification = useCallback(
    (notification: Notification) => {
      patch((s) => {
        const idx = s.notifications.findIndex((n) => n.id === notification.id);
        if (idx === -1) {
          return { ...s, notifications: [notification, ...s.notifications] };
        }
        const next = s.notifications.slice();
        next[idx] = notification;
        return { ...s, notifications: next };
      });
    },
    [patch]
  );

  const upsertRealtimeNotificationRead = useCallback(
    (read: NotificationRead) => {
      patch((s) => {
        const without = s.notificationReads.filter(
          (r) =>
            !(r.clientId === read.clientId && r.userId === read.userId)
        );
        return {
          ...s,
          notificationReads: [...without, read],
        };
      });
    },
    [patch]
  );

  const removeRealtimeNotification = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        notifications: s.notifications.filter((n) => n.id !== id),
      }));
    },
    [patch]
  );

  const upsertRealtimeDocument = useCallback(
    (document: Document) => {
      patch((s) => {
        const idx = s.documents.findIndex((d) => d.id === document.id);
        if (idx === -1) {
          return { ...s, documents: [document, ...s.documents] };
        }
        const next = s.documents.slice();
        next[idx] = document;
        return { ...s, documents: next };
      });
    },
    [patch]
  );

  const removeRealtimeDocument = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        documents: s.documents.filter((d) => d.id !== id),
      }));
    },
    [patch]
  );

  const resetToSeed = useCallback(() => {
    void refreshFromSupabase();
  }, [refreshFromSupabase]);

  const value = useMemo<PortalContextValue>(
    () => ({
      ...state,
      hydrated,
      loadingData,
      dataError,
      activeClient,
      setActiveClientId,
      getClient,
      getClientStats,
      getWorkItemsForClient,
      getServices,
      getActionItemsForClient,
      getProgressAreasForClient,
      getChangeRequestsForClient,
      getApprovalsForClient,
      getInvoicesForClient,
      getDocumentsForClient,
      getMessagesForClient,
      getUnreadMessageCount,
      markThreadRead,
      upsertRealtimeMessage,
      removeRealtimeMessage,
      getRoadmapForClient,
      getNotificationsForClient,
      getNotificationsForUser,
      getUnreadNotificationCount,
      getNotificationLastReadAt,
      getOverallProgress,
      addClient,
      updateClient,
      deleteClient,
      touchClientUpdated,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      addService,
      updateService,
      deleteService,
      addActionItem,
      updateActionItem,
      deleteActionItem,
      addProgressArea,
      updateProgressArea,
      deleteProgressArea,
      addChangeRequest,
      updateChangeRequest,
      deleteChangeRequest,
      submitChangeRequest,
      addApproval,
      updateApproval,
      deleteApproval,
      respondToApproval,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      markInvoicePaid,
      addDocument,
      updateDocument,
      deleteDocument,
      addMessage,
      updateMessage,
      deleteMessage,
      addRoadmapItem,
      updateRoadmapItem,
      deleteRoadmapItem,
      addNotification,
      updateNotification,
      deleteNotification,
      markNotificationRead,
      markNotificationsReadForUser,
      upsertRealtimeNotification,
      upsertRealtimeNotificationRead,
      removeRealtimeNotification,
      upsertRealtimeDocument,
      removeRealtimeDocument,
      refreshFromSupabase,
      resetToSeed,
    }),
    [
      state,
      hydrated,
      loadingData,
      dataError,
      activeClient,
      setActiveClientId,
      getClient,
      getClientStats,
      getWorkItemsForClient,
      getServices,
      getActionItemsForClient,
      getProgressAreasForClient,
      getChangeRequestsForClient,
      getApprovalsForClient,
      getInvoicesForClient,
      getDocumentsForClient,
      getMessagesForClient,
      getUnreadMessageCount,
      markThreadRead,
      upsertRealtimeMessage,
      removeRealtimeMessage,
      getRoadmapForClient,
      getNotificationsForClient,
      getNotificationsForUser,
      getUnreadNotificationCount,
      getNotificationLastReadAt,
      getOverallProgress,
      addClient,
      updateClient,
      deleteClient,
      touchClientUpdated,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      addService,
      updateService,
      deleteService,
      addActionItem,
      updateActionItem,
      deleteActionItem,
      addProgressArea,
      updateProgressArea,
      deleteProgressArea,
      addChangeRequest,
      updateChangeRequest,
      deleteChangeRequest,
      submitChangeRequest,
      addApproval,
      updateApproval,
      deleteApproval,
      respondToApproval,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      markInvoicePaid,
      addDocument,
      updateDocument,
      deleteDocument,
      addMessage,
      updateMessage,
      deleteMessage,
      addRoadmapItem,
      updateRoadmapItem,
      deleteRoadmapItem,
      addNotification,
      updateNotification,
      deleteNotification,
      markNotificationRead,
      markNotificationsReadForUser,
      upsertRealtimeNotification,
      upsertRealtimeNotificationRead,
      removeRealtimeNotification,
      upsertRealtimeDocument,
      removeRealtimeDocument,
      refreshFromSupabase,
      resetToSeed,
    ]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

export function useClientPortal() {
  const portal = usePortal();
  const clientId = portal.activeClientId;
  const client = portal.activeClient;

  return {
    ...portal,
    clientId,
    client,
    workItems: portal.getWorkItemsForClient(clientId),
    workStats: portal.getClientStats(clientId),
    services: portal.getServices(),
    actionItems: portal.getActionItemsForClient(clientId),
    progressAreas: portal.getProgressAreasForClient(clientId),
    changeRequests: portal.getChangeRequestsForClient(clientId),
    approvals: portal.getApprovalsForClient(clientId),
    invoices: portal.getInvoicesForClient(clientId),
    documents: portal.getDocumentsForClient(clientId),
    messages: portal.getMessagesForClient(clientId),
    roadmapItems: portal.getRoadmapForClient(clientId),
    notifications: portal.getNotificationsForClient(clientId),
    overallProgress: portal.getOverallProgress(clientId),
  };
}

export function useAdminClient(clientId: string) {
  const portal = usePortal();
  const client = portal.getClient(clientId);

  return {
    ...portal,
    clientId,
    client,
    stats: portal.getClientStats(clientId),
    workItems: portal.getWorkItemsForClient(clientId),
    services: portal.getServices(),
    actionItems: portal.getActionItemsForClient(clientId),
    progressAreas: portal.getProgressAreasForClient(clientId),
    changeRequests: portal.getChangeRequestsForClient(clientId),
    approvals: portal.getApprovalsForClient(clientId),
    invoices: portal.getInvoicesForClient(clientId),
    documents: portal.getDocumentsForClient(clientId),
    messages: portal.getMessagesForClient(clientId),
    roadmapItems: portal.getRoadmapForClient(clientId),
    notifications: portal.getNotificationsForClient(clientId),
  };
}
