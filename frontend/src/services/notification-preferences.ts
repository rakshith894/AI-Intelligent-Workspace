
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface NotificationPreferences {
  task_assigned: boolean;
  status_changed: boolean;
  task_created: boolean;
  task_updated: boolean;
  mention: boolean;
  comment_added: boolean;
}

export interface NotificationPreferencesUpdate {
  task_assigned?: boolean;
  status_changed?: boolean;
  task_created?: boolean;
  task_updated?: boolean;
  mention?: boolean;
  comment_added?: boolean;
}

/* ============================================================
   GET PREFERENCES
============================================================ */

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<NotificationPreferences>(
    "/api/v1/notification-preferences",
  );
  return response.data;
}

/* ============================================================
   UPDATE PREFERENCES
============================================================ */

export async function updateNotificationPreferences(
  data: NotificationPreferencesUpdate,
): Promise<NotificationPreferences> {
  const response = await api.patch<NotificationPreferences>(
    "/api/v1/notification-preferences",
    data,
  );
  return response.data;
}
