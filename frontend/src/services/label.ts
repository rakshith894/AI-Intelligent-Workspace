
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
}

export interface LabelCreate {
  name: string;
  color?: string;
}

export interface TaskLabelResponse {
  task_id: string;
  label_id: string;
}


/* ============================================================
   CREATE LABEL
============================================================ */

export async function createLabel(
  workspaceId: string,
  data: LabelCreate,
): Promise<Label> {
  const response = await api.post<Label>(
    `/api/v1/workspaces/${workspaceId}/labels`,
    data,
  );

  return response.data;
}


/* ============================================================
   GET WORKSPACE LABELS
============================================================ */

export async function getLabels(
  workspaceId: string,
): Promise<Label[]> {
  const response = await api.get<Label[]>(
    `/api/v1/workspaces/${workspaceId}/labels`,
  );

  return response.data;
}


/* ============================================================
   DELETE WORKSPACE LABEL
============================================================ */

export async function deleteLabel(
  workspaceId: string,
  labelId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/labels/${labelId}`,
  );
}


/* ============================================================
   ATTACH LABEL TO TASK
============================================================ */

export async function attachLabel(
  workspaceId: string,
  projectId: string,
  taskId: string,
  labelId: string,
): Promise<TaskLabelResponse> {
  const response = await api.post<TaskLabelResponse>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/labels/${labelId}`,
  );

  return response.data;
}


/* ============================================================
   REMOVE LABEL FROM TASK
============================================================ */

export async function removeLabel(
  workspaceId: string,
  projectId: string,
  taskId: string,
  labelId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/labels/${labelId}`,
  );
}
