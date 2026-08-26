
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  project_id: string;
  workspace_id: string;

  title: string;
  description: string | null;

  status: string;
  priority: string;

  assignee_id: string | null;

  due_date: string | null;

  created_by: string;

  created_at: string;
  updated_at: string;

  labels: TaskLabel[];
}


/* ============================================================
   CREATE TASK
============================================================ */

export interface TaskCreate {
  title: string;

  description?: string | null;

  status?: string;

  priority?: string;

  assignee_id?: string | null;

  due_date?: string | null;

  label_ids?: string[] | null;
}


/* ============================================================
   UPDATE TASK
============================================================ */

export interface TaskUpdate {
  title?: string;

  description?: string | null;

  status?: string;

  priority?: string;

  assignee_id?: string | null;

  due_date?: string | null;

  label_ids?: string[] | null;
}


/* ============================================================
   TASK LIST RESPONSE
============================================================ */

export interface TaskListResponse {
  items: Task[];

  total: number;

  page: number;

  page_size: number;

  total_pages: number;
}


/* ============================================================
   TASK FILTERS
============================================================ */

export interface TaskQueryParams {
  search?: string;

  status?: string;

  priority?: string;

  assignee_id?: string;

  label_id?: string;

  sort_by?:
    | "created_at"
    | "updated_at"
    | "title"
    | "priority"
    | "due_date"
    | "status";

  sort_order?: "asc" | "desc";

  page?: number;

  page_size?: number;
}


/* ============================================================
   GET TASKS (PROJECT SCOPED)
============================================================ */

export async function getTasks(
  workspaceId: string,
  projectId: string,
  params?: TaskQueryParams,
): Promise<TaskListResponse> {
  const response = await api.get<TaskListResponse>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    {
      params,
    },
  );

  return response.data;
}


/* ============================================================
   GET ALL WORKSPACE TASKS (ALL PROJECTS)
============================================================ */

export async function getWorkspaceTasks(
  workspaceId: string,
  params?: TaskQueryParams & { project_id?: string },
): Promise<TaskListResponse> {
  const response = await api.get<TaskListResponse>(
    `/api/v1/workspaces/${workspaceId}/tasks`,
    {
      params,
    },
  );

  return response.data;
}


/* ============================================================
   GET SINGLE TASK
============================================================ */

export async function getTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
): Promise<Task> {
  const response = await api.get<Task>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
  );

  return response.data;
}


/* ============================================================
   CREATE TASK
============================================================ */

export async function createTask(
  workspaceId: string,
  projectId: string,
  data: TaskCreate,
): Promise<Task> {
  const response = await api.post<Task>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    data,
  );

  return response.data;
}


/* ============================================================
   UPDATE TASK
============================================================ */

export async function updateTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  data: TaskUpdate,
): Promise<Task> {
  const response = await api.patch<Task>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    data,
  );

  return response.data;
}


/* ============================================================
   DELETE TASK
============================================================ */

export async function deleteTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
  );
}