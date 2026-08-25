import { api } from "./api";

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  project_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  project_url?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  project_url?: string;
}

export async function getProjects(
  workspaceId: string,
): Promise<Project[]> {
  const response = await api.get<Project[]>(
    `/api/v1/workspaces/${workspaceId}/projects`,
  );

  return response.data;
}

export async function getProject(
  workspaceId: string,
  projectId: string,
): Promise<Project> {
  const response = await api.get<Project>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}`,
  );

  return response.data;
}

export async function createProject(
  workspaceId: string,
  data: ProjectCreate,
): Promise<Project> {
  const response = await api.post<Project>(
    `/api/v1/workspaces/${workspaceId}/projects`,
    data,
  );

  return response.data;
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  data: ProjectUpdate,
): Promise<Project> {
  const response = await api.patch<Project>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}`,
    data,
  );

  return response.data;
}

export async function deleteProject(
  workspaceId: string,
  projectId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}`,
  );
}