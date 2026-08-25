
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface MemberWorkload {
  user_id: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

/* ============================================================
   GET WORKLOAD
============================================================ */

export async function getWorkspaceWorkload(
  workspaceId: string,
): Promise<MemberWorkload[]> {
  const response = await api.get<MemberWorkload[]>(
    `/api/v1/workspaces/${workspaceId}/workload`,
  );
  return response.data;
}
