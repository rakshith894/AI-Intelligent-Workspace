
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

import {
  getMyWorkspaces,
  getWorkspaceMembers,
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
    indigo:
      "from-indigo-500 to-violet-400",
    emerald:
      "from-emerald-500 to-teal-400",
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
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${color}`}
    >
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
          getWorkspaceMembers(ws.id),
          getWorkspaceWorkload(ws.id),
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

  /* ============================================================
     HELPERS
  ============================================================ */

  function getMemberInfo(userId: string): WorkspaceMember | undefined {
    return members.find((m) => m.user_id === userId || m.id === userId);
  }

  function getDisplayName(member?: WorkspaceMember): string {
    if (!member) return "Unknown";
    return member.full_name || member.email || member.user_id || "User";
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2 size={24} className="animate-spin text-indigo-300" />
          </div>
          <p className="text-sm text-white/40">Loading team data...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-8">
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-violet-600/[0.07] blur-[140px]" />
        <div className="absolute bottom-[15%] right-[5%] h-[350px] w-[350px] rounded-full bg-indigo-600/[0.05] blur-[150px]" />
      </div>

      {/* HEADER */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
            <Sparkles size={15} className="text-indigo-300" />
          </div>
          <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
            TEAM INTELLIGENCE
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
              Team
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Monitor individual workloads and team productivity across your
              workspace.
            </p>
          </div>

          {workspace && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <Users size={16} className="text-indigo-300" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30">
                  Workspace
                </p>
                <p className="text-sm font-medium">{workspace.name}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* WORKLOAD GRID */}
      {workload.length === 0 && !error ? (
        <section className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10">
          <Users size={32} className="text-white/20" />
          <h3 className="mt-4 text-sm font-medium">No workload data</h3>
          <p className="mt-2 text-xs text-white/30">
            Workload data will appear once tasks are assigned to team members.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {workload.map((wl) => {
            const member = getMemberInfo(wl.user_id);
            const displayName = getDisplayName(member);
            const initial = displayName.charAt(0).toUpperCase();
            const rate = Math.round(wl.completion_rate);

            return (
              <div
                key={wl.user_id}
                className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                {/* Corner glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/[0.06] blur-3xl" />

                <div className="relative">
                  {/* MEMBER INFO */}
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-base font-bold text-indigo-200 ring-1 ring-white/10">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white/90">
                        {displayName}
                      </p>

                      {member?.email && displayName !== member.email && (
                        <p className="mt-0.5 truncate text-xs text-white/30">
                          {member.email}
                        </p>
                      )}

                      {member?.role && (
                        <span className="mt-1 inline-block rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] capitalize text-white/35">
                          {member.role}
                        </span>
                      )}
                    </div>

                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold">{rate}%</p>
                      <p className="text-[10px] text-white/30">completion</p>
                    </div>
                  </div>

                  {/* COMPLETION BAR */}
                  <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
                      <span>Overall progress</span>
                      <span>{wl.completed_tasks}/{wl.total_tasks}</span>
                    </div>
                    <MiniBar
                      value={wl.completed_tasks}
                      max={wl.total_tasks}
                      color="emerald"
                    />
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

      {/* SUMMARY FOOTER */}
      {workload.length > 0 && (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl">
          <h2 className="mb-5 text-base font-semibold">Team Summary</h2>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Members",
                value: workload.length,
                icon: <Users size={18} />,
                color: "text-indigo-300",
                bg: "border-indigo-400/20 bg-indigo-500/10",
              },
              {
                label: "Total Tasks",
                value: workload.reduce((s, w) => s + w.total_tasks, 0),
                icon: <Activity size={18} />,
                color: "text-white/60",
                bg: "border-white/10 bg-white/[0.04]",
              },
              {
                label: "Completed",
                value: workload.reduce((s, w) => s + w.completed_tasks, 0),
                icon: <CheckCircle2 size={18} />,
                color: "text-emerald-300",
                bg: "border-emerald-400/20 bg-emerald-500/[0.07]",
              },
              {
                label: "Overdue",
                value: workload.reduce((s, w) => s + w.overdue_tasks, 0),
                icon: <AlertTriangle size={18} />,
                color: "text-orange-300",
                bg: "border-orange-400/20 bg-orange-500/[0.07]",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-4 rounded-2xl border p-4 ${stat.bg}`}
              >
                <div className={`shrink-0 ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-xs text-white/40">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
