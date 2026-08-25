
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
  ExternalLink,
  Link as LinkIcon,
  Check,
  UserCheck,
} from "lucide-react";

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  getPendingInvitations,
  getMyPendingInvitations,
  acceptInvitation,
  revokeInvitation,
  removeWorkspaceMember,
  updateMemberRole,
  inviteToWorkspace,
  isWorkspaceOwner,
  type Workspace,
  type WorkspaceMember,
  type InvitationResponse,
  type MyPendingInvitation,
} from "../../services/workspace";


/* ============================================================
   JOIN WITH TOKEN MODAL
============================================================ */

function JoinWithTokenModal({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: () => void;
}) {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Please enter a valid invitation token.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await acceptInvitation(trimmed);
      onJoined();
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to join workspace. The token may be invalid or expired.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0c0d18] p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
              <UserCheck size={20} className="text-emerald-300" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Join Workspace</h2>
            <p className="mt-1.5 text-sm text-white/40">
              Enter your invitation token to join a workspace.
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

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Invitation Token
            </label>
            <textarea
              required
              rows={3}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your invitation token here..."
              disabled={saving}
              className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
            />
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
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-emerald-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  Join Workspace
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
  const [myPendingInvitations, setMyPendingInvitations] = useState<MyPendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [invitationResult, setInvitationResult] =
    useState<InvitationResponse | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);

  async function loadPending(wsId: string) {
    try {
      const [invs, myInvs] = await Promise.all([
        getPendingInvitations(wsId).catch(() => []),
        getMyPendingInvitations().catch(() => []),
      ]);
      setPendingInvitations(Array.isArray(invs) ? invs : []);
      setMyPendingInvitations(Array.isArray(myInvs) ? myInvs : []);
    } catch {
      setPendingInvitations([]);
      setMyPendingInvitations([]);
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

  async function refreshAll() {
    try {
      setLoading(true);
      const workspaces = await getMyWorkspaces();
      setAllWorkspaces(workspaces);
      if (workspaces && workspaces.length > 0) {
        const active = workspace ? workspaces.find((w) => w.id === workspace.id) || workspaces[0] : workspaces[0];
        await loadWorkspaceData(active);
      } else {
        setWorkspace(null);
        setMembers([]);
        await loadPending("");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        const [workspaces, myInvs] = await Promise.all([
          getMyWorkspaces(),
          getMyPendingInvitations().catch(() => []),
        ]);
        setAllWorkspaces(workspaces);
        setMyPendingInvitations(Array.isArray(myInvs) ? myInvs : []);

        if (!workspaces || workspaces.length === 0) {
          setWorkspace(null);
          setMembers([]);
          setLoading(false);
          return;
        }
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

  async function handleAcceptPending(inv: MyPendingInvitation) {
    try {
      setAcceptingToken(inv.token);
      await acceptInvitation(inv.token);
      setMyPendingInvitations((prev) => prev.filter((i) => i.token !== inv.token));
      await refreshAll();
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    } finally {
      setAcceptingToken(null);
    }
  }

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

  async function handleRoleChange(member: WorkspaceMember, newRole: "admin" | "member") {
    const targetUserId = member.user_id || member.id;
    if (!workspace || !targetUserId || isWorkspaceOwner(member.role)) return;

    try {
      await updateMemberRole(workspace.id, targetUserId, newRole);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id || m.user_id === targetUserId ? { ...m, role: newRole } : m
        )
      );
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  }


  function handleCopyToken(inv: InvitationResponse | MyPendingInvitation) {
    void navigator.clipboard.writeText(inv.token).then(() => {
      setCopiedTokenId(inv.id);
      setTimeout(() => setCopiedTokenId(null), 2000);
    });
  }

  function handleCopyLink(inv: InvitationResponse | MyPendingInvitation) {
    const link = `${window.location.origin}/invite/${inv.token}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedLinkId(inv.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  }

  if (loading && !workspace && myPendingInvitations.length === 0) {
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

  const isOwner = workspace ? isWorkspaceOwner(workspace.role) : false;
  const canInvite = workspace ? workspace.role === "owner" || workspace.role === "admin" : false;

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
                  View and manage members, send and accept invitations.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              >
                <UserCheck size={16} className="text-emerald-400" />
                <span>Join with Token</span>
              </button>

              {canInvite && (
                <>
                  {pendingInvitations.length > 0 && (
                    <span className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
                      {pendingInvitations.length} Outgoing Invite{pendingInvitations.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(true)}
                    className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
                  >
                    <Plus size={17} />
                    <span>Invite Member</span>
                  </button>
                </>
              )}
            </div>
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
                      ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 font-semibold"
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

        {/* ============================================================
            RECEIVED INVITATIONS CARD (1-click Accept for the current user)
        ============================================================ */}
        {myPendingInvitations.length > 0 && (
          <section className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/[0.06] p-6 backdrop-blur-2xl shadow-xl shadow-emerald-500/5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Mail size={16} />
                </div>
                <h2 className="text-base font-semibold text-emerald-200">
                  Invitations Received by You ({myPendingInvitations.length})
                </h2>
              </div>
              <span className="text-xs text-emerald-300/70 font-medium">
                Click Accept to join the workspace immediately
              </span>
            </div>

            <div className="space-y-3">
              {myPendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-[#0c0d18]/80 p-5 sm:flex-row sm:items-center sm:justify-between shadow-lg"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {inv.workspace_name}
                      </span>
                      <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                        Invited by {inv.inviter_name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/40 font-mono truncate">
                      Token: {inv.token}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyToken(inv)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      {copiedTokenId === inv.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Token</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/invite/${inv.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      <ExternalLink size={13} />
                      <span>Open Page</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => void handleAcceptPending(inv)}
                      disabled={acceptingToken === inv.token}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] disabled:opacity-50"
                    >
                      {acceptingToken === inv.token ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Accept & Join</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WORKSPACE INFO CARD */}
        {workspace && (
          <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/30">
                  Workspace
                </p>
                <h2 className="mt-2 text-xl font-semibold">{workspace.name}</h2>
                <p className="mt-1 text-xs text-white/30">/{workspace.slug}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
                  {isOwner ? (
                    <>
                      <Crown size={16} className="text-amber-300" />
                      <span className="text-sm text-amber-200 font-semibold">Owner</span>
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

                <a
                  href="/settings"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                >
                  <span>Workspace Settings & Delete</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </section>
        )}


        {/* PENDING INVITATIONS CARD (Outgoing Invites) */}
        {canInvite && pendingInvitations.length > 0 && (
          <section className="rounded-[28px] border border-indigo-400/20 bg-indigo-500/[0.04] p-6 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-indigo-300" />
                <h2 className="text-base font-semibold text-indigo-200">
                  Outgoing Pending Invitations ({pendingInvitations.length})
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

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(inv)}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/20 transition"
                    >
                      {copiedLinkId === inv.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon size={13} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyToken(inv)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      {copiedTokenId === inv.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span>Token Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Token</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/invite/${inv.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      <ExternalLink size={13} />
                      <span>Open Page</span>
                    </a>

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
        {workspace && (
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

                        {memberIsOwner ? (
                          <span className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-1.5 text-xs font-semibold capitalize text-amber-200">
                            Owner
                          </span>
                        ) : isOwner ? (
                          <select
                            value={member.role || "member"}
                            onChange={(e) => void handleRoleChange(member, e.target.value as "admin" | "member")}
                            className="rounded-lg border border-indigo-400/20 bg-black/40 px-2.5 py-1 text-xs capitalize text-indigo-200 outline-none hover:border-indigo-400/40 cursor-pointer"
                          >
                            <option value="member" className="bg-[#0c0d18] text-white">Member</option>
                            <option value="admin" className="bg-[#0c0d18] text-white">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${
                              member.role === "admin"
                                ? "border-indigo-400/20 bg-indigo-400/[0.05] text-indigo-200"
                                : "border-white/10 bg-white/[0.04] text-white/60"
                            }`}
                          >
                            {member.role || "member"}
                          </span>
                        )}


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
        )}

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

      {/* JOIN WITH TOKEN MODAL */}
      {joinModalOpen && (
        <JoinWithTokenModal
          onClose={() => setJoinModalOpen(false)}
          onJoined={() => {
            setJoinModalOpen(false);
            void refreshAll();
          }}
        />
      )}

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