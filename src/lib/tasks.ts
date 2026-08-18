import type { Service, TaskStatus, WorkItem } from "@/types";
import type { TaskRow } from "@/lib/supabase/data";

/** Inclusive days: 14→14 = 1, 14→15 = 2. Returns null if either date missing or end < start. */
export function taskInclusiveDays(
  start?: string | null,
  end?: string | null
): number | undefined {
  if (!start || !end) return undefined;
  const s = Date.parse(`${start}T00:00:00`);
  const e = Date.parse(`${end}T00:00:00`);
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return undefined;
  return Math.floor((e - s) / 86_400_000) + 1;
}

export function taskToWorkItem(
  task: TaskRow,
  serviceName?: string
): WorkItem {
  const days =
    task.days ??
    taskInclusiveDays(task.timelineStart, task.timelineEnd);
  return {
    id: task.id,
    clientId: task.clientId,
    serviceId: task.serviceId,
    serviceName: serviceName || task.serviceName || "Service",
    parentId: task.parentId,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    createdBy: task.createdBy,
    createdByUserId: task.createdByUserId,
    createdByEmail: task.createdByEmail,
    timelineStart: task.timelineStart,
    timelineEnd: task.timelineEnd,
    days,
    deliverableUrl: task.deliverableUrl,
    deliverableLabel: task.deliverableLabel,
    deliveredItems: task.deliveredItems,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function workItemToTaskInsert(
  item: WorkItem,
  createdBy: "client" | "vitespace" = "vitespace"
) {
  return {
    id: item.id,
    client_id: item.clientId,
    service_id: item.serviceId,
    parent_id: item.parentId ?? null,
    title: item.title,
    description: item.description ?? null,
    status: item.status,
    created_by: createdBy,
    created_by_user_id: item.createdByUserId ?? null,
    created_by_email: item.createdByEmail ?? null,
    timeline_start: item.timelineStart || null,
    timeline_end: item.timelineEnd || null,
    deliverable_url: item.deliverableUrl ?? null,
    deliverable_label: item.deliverableLabel ?? null,
    delivered_items: item.deliveredItems?.length ? item.deliveredItems : [],
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function mapService(row: Record<string, unknown>): Service {
  return {
    id: String(row.id),
    name: String(row.name),
    createdAt: String(row.created_at ?? ""),
  };
}
