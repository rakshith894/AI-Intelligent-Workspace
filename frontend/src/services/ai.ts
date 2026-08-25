import { api } from "./api";

export interface SubtaskSuggestion {
  title: string;
  estimated_hours: number;
}

export interface TaskBreakdownResponse {
  suggested_description: string;
  suggested_priority: string;
  suggested_tags: string[];
  subtasks: SubtaskSuggestion[];
}

export interface SprintAnalysisResponse {
  health_score: number;
  health_status: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  predicted_blockers: string[];
  recommendations: string[];
}

export interface DailyStandupResponse {
  generated_at: string;
  workspace_name: string;
  completed_recent: string[];
  in_progress_today: string[];
  blockers_and_risks: string[];
  summary_markdown: string;
}

export interface AutoAssignResponse {
  recommended_user_id: string | null;
  recommended_name: string | null;
  current_active_tasks: number;
  reason: string;
}

export interface KnowledgeSearchResponse {
  results: {
    type: "project" | "task" | "document";
    id: string;
    title: string;
    snippet: string;
  }[];
  answer: string;
}

export interface ExternalAIChatRequest {
  prompt: string;
  provider?: string;
  api_key?: string;
  model?: string;
  endpoint?: string;
  history?: { role: string; content: string }[];
  file_name?: string;
  file_type?: string;
  file_data?: string;
}

export interface ExternalAIChatResponse {
  reply: string;
  model_used: string;
  provider: string;
  suggested_action?: {
    label: string;
    path: string;
  };
}

/* ============================================================
   AI API METHODS
============================================================ */

export async function chatAI(
  workspaceId: string,
  data: ExternalAIChatRequest,
): Promise<ExternalAIChatResponse> {
  const response = await api.post<ExternalAIChatResponse>(
    `/api/v1/workspaces/${workspaceId}/ai/chat`,
    data,
  );
  return response.data;
}

export async function getAITaskBreakdown(
  workspaceId: string,
  title: string,
  description?: string,
  priority?: string,
): Promise<TaskBreakdownResponse> {
  const response = await api.post<TaskBreakdownResponse>(
    `/api/v1/workspaces/${workspaceId}/ai/task-breakdown`,
    { title, description, priority },
  );
  return response.data;
}

export async function getAISprintAnalysis(
  workspaceId: string,
): Promise<SprintAnalysisResponse> {
  const response = await api.get<SprintAnalysisResponse>(
    `/api/v1/workspaces/${workspaceId}/ai/sprint-analysis`,
  );
  return response.data;
}

export async function getAIDailyStandup(
  workspaceId: string,
): Promise<DailyStandupResponse> {
  const response = await api.get<DailyStandupResponse>(
    `/api/v1/workspaces/${workspaceId}/ai/daily-standup`,
  );
  return response.data;
}

export async function getAIAutoAssign(
  workspaceId: string,
  taskTitle: string,
  taskPriority: string = "medium",
): Promise<AutoAssignResponse> {
  const response = await api.post<AutoAssignResponse>(
    `/api/v1/workspaces/${workspaceId}/ai/auto-assign`,
    { task_title: taskTitle, task_priority: taskPriority },
  );
  return response.data;
}

export async function searchAIKnowledge(
  workspaceId: string,
  query: string,
): Promise<KnowledgeSearchResponse> {
  const response = await api.post<KnowledgeSearchResponse>(
    `/api/v1/workspaces/${workspaceId}/ai/knowledge-search`,
    { query },
  );
  return response.data;
}
