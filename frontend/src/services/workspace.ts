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

export async function updateWorkspace(
  workspaceId: string,
  name: string,
): Promise<Workspace> {
  const response = await api.patch<Workspace>(
    `/api/v1/workspaces/${workspaceId}`,
    { name },
  );
  return response.data;
}

export async function deleteWorkspace(
  workspaceId: string,
): Promise<void> {
  await api.delete(`/api/v1/workspaces/${workspaceId}`);
}

export async function leaveWorkspace(
  workspaceId: string,
): Promise<void> {
  await api.post(`/api/v1/workspaces/${workspaceId}/leave`);
}

export interface WorkspaceExportData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    created_at: string | null;
  };
  members: Array<{
    user_id: string;
    full_name: string | null;
    email: string;
    role: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    project_name: string;
    assignee: string;
  }>;
}

export async function exportWorkspaceData(
  workspaceId: string,
): Promise<WorkspaceExportData> {
  const response = await api.get<WorkspaceExportData>(
    `/api/v1/workspaces/${workspaceId}/export`,
  );
  return response.data;
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

export async function removeWorkspaceMember(
  workspaceId: string,
  targetUserId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/members/${targetUserId}`,
  );
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  role: "admin" | "member",
): Promise<{ message: string; role: string }> {
  const response = await api.patch<{ message: string; role: string }>(
    `/api/v1/workspaces/${workspaceId}/members/${targetUserId}/role`,
    { role },
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
   GET PENDING INVITATIONS
============================================================ */

export async function getPendingInvitations(
  workspaceId: string,
): Promise<InvitationResponse[]> {
  const response = await api.get<InvitationResponse[]>(
    `/api/v1/workspaces/${workspaceId}/invitations`,
  );

  return response.data;
}

/* ============================================================
   REVOKE INVITATION
============================================================ */

export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  await api.delete(
    `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`,
  );
}

/* ============================================================
   ACCEPT INVITATION
============================================================ */

export interface AcceptInvitationResponse {
  message: string;
  workspace_id: string;
  role: string;
}

export interface MyPendingInvitation {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  inviter_name: string;
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface InvitationDetails {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  inviter_name: string;
  email: string;
  is_expired: boolean;
  is_accepted: boolean;
  expires_at: string;
}

export async function getMyPendingInvitations(): Promise<MyPendingInvitation[]> {
  const response = await api.get<MyPendingInvitation[]>(
    "/api/v1/invitations/my-pending",
  );
  return response.data;
}

export async function getInvitationDetails(
  token: string,
): Promise<InvitationDetails> {
  const response = await api.get<InvitationDetails>(
    `/api/v1/invitations/${token}/details`,
  );
  return response.data;
}

export async function acceptInvitation(
  token: string,
): Promise<AcceptInvitationResponse> {
  const response = await api.post<AcceptInvitationResponse>(
    `/api/v1/invitations/${token}/accept`,
  );

  return response.data;
}

