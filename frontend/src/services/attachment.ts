import { api } from "./api";

export interface Attachment {
  id: string;
  workspace_id: string;
  project_id: string;
  task_id?: string | null;
  filename: string;
  file_size: number;
  content_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface AttachmentListResponse {
  items: Attachment[];
  total: number;
}

export interface ProjectImportResponse {
  project_id: string;
  name: string;
  project_url?: string | null;
  imported_tasks_count: number;
  imported_files_count: number;
  message: string;
}

/* ============================================================
   ATTACHMENT API METHODS
============================================================ */

export async function uploadAttachment(
  workspaceId: string,
  projectId: string,
  file: File,
  taskId?: string,
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  if (taskId) {
    formData.append("task_id", taskId);
  }

  const response = await api.post<Attachment>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function getProjectAttachments(
  workspaceId: string,
  projectId: string,
  taskId?: string,
): Promise<AttachmentListResponse> {
  const params = taskId ? { task_id: taskId } : {};
  const response = await api.get<AttachmentListResponse>(
    `/api/v1/workspaces/${workspaceId}/projects/${projectId}/attachments`,
    { params },
  );
  return response.data;
}

export function getAttachmentDownloadUrl(
  workspaceId: string,
  attachmentId: string,
): string {
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  return `${baseUrl}/api/v1/workspaces/${workspaceId}/attachments/${attachmentId}/download`;
}

export async function deleteAttachment(
  workspaceId: string,
  attachmentId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/attachments/${attachmentId}`,
  );
}

export async function uploadProjectPackage(
  workspaceId: string,
  file: File,
  projectName?: string,
  projectUrl?: string,
): Promise<ProjectImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (projectName) {
    formData.append("project_name", projectName);
  }
  if (projectUrl) {
    formData.append("project_url", projectUrl);
  }

  const response = await api.post<ProjectImportResponse>(
    `/api/v1/workspaces/${workspaceId}/projects/upload-project`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export function getProjectExportJsonUrl(
  workspaceId: string,
  projectId: string,
): string {
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  return `${baseUrl}/api/v1/workspaces/${workspaceId}/projects/${projectId}/export-json`;
}

export function getProjectExportZipUrl(
  workspaceId: string,
  projectId: string,
): string {
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  return `${baseUrl}/api/v1/workspaces/${workspaceId}/projects/${projectId}/export-zip`;
}
