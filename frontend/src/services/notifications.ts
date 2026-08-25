
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string | null;
  task_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  unread_count: number;
}

export interface UnreadNotificationCount {
  count: number;
}

export interface MarkAllReadResponse {
  updated_count: number;
}

/* ============================================================
   GET NOTIFICATIONS
============================================================ */

export async function getNotifications(params?: {
  filter?: "all" | "unread" | "read";
  page?: number;
  page_size?: number;
}): Promise<NotificationListResponse> {
  const response = await api.get<NotificationListResponse>(
    "/api/v1/notifications",
    { params },
  );
  return response.data;
}

/* ============================================================
   GET UNREAD COUNT
============================================================ */

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCount> {
  const response = await api.get<UnreadNotificationCount>(
    "/api/v1/notifications/unread-count",
  );
  return response.data;
}

/* ============================================================
   MARK ONE AS READ
============================================================ */

export async function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  const response = await api.patch<Notification>(
    `/api/v1/notifications/${notificationId}/read`,
  );
  return response.data;
}

/* ============================================================
   MARK ALL AS READ
============================================================ */

export async function markAllNotificationsAsRead(): Promise<MarkAllReadResponse> {
  const response = await api.patch<MarkAllReadResponse>(
    "/api/v1/notifications/read-all",
  );
  return response.data;
}

/* ============================================================
   DELETE NOTIFICATION
============================================================ */

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  await api.delete(`/api/v1/notifications/${notificationId}`);
}
