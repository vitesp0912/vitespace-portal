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
  WorkItem,
  WorkItemStatus,
} from "@/types";
import { createClient } from "@/lib/supabase/client";
import { fetchPortalSnapshot } from "@/lib/supabase/data";

export interface PortalState {
  clients: Client[];
  workItems: WorkItem[];
  actionItems: ActionItem[];
  progressAreas: ProgressArea[];
  changeRequests: ChangeRequest[];
  approvals: Approval[];
  invoices: Invoice[];
  documents: Document[];
  messages: Message[];
  roadmapItems: RoadmapItem[];
  notifications: Notification[];
  activeClientId: string;
}

const EMPTY_STATE: PortalState = {
  clients: [],
  workItems: [],
  actionItems: [],
  progressAreas: [],
  changeRequests: [],
  approvals: [],
  invoices: [],
  documents: [],
  messages: [],
  roadmapItems: [],
  notifications: [],
  activeClientId: "",
};

function uid(prefix: string) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function isThisMonth(dateString?: string) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
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
}

export interface WorkItemInput {
  title: string;
  status: WorkItemStatus;
  project: string;
  description?: string;
  dueDate?: string;
  progress?: number;
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
  number: string;
  title: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  paidAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface DocumentInput {
  id?: string;
  name: string;
  category: Document["category"];
  size: string;
  project?: string;
  fileUrl?: string;
  description?: string;
  mimeType?: string;
  uploadedByUserId?: string;
  editedAt?: string;
}

export interface MessageInput {
  content: string;
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
  getActionItemsForClient: (clientId: string) => ActionItem[];
  getProgressAreasForClient: (clientId: string) => ProgressArea[];
  getChangeRequestsForClient: (clientId: string) => ChangeRequest[];
  getApprovalsForClient: (clientId: string) => Approval[];
  getInvoicesForClient: (clientId: string) => Invoice[];
  getDocumentsForClient: (clientId: string) => Document[];
  getMessagesForClient: (clientId: string) => Message[];
  getRoadmapForClient: (clientId: string) => RoadmapItem[];
  getNotificationsForClient: (clientId: string) => Notification[];
  getOverallProgress: (clientId: string) => number;
  addClient: (input: ClientInput) => Client;
  updateClient: (id: string, input: Partial<ClientInput>) => void;
  deleteClient: (id: string) => void;
  touchClientUpdated: (clientId: string) => void;
  addWorkItem: (clientId: string, input: WorkItemInput) => WorkItem;
  updateWorkItem: (id: string, input: Partial<WorkItemInput>) => void;
  deleteWorkItem: (id: string) => void;
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
  updateInvoice: (id: string, input: Partial<InvoiceInput>) => void;
  deleteInvoice: (id: string) => void;
  markInvoicePaid: (id: string, paidAt?: string) => void;
  addDocument: (clientId: string, input: DocumentInput) => Document;
  updateDocument: (
    id: string,
    input: Partial<DocumentInput>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteDocument: (id: string) => void;
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
  markAllNotificationsRead: (clientId: string) => void;
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
          invoices: snapshot.invoices,
          documents: snapshot.documents,
          messages: snapshot.messages,
          notifications: snapshot.notifications,
          // Legacy entities not in Supabase yet — keep empty (no hardcoded seed)
          workItems: [],
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

  const getClientStats = useCallback(
    (clientId: string) => {
      const items = filterClient(state.workItems, clientId);
      return {
        completed: items.filter((i) => i.status === "completed").length,
        inProgress: items.filter((i) => i.status === "in_progress").length,
        awaitingClient: items.filter((i) => i.status === "awaiting_client").length,
        upcoming: items.filter((i) => i.status === "upcoming").length,
        completedThisMonth: items.filter(
          (i) => i.status === "completed" && isThisMonth(i.completedAt)
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
    (input: ClientInput): Client => {
      const id = input.company.toLowerCase().replace(/\s+/g, "-").slice(0, 24);
      const client: Client = {
        id,
        ...input,
        lastUpdatedAt: new Date().toISOString(),
      };
      patch((s) => ({ ...s, clients: [...s.clients, client] }));
      void createClient()
        .from("clients")
        .upsert({
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
      return client;
    },
    [patch]
  );

  const updateClient = useCallback(
    (id: string, input: Partial<ClientInput>) => {
      const lastUpdatedAt = new Date().toISOString();
      patch((s) => ({
        ...s,
        clients: s.clients.map((c) =>
          c.id === id ? { ...c, ...input, lastUpdatedAt } : c
        ),
      }));
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
      void createClient().from("clients").update(row).eq("id", id);
    },
    [patch]
  );

  const deleteClient = useCallback(
    (id: string) => {
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
        roadmapItems: s.roadmapItems.filter((i) => i.clientId !== id),
        notifications: s.notifications.filter((i) => i.clientId !== id),
        activeClientId: s.activeClientId === id ? "" : s.activeClientId,
      }));
      void createClient().from("clients").delete().eq("id", id);
    },
    [patch]
  );

  const addWorkItem = useCallback(
    (clientId: string, input: WorkItemInput): WorkItem => {
      const ts = new Date().toISOString();
      const item: WorkItem = {
        id: uid("w"),
        clientId,
        title: input.title.trim(),
        status: input.status,
        project: input.project,
        description: input.description?.trim(),
        dueDate: input.dueDate,
        progress: input.progress,
        completedAt: input.status === "completed" ? ts.split("T")[0] : undefined,
        createdAt: ts,
        updatedAt: ts,
      };
      patch((s) => ({ ...s, workItems: [item, ...s.workItems] }));
      touchClientUpdated(clientId);
      return item;
    },
    [patch, touchClientUpdated]
  );

  const updateWorkItem = useCallback(
    (id: string, input: Partial<WorkItemInput>) => {
      patch((s) => ({
        ...s,
        workItems: s.workItems.map((item) => {
          if (item.id !== id) return item;
          const ts = new Date().toISOString();
          const status = input.status ?? item.status;
          return {
            ...item,
            ...input,
            title: input.title?.trim() ?? item.title,
            description: input.description?.trim() ?? item.description,
            updatedAt: ts,
            completedAt:
              status === "completed"
                ? item.completedAt ?? ts.split("T")[0]
                : undefined,
          };
        }),
      }));
    },
    [patch]
  );

  const deleteWorkItem = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, workItems: s.workItems.filter((i) => i.id !== id) }));
    },
    [patch]
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
    (clientId: string) =>
      filterClient(state.messages, clientId).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [state.messages]
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
      const inv: Invoice = { id: uid("inv"), clientId, ...input };
      patch((s) => ({ ...s, invoices: [inv, ...s.invoices] }));
      return inv;
    },
    [patch]
  );
  const updateInvoice = useCallback(
    (id: string, input: Partial<InvoiceInput>) => {
      patch((s) => ({
        ...s,
        invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...input } : i)),
      }));
      const row: Record<string, unknown> = {};
      if (input.number !== undefined) row.number = input.number;
      if (input.title !== undefined) row.title = input.title;
      if (input.amount !== undefined) row.amount = input.amount;
      if (input.issuedAt !== undefined) row.issued_at = input.issuedAt;
      if (input.dueAt !== undefined) row.due_at = input.dueAt;
      if (input.status !== undefined) row.status = input.status;
      if (input.fileUrl !== undefined) row.file_url = input.fileUrl;
      if (input.fileName !== undefined) row.file_name = input.fileName;
      if (input.fileSize !== undefined) row.file_size = input.fileSize;
      if (Object.keys(row).length) {
        void createClient().from("invoices").update(row).eq("id", id);
      }
    },
    [patch]
  );
  const deleteInvoice = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, invoices: s.invoices.filter((i) => i.id !== id) }));
      void createClient().from("invoices").delete().eq("id", id);
    },
    [patch]
  );
  const markInvoicePaid = useCallback(
    (id: string, paidAt?: string) => {
      updateInvoice(id, {
        status: "paid",
        paidAt: paidAt ?? new Date().toISOString().split("T")[0],
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
        project: input.project,
        fileUrl: input.fileUrl,
        description: input.description,
        mimeType: input.mimeType,
        uploadedByUserId: input.uploadedByUserId,
        editedAt: input.editedAt,
      };
      patch((s) => ({ ...s, documents: [doc, ...s.documents] }));
      return doc;
    },
    [patch]
  );
  const updateDocument = useCallback(
    async (
      id: string,
      input: Partial<DocumentInput>
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const editedAt =
        input.name !== undefined ? new Date().toISOString() : undefined;
      const row: Record<string, unknown> = {};
      if (input.name !== undefined) {
        row.name = input.name.trim();
        row.edited_at = editedAt;
      }
      if (input.description !== undefined) row.description = input.description;
      if (input.category !== undefined) row.category = input.category;
      if (input.size !== undefined) row.file_size = input.size;
      if (input.fileUrl !== undefined) row.file_url = input.fileUrl;

      if (Object.keys(row).length) {
        const { error } = await createClient()
          .from("documents")
          .update(row)
          .eq("id", id);
        if (error) return { ok: false, error: error.message };
      }

      patch((s) => ({
        ...s,
        documents: s.documents.map((d) =>
          d.id === id
            ? {
                ...d,
                ...input,
                name: input.name !== undefined ? input.name.trim() : d.name,
                editedAt: editedAt ?? d.editedAt,
              }
            : d
        ),
      }));
      return { ok: true };
    },
    [patch]
  );
  const deleteDocument = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, documents: s.documents.filter((d) => d.id !== id) }));
      void createClient().from("documents").delete().eq("id", id);
    },
    [patch]
  );

  const addMessage = useCallback(
    async (
      clientId: string,
      input: MessageInput,
      sender: "client" | "vitespace" = "vitespace"
    ): Promise<{ ok: true; message: Message } | { ok: false; error: string }> => {
      const client = state.clients.find((c) => c.id === clientId);
      const msg: Message = {
        id: uid("m"),
        clientId,
        sender,
        senderName: sender === "client" ? (client?.name ?? "Client") : "Vitespace",
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
  const markAllNotificationsRead = useCallback(
    (clientId: string) => {
      patch((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.clientId === clientId ? { ...n, read: true } : n
        ),
      }));
      void createClient()
        .from("notifications")
        .update({ read: true })
        .eq("client_id", clientId);
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
      getActionItemsForClient,
      getProgressAreasForClient,
      getChangeRequestsForClient,
      getApprovalsForClient,
      getInvoicesForClient,
      getDocumentsForClient,
      getMessagesForClient,
      getRoadmapForClient,
      getNotificationsForClient,
      getOverallProgress,
      addClient,
      updateClient,
      deleteClient,
      touchClientUpdated,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
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
      markAllNotificationsRead,
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
      getActionItemsForClient,
      getProgressAreasForClient,
      getChangeRequestsForClient,
      getApprovalsForClient,
      getInvoicesForClient,
      getDocumentsForClient,
      getMessagesForClient,
      getRoadmapForClient,
      getNotificationsForClient,
      getOverallProgress,
      addClient,
      updateClient,
      deleteClient,
      touchClientUpdated,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
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
      markAllNotificationsRead,
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
