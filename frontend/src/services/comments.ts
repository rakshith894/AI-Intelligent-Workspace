
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface TaskComment {
  id: string;
  task_id: string;
  workspace_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}

/* ============================================================
   GET COMMENTS
============================================================ */

export async function getTaskComments(
  workspaceId: string,
  projectId: string,
  taskId: string,
): Promise<TaskComment[]> {
  const response = await api.get<TaskComment[]>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
  );
  return response.data;
}

/* ============================================================
   ADD COMMENT
============================================================ */

export async function addTaskComment(
  workspaceId: string,
  projectId: string,
  taskId: string,
  content: string,
): Promise<TaskComment> {
  const response = await api.post<TaskComment>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
    { content },
  );
  return response.data;
}

/* ============================================================
   GET TASK ACTIVITY LOGS
============================================================ */

export async function getTaskActivities(
  workspaceId: string,
  projectId: string,
  taskId: string,
): Promise<TaskActivity[]> {
  const response = await api.get<TaskActivity[]>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/activity`,
  );
  return response.data;
}
