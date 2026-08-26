import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  inviteToWorkspace,
  updateMemberRole,
  type Workspace,
  type WorkspaceMember,
} from "../../services/workspace";

import {
  getWorkspaceWorkload,
  type MemberWorkload,
} from "../../services/workload";

/* ============================================================
   PROGRESS BAR
============================================================ */

function MiniBar({
  value,
  max,
  color = "indigo",
}: {
  value: number;
  max: number;
  color?: "indigo" | "emerald" | "blue" | "red";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  const colors = {
    indigo: "from-indigo-500 to-violet-400",
    emerald: "from-emerald-500 to-teal-400",
    blue: "from-blue-500 to-cyan-400",
    red: "from-red-500 to-orange-400",
  };

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ============================================================
   STAT PILL
============================================================ */

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${color}`}>
      {icon}
      <div>
        <p className="text-[10px] leading-none opacity-60">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-none">{value}</p>
      </div>
    </div>
  );
}

/* ============================================================
   TEAM PAGE
============================================================ */

export default function TeamPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workload, setWorkload] = useState<MemberWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* INVITE MODAL */
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sendingInvite, setSendingInvite] = useState(false);

  /* GUIDE ACCORDION */
  const [showRoleGuide, setShowRoleGuide] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const workspaces = await getMyWorkspaces();
        if (workspaces.length === 0) {
          setError("No workspace found. Create a workspace first.");
          return;
        }

        const ws = workspaces[0];
        setWorkspace(ws);

        const [membersData, workloadData] = await Promise.all([
          getWorkspaceMembers(ws.id).catch(() => []),
          getWorkspaceWorkload(ws.id).catch(() => []),
        ]);

        setMembers(Array.isArray(membersData) ? membersData : []);
        setWorkload(Array.isArray(workloadData) ? workloadData : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load team data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  /* INVITE HANDLER */
  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !inviteEmail.trim()) return;

    try {
      setSendingInvite(true);
      setError("");
      setSuccessMsg("");
      await inviteToWorkspace(workspace.id, inviteEmail.trim(), inviteRole);
      setSuccessMsg(`Invitation dispatched to ${inviteEmail.trim()}`);
      setInviteEmail("");
      setInviteModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to send invitation. Member may already be in workspace.");
    } finally {
      setSendingInvite(false);
    }
  }

  /* ROLE UPDATE HANDLER */
  async function handleRoleChange(targetUserId: string, newRole: "admin" | "member") {
    if (!workspace) return;
    try {
      setError("");
      await updateMemberRole(workspace.id, targetUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === targetUserId || m.id === targetUserId ? { ...m, role: newRole } : m)),
      );
      setSuccessMsg("Member role updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Only workspace Owners or Admins can update member roles.");
    }
  }

  function getDisplayName(member?: WorkspaceMember): string {
    if (!member) return "Team Member";
    return member.full_name || member.email || member.user_id || "User";
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2 size={24} className="animate-spin text-indigo-300" />
          </div>
          <p className="text-sm text-white/40">Loading team intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-8 pb-12">
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-violet-600/[0.07] blur-[140px]" />
        <div className="absolute bottom-[15%] right-[5%] h-[350px] w-[350px] rounded-full bg-indigo-600/[0.05] blur-[150px]" />
      </div>

      {/* HEADER */}
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
              <Sparkles size={15} className="text-indigo-300" />
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
              TEAM INTELLIGENCE & ROLES
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Team Workspace Hub
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            Monitor member workloads, invite new contributors, and manage roles seamlessly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRoleGuide((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            <HelpCircle size={15} className="text-indigo-300" />
            <span>How Roles Work</span>
          </button>

          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-xs font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ROLE COLLABORATION GUIDE */}
      {showRoleGuide && (
        <section className="relative overflow-hidden rounded-[28px] border border-indigo-400/20 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-transparent p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-indigo-300">
              <ShieldCheck size={20} />
              <h3 className="text-base font-bold text-white">How Workspace Roles & Permissions Work</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowRoleGuide(false)}
              className="text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <ShieldAlert size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Owner / Admin</h4>
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Full control. Can create, edit, and delete workspace projects, configure settings, invite members, and assign roles.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-indigo-300">
                <UserCheck size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Member</h4>
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Active execution. Can view all workspace projects created by Admins, create tasks, update status/priority/subtasks, and post comments. Cannot edit or delete Admin projects.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-cyan-300">
                <Shield size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Viewer</h4>
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Read-only observer. Can browse workspace projects, view task boards, and monitor workload telemetry without edit rights.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* MEMBER DIRECTORY & WORKLOAD GRID */}
      {members.length === 0 && !error ? (
        <section className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10">
          <Users size={36} className="text-white/20" />
          <h3 className="mt-4 text-base font-semibold">No team members yet</h3>
          <p className="mt-2 text-xs text-white/40">
            Invite your team members using the "Invite Member" button above.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((mem) => {
            const wl = workload.find((w) => w.user_id === mem.user_id || w.user_id === mem.id) || {
              user_id: mem.user_id || mem.id,
              total_tasks: 0,
              completed_tasks: 0,
              in_progress_tasks: 0,
              overdue_tasks: 0,
              completion_rate: 0,
            };

            const displayName = getDisplayName(mem);
            const initial = displayName.charAt(0).toUpperCase();
            const rate = Math.round(wl.completion_rate);

            return (
              <div
                key={mem.id}
                className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/[0.06] blur-3xl" />

                <div className="relative">
                  {/* MEMBER INFO */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-base font-bold text-indigo-200 ring-1 ring-white/10">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white/90">{displayName}</p>
                        <p className="truncate text-xs text-white/40">{mem.email}</p>
                      </div>
                    </div>

                    {/* ROLE SELECTOR */}
                    <div className="shrink-0">
                      {mem.role === "owner" ? (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          <ShieldAlert size={11} />
                          Owner
                        </span>
                      ) : (
                        <select
                          value={mem.role || "member"}
                          onChange={(e) =>
                            handleRoleChange(
                              mem.user_id || mem.id,
                              e.target.value as "admin" | "member",
                            )
                          }
                          className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-indigo-300 outline-none transition focus:border-indigo-400/50"
                        >
                          <option value="member" className="bg-[#0c0d18] text-white">
                            Member
                          </option>
                          <option value="admin" className="bg-[#0c0d18] text-white">
                            Admin
                          </option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* COMPLETION BAR */}
                  <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
                      <span>Task Completion Rate</span>
                      <span className="font-semibold text-white/80">{rate}%</span>
                    </div>
                    <MiniBar value={wl.completed_tasks} max={wl.total_tasks} color="emerald" />
                  </div>

                  {/* STATS GRID */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatPill
                      icon={<Activity size={14} />}
                      label="Total"
                      value={wl.total_tasks}
                      color="border-white/[0.08] bg-white/[0.03] text-white/60"
                    />
                    <StatPill
                      icon={<CheckCircle2 size={14} />}
                      label="Done"
                      value={wl.completed_tasks}
                      color="border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
                    />
                    <StatPill
                      icon={<Clock size={14} />}
                      label="In Progress"
                      value={wl.in_progress_tasks}
                      color="border-blue-400/15 bg-blue-400/[0.06] text-blue-300"
                    />
                    <StatPill
                      icon={<AlertTriangle size={14} />}
                      label="Overdue"
                      value={wl.overdue_tasks}
                      color={
                        wl.overdue_tasks > 0
                          ? "border-red-400/20 bg-red-400/[0.07] text-red-300"
                          : "border-white/[0.08] bg-white/[0.03] text-white/40"
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* INVITE MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0c0d18] p-7 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                  <p className="text-xs text-white/40">Send an invitation link via email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">Member Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-xs text-white outline-none transition focus:border-indigo-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-xs text-white outline-none transition focus:border-indigo-400/50"
                >
                  <option value="member" className="bg-[#0c0d18]">
                    Member (Can view projects & manage tasks)
                  </option>
                  <option value="admin" className="bg-[#0c0d18]">
                    Admin (Full workspace control)
                  </option>
                  <option value="viewer" className="bg-[#0c0d18]">
                    Viewer (Read-only access)
                  </option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-xs font-medium transition hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-xs font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {sendingInvite ? "Sending..." : "Dispatch Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
