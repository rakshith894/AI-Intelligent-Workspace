
import { useEffect, useState, type FormEvent } from "react";
import {
  Copy,
  Crown,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  getPendingInvitations,
  revokeInvitation,
  removeWorkspaceMember,
  inviteToWorkspace,
  isWorkspaceOwner,
  type Workspace,
  type WorkspaceMember,
  type InvitationResponse,
} from "../../services/workspace";

/* ============================================================
   INVITE MODAL
============================================================ */

function InviteModal({
  workspaceId,
  onClose,
  onInvited,
}: {
  workspaceId: string;
  onClose: () => void;
  onInvited: (inv: InvitationResponse) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const inv = await inviteToWorkspace(workspaceId, trimmed, role);
      onInvited(inv);
    } catch (err) {
      console.error(err);
      const msg =
        (
          err as {
            response?: { data?: { detail?: string } };
          }
        )?.response?.data?.detail;
      setError(msg || "Failed to send invitation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0c0d18] p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
              <Mail size={20} className="text-indigo-300" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold">Invite Member</h2>
            <p className="mt-1.5 text-sm text-white/40">
              Send an invitation link to add someone to this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-white/30 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              disabled={saving}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={saving}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0c0d18] px-4 text-sm text-white outline-none transition focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   INVITE SUCCESS MODAL
============================================================ */

function InviteSuccessModal({
  invitation,
  onClose,
}: {
  invitation: InvitationResponse;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(invitation.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[28px] border border-emerald-400/20 bg-[#0c0d18] p-7 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
            <CheckCircle2 size={26} className="text-emerald-300" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold">Invitation sent!</h2>

          <p className="mt-2 text-sm text-white/40">
            An invitation was created for{" "}
            <span className="font-medium text-white/70">
              {invitation.email}
            </span>
            . Share the token below with them.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2 text-xs text-white/30">Invitation token</p>
            <p className="break-all font-mono text-xs text-indigo-300">
              {invitation.token}
            </p>
          </div>

          <p className="mt-3 text-xs text-white/25">
            Expires:{" "}
            {new Date(invitation.expires_at).toLocaleDateString()}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Copy size={15} />
              {copied ? "Copied!" : "Copy Token"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.01]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WORKSPACE MEMBERS PAGE
============================================================ */

export default function WorkspaceMembers() {
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitationResult, setInvitationResult] =
    useState<InvitationResponse | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  async function loadPending(wsId: string) {
    try {
      const invs = await getPendingInvitations(wsId);
      setPendingInvitations(Array.isArray(invs) ? invs : []);
    } catch {
      // quiet catch if user is not owner/admin
      setPendingInvitations([]);
    }
  }

  async function loadWorkspaceData(ws: Workspace) {
    try {
      setLoading(true);
      setError("");
      setWorkspace(ws);
      const [workspaceMembers] = await Promise.all([
        getWorkspaceMembers(ws.id),
        loadPending(ws.id),
      ]);
      setMembers(Array.isArray(workspaceMembers) ? workspaceMembers : []);
    } catch (err) {
      console.error("Failed to load workspace members:", err);
      const responseError = (
        err as { response?: { status?: number; data?: { detail?: string } } }
      )?.response;
      if (responseError?.status === 403) {
        setError("You do not have permission to view this workspace's members.");
      } else {
        setError(responseError?.data?.detail || "Unable to load workspace members.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        const workspaces = await getMyWorkspaces();
        setAllWorkspaces(workspaces);
        if (!workspaces || workspaces.length === 0) {
          setWorkspace(null);
          setMembers([]);
          setError("No workspace found.");
          setLoading(false);
          return;
        }
        // Default to the first workspace; workspace switcher lets user change
        await loadWorkspaceData(workspaces[0]);
      } catch (err) {
        console.error("Failed to load workspaces:", err);
        setError("Unable to load workspaces.");
        setLoading(false);
      }
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRevoke(invitationId: string) {
    if (!workspace || revokingId) return;
    try {
      setRevokingId(invitationId);
      await revokeInvitation(workspace.id, invitationId);
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      console.error("Failed to revoke invitation:", err);
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRemoveMember(member: WorkspaceMember) {
    const targetUserId = member.user_id || member.id;
    if (!workspace || !targetUserId || removingMemberId) return;
    if (isWorkspaceOwner(member.role)) return;

    try {
      setRemovingMemberId(targetUserId);
      await removeWorkspaceMember(workspace.id, targetUserId);
      setMembers((prev) => prev.filter((m) => m.id !== member.id && m.user_id !== targetUserId));
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setRemovingMemberId(null);
    }
  }

  function handleCopyToken(inv: InvitationResponse) {
    void navigator.clipboard.writeText(inv.token).then(() => {
      setCopiedTokenId(inv.id);
      setTimeout(() => setCopiedTokenId(null), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2 size={24} className="animate-spin text-indigo-300" />
          </div>
          <p className="text-sm text-white/40">Loading workspace members...</p>
        </div>
      </div>
    );
  }

  if (!workspace && error) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center">
          <Users size={28} className="mx-auto text-white/20" />
          <h2 className="mt-4 text-lg font-semibold">No workspace found</h2>
          <p className="mt-2 text-sm text-white/30">
            Create a workspace before managing members.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = isWorkspaceOwner(workspace.role);
  const canInvite =
    workspace.role === "owner" || workspace.role === "admin";

  return (
    <>
      <div className="relative mx-auto max-w-[1500px] space-y-8">
        {/* AMBIENT GLOW */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[20%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
          <div className="absolute bottom-[15%] right-[5%] h-[350px] w-[350px] rounded-full bg-violet-600/[0.05] blur-[150px]" />
        </div>

        {/* HEADER */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
              <Sparkles size={15} className="text-indigo-300" />
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
              TEAM MANAGEMENT
            </span>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                <Users size={22} className="text-indigo-300" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Workspace Members
                </h1>
                <p className="mt-1 text-sm text-white/40">
                  View and manage members in this workspace.
                </p>
              </div>
            </div>

            {/* INVITE BUTTON & BADGE — only for owner/admin */}
            {canInvite && (
              <div className="flex items-center gap-3">
                {pendingInvitations.length > 0 && (
                  <span className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
                    {pendingInvitations.length} Pending Invite{pendingInvitations.length > 1 ? "s" : ""}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(true)}
                  className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
                >
                  <Plus size={17} />
                  Invite Member
                </button>
              </div>
            )}
          </div>

          {/* WORKSPACE SWITCHER — shown when user belongs to multiple workspaces */}
          {allWorkspaces.length > 1 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/30 font-medium mr-1">Switch workspace:</span>
              {allWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => void loadWorkspaceData(ws)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    workspace?.id === ws.id
                      ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                      : "bg-white/[0.04] text-white/50 border border-white/10 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {ws.name}
                  <span className="ml-1.5 opacity-50 capitalize">({ws.role})</span>
                </button>
              ))}
            </div>
          )}
        </section>


        {/* WORKSPACE INFO CARD */}
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/30">
                Workspace
              </p>
              <h2 className="mt-2 text-xl font-semibold">{workspace.name}</h2>
              <p className="mt-1 text-xs text-white/30">/{workspace.slug}</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
              {isOwner ? (
                <>
                  <Crown size={16} className="text-amber-300" />
                  <span className="text-sm text-amber-200">Owner</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="text-indigo-300" />
                  <span className="text-sm capitalize text-white/60">
                    {workspace.role || "Member"}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* PENDING INVITATIONS CARD (visible when pending invites exist) */}
        {canInvite && pendingInvitations.length > 0 && (
          <section className="rounded-[28px] border border-indigo-400/20 bg-indigo-500/[0.04] p-6 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-indigo-300" />
                <h2 className="text-base font-semibold text-indigo-200">
                  Pending Invitations ({pendingInvitations.length})
                </h2>
              </div>
              <span className="text-xs text-white/40">
                Awaiting acceptance by invited members
              </span>
            </div>

            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {inv.email}
                    </p>
                    <p className="mt-1 text-xs text-white/35 font-mono truncate">
                      Token: {inv.token}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyToken(inv)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      <Copy size={13} />
                      <span>{copiedTokenId === inv.id ? "Copied!" : "Copy Token"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revokingId === inv.id}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
                    >
                      {revokingId === inv.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <X size={13} />
                      )}
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* MEMBERS LIST */}
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Members</h2>
              <p className="mt-1 text-sm text-white/30">
                {members.length} member{members.length === 1 ? "" : "s"} in
                this workspace.
              </p>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                <Users size={24} className="text-white/20" />
              </div>

              <h3 className="mt-4 text-sm font-medium">No members found</h3>

              <p className="mt-2 text-xs text-white/30">
                {canInvite
                  ? "Invite members to get started."
                  : "No members are currently available."}
              </p>

              {canInvite && (
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <Plus size={14} />
                  Invite First Member
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const memberIsOwner = isWorkspaceOwner(member.role);
                const displayName =
                  member.full_name ||
                  member.name ||
                  member.email ||
                  member.user_id ||
                  "User";
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/[0.13] hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-sm font-semibold text-indigo-200 ring-1 ring-white/10">
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/90">
                          {displayName}
                        </p>

                        {member.email && displayName !== member.email && (
                          <p className="mt-0.5 truncate text-xs text-white/30">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {memberIsOwner && (
                        <Crown size={15} className="text-amber-300" />
                      )}

                      <span
                        className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${
                          memberIsOwner
                            ? "border-amber-400/20 bg-amber-400/[0.05] text-amber-200"
                            : member.role === "admin"
                              ? "border-indigo-400/20 bg-indigo-400/[0.05] text-indigo-200"
                              : "border-white/10 bg-white/[0.04] text-white/60"
                        }`}
                      >
                        {member.role || "member"}
                      </span>

                      {canInvite && !memberIsOwner && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveMember(member)}
                          disabled={removingMemberId === (member.user_id || member.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          {removingMemberId === (member.user_id || member.id) ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* OWNER SECTION */}
        {isOwner && (
          <section className="rounded-[28px] border border-indigo-400/10 bg-indigo-500/[0.04] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
                <ShieldCheck size={19} className="text-indigo-300" />
              </div>

              <div>
                <h3 className="text-sm font-semibold">Owner access</h3>
                <p className="mt-1 text-xs leading-5 text-white/35">
                  You are the owner of this workspace. You can invite members,
                  manage roles, and control workspace settings.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* INVITE MODAL */}
      {inviteModalOpen && workspace && (
        <InviteModal
          workspaceId={workspace.id}
          onClose={() => setInviteModalOpen(false)}
          onInvited={(inv) => {
            setInviteModalOpen(false);
            setInvitationResult(inv);
            void loadPending(workspace.id);
          }}
        />
      )}

      {/* SUCCESS MODAL */}
      {invitationResult && (
        <InviteSuccessModal
          invitation={invitationResult}
          onClose={() => setInvitationResult(null)}
        />
      )}
    </>
  );
}