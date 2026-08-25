import { api } from "./api";

/* ============================================================
   WORKSPACE
============================================================ */

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  role: string;
}

export interface WorkspaceCreate {
  name: string;
}

/* ============================================================
   WORKSPACE MEMBER
============================================================ */

export interface WorkspaceMember {
  id: string;
  email: string;
  role: string;
  workspace_id?: string;
  user_id?: string;
  name?: string;
  full_name?: string;
}

export interface InvitationResponse {
  id: string;
  workspace_id: string;
  email: string;
  token: string;
  expires_at: string;
}

/* ============================================================
   OWNER CHECK
============================================================ */

export function isWorkspaceOwner(
  role?: string | null,
): boolean {
  if (!role) {
    return false;
  }

  return role.toLowerCase() === "owner";
}

/* ============================================================
   GET MY WORKSPACES
============================================================ */

export async function getMyWorkspaces(): Promise<Workspace[]> {
  const response = await api.get<Workspace[]>(
    "/api/v1/users/me/workspaces",
  );

  return response.data;
}

/* ============================================================
   CREATE WORKSPACE
============================================================ */

export async function createWorkspace(
  data: WorkspaceCreate,
): Promise<Workspace> {
  const response = await api.post<{
    id: string;
    name: string;
    slug: string;
    owner_id: string;
  }>("/api/v1/workspaces", data);

  return {
    ...response.data,
    role: "owner",
  };
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
   INVITE MEMBER
============================================================ */

export async function inviteToWorkspace(
  workspaceId: string,
  email: string,
  role: string = "member",
): Promise<InvitationResponse> {
  const response = await api.post<InvitationResponse>(
    `/api/v1/workspaces/${workspaceId}/invitations`,
    { email, role },
  );

  return response.data;
}

/* ============================================================
   ACCEPT INVITATION
============================================================ */

export interface AcceptInvitationResponse {
  message: string;
  workspace_id: string;
  role: string;
}

export async function acceptInvitation(
  token: string,
): Promise<AcceptInvitationResponse> {
  const response = await api.post<AcceptInvitationResponse>(
    `/api/v1/invitations/${token}/accept`,
  );

  return response.data;
}
