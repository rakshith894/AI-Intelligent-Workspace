import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;

  // These may be returned by your backend.
  email?: string;
  name?: string;
}


/* ============================================================
   GET WORKSPACE MEMBERS
============================================================ */

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const response = await api.get<WorkspaceMember[]>(
    `/api/v1/workspaces/${workspaceId}/members`,
  );

  return response.data;
}


/* ============================================================
   CHECK OWNER ACCESS
============================================================ */

export function isWorkspaceOwner(
  role: string | null | undefined,
): boolean {
  return role?.toLowerCase() === "owner";
}