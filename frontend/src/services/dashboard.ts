
import { api } from "./api";

export interface TaskStatusStats {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  cancelled: number;
}

export interface TaskPriorityStats {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export interface WorkspaceAnalytics {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  status: TaskStatusStats;
  priority: TaskPriorityStats;
}

export async function getWorkspaceAnalytics(
  workspaceId: string,
): Promise<WorkspaceAnalytics> {
  const response = await api.get<WorkspaceAnalytics>(
    `/api/v1/workspaces/${workspaceId}/analytics`,
  );

  return response.data;
}
