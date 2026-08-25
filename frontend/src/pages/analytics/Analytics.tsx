
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  FolderKanban,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  type Workspace,
  type WorkspaceMember,
} from "../../services/workspace";

import {
  getWorkspaceAnalytics,
  type WorkspaceAnalytics,
} from "../../services/dashboard";

import {
  getWorkspaceWorkload,
  type MemberWorkload,
} from "../../services/workload";

/* ============================================================
   PROGRESS BAR
============================================================ */

function StatProgressBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-white/70">{label}</span>
        <span className="text-white/40">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  badgeText,
  badgeColor,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  badgeText?: string;
  badgeColor?: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/20 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} ${iconColor}`}>
          <Icon size={20} />
        </div>
        {badgeText && (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeColor || "bg-indigo-500/10 text-indigo-300 border border-indigo-400/20"}`}>
            {badgeText}
          </span>
        )}
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-white/40">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-white/35">
        {subtext}
      </p>
    </div>
  );
}

/* ============================================================
   ANALYTICS PAGE
============================================================ */

export default function Analytics() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [workload, setWorkload] = useState<MemberWorkload[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  /* Load Workspaces */
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        const data = await getMyWorkspaces();
        setWorkspaces(data);
        if (data.length > 0) {
          setSelectedWorkspace(data[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load workspaces for analytics.");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, []);

  /* Load Analytics and Workload */
  useEffect(() => {
    if (!selectedWorkspace) return;

    async function loadData() {
      try {
        setRefreshing(true);
        setError("");
        const [analyticsData, workloadData, memberList] = await Promise.all([
          getWorkspaceAnalytics(selectedWorkspace!.id),
          getWorkspaceWorkload(selectedWorkspace!.id).catch(() => []),
          getWorkspaceMembers(selectedWorkspace!.id).catch(() => []),
        ]);
        setAnalytics(analyticsData);
        setWorkload(workloadData);
        setMembers(memberList);
      } catch (err) {
        console.error(err);
        setError("Failed to load workspace analytics metrics.");
      } finally {
        setRefreshing(false);
      }
    }
    void loadData();
  }, [selectedWorkspace]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2 className="animate-spin text-indigo-300" size={24} />
          </div>
          <p className="text-sm text-white/40">Loading analytics intelligence...</p>
        </div>
      </div>
    );
  }

  const totalTasks = analytics?.total_tasks ?? 0;
  const completedTasks = analytics?.completed_tasks ?? 0;
  const overdueTasks = analytics?.overdue_tasks ?? 0;
  const inProgressTasks = analytics?.status.in_progress ?? 0;
  const completionRate = analytics?.completion_rate ?? 0;

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-8">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[10%] h-[450px] w-[450px] rounded-full bg-indigo-600/[0.08] blur-[150px]" />
        <div className="absolute right-[5%] top-[20%] h-[500px] w-[500px] rounded-full bg-cyan-600/[0.06] blur-[160px]" />
        <div className="absolute bottom-10 left-[30%] h-[400px] w-[400px] rounded-full bg-purple-600/[0.05] blur-[150px]" />
      </div>

      {/* HEADER */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
              <BarChart3 size={16} />
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-300/80">
              PERFORMANCE & INTELLIGENCE
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Workspace Analytics
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
            Real-time telemetry, productivity velocity, task breakdowns, and workload distributions.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedWorkspace) {
                const ws = selectedWorkspace;
                setSelectedWorkspace(null);
                setTimeout(() => setSelectedWorkspace(ws), 10);
              }
            }}
            disabled={refreshing}
            className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-white/70 shadow-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-indigo-400" : ""} />
            <span>Refresh</span>
          </button>

          {/* WORKSPACE SELECTOR */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen((v) => !v)}
              className="flex h-12 min-w-[220px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-left shadow-xl backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban size={16} className="text-indigo-300" />
                <span className="max-w-[130px] truncate text-sm font-medium text-white">
                  {selectedWorkspace?.name ?? "Select Workspace"}
                </span>
              </div>
              <ChevronDown size={15} className={`text-white/40 transition ${workspaceMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d18]/95 p-1 shadow-2xl backdrop-blur-2xl">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkspace(workspace);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selectedWorkspace?.id === workspace.id
                        ? "bg-indigo-500/10 text-indigo-200"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <FolderKanban size={15} />
                    <span className="truncate">{workspace.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BarChart3}
          label="Total Tasks"
          value={totalTasks}
          subtext="Managed in this workspace"
          badgeText="Active"
          iconColor="text-indigo-300"
          iconBg="bg-indigo-500/10 border border-indigo-400/20"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completion Velocity"
          value={`${completionRate}%`}
          subtext={`${completedTasks} of ${totalTasks} tasks finished`}
          badgeText={completionRate >= 80 ? "Optimal" : "Pacing"}
          badgeColor={completionRate >= 80 ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20" : undefined}
          iconColor="text-emerald-300"
          iconBg="bg-emerald-500/10 border border-emerald-400/20"
        />

        <MetricCard
          icon={Clock}
          label="In Progress"
          value={inProgressTasks}
          subtext="Currently undergoing execution"
          badgeText="Active Sprint"
          iconColor="text-cyan-300"
          iconBg="bg-cyan-500/10 border border-cyan-400/20"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Overdue Risk"
          value={overdueTasks}
          subtext={overdueTasks > 0 ? "Requires prompt resolution" : "No overdue items"}
          badgeText={overdueTasks > 0 ? "Alert" : "Clear"}
          badgeColor={overdueTasks > 0 ? "bg-rose-500/10 text-rose-300 border border-rose-400/20" : "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20"}
          iconColor={overdueTasks > 0 ? "text-rose-300" : "text-emerald-300"}
          iconBg={overdueTasks > 0 ? "bg-rose-500/10 border border-rose-400/20" : "bg-emerald-500/10 border border-emerald-400/20"}
        />
      </section>

      {/* DETAILED CHARTS & BREAKDOWNS */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* TASK STATUS DISTRIBUTION */}
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-xl shadow-black/10 backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Task Status Breakdown</h2>
              <p className="mt-1 text-xs text-white/35">Lifecycle distribution of tasks</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <Activity size={17} />
            </div>
          </div>

          <div className="space-y-4">
            <StatProgressBar
              label="To Do"
              count={analytics?.status.todo ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-slate-400 to-slate-300"
            />
            <StatProgressBar
              label="In Progress"
              count={analytics?.status.in_progress ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-cyan-500 to-blue-500"
            />
            <StatProgressBar
              label="In Review"
              count={analytics?.status.in_review ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-violet-500 to-purple-500"
            />
            <StatProgressBar
              label="Done"
              count={analytics?.status.done ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-emerald-500 to-teal-400"
            />
            <StatProgressBar
              label="Cancelled"
              count={analytics?.status.cancelled ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-rose-500 to-red-400"
            />
          </div>
        </div>

        {/* TASK PRIORITY BREAKDOWN */}
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-xl shadow-black/10 backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Priority Distribution</h2>
              <p className="mt-1 text-xs text-white/35">Urgency segmentation of backlog</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <Zap size={17} />
            </div>
          </div>

          <div className="space-y-4">
            <StatProgressBar
              label="Low"
              count={analytics?.priority.low ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-blue-500 to-cyan-400"
            />
            <StatProgressBar
              label="Medium"
              count={analytics?.priority.medium ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-amber-500 to-yellow-400"
            />
            <StatProgressBar
              label="High"
              count={analytics?.priority.high ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-orange-500 to-rose-400"
            />
            <StatProgressBar
              label="Urgent"
              count={analytics?.priority.urgent ?? 0}
              total={totalTasks}
              color="bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
            />
          </div>
        </div>
      </section>

      {/* TEAM PRODUCTIVITY & WORKLOAD MATRIX */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-xl shadow-black/10 backdrop-blur-2xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Team Workload Distribution</h2>
            <p className="mt-1 text-xs text-white/35">Active tasks and capacity across members</p>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-300" />
            <span className="text-xs font-medium text-white/50">{workload.length} Active Members</span>
          </div>
        </div>

        {workload.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <Users size={28} className="mx-auto text-white/20" />
            <p className="mt-3 text-sm text-white/40">No member workload data recorded yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workload.map((item) => {
              const matched = members.find((m) => m.user_id === item.user_id || m.id === item.user_id);
              const displayName = matched?.full_name || matched?.name || matched?.email || `User ${item.user_id.slice(0, 6)}`;
              const role = matched?.role || "Member";

              return (
                <div
                  key={item.user_id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-xs font-bold text-indigo-300 ring-1 ring-white/10">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-white/30 capitalize">
                        {role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
                    <div>
                      <p className="text-xs text-white/40">Total</p>
                      <p className="mt-0.5 text-base font-bold text-white">{item.total_tasks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-400/70">Done</p>
                      <p className="mt-0.5 text-base font-bold text-emerald-300">{item.completed_tasks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-400/70">Overdue</p>
                      <p className="mt-0.5 text-base font-bold text-rose-300">{item.overdue_tasks}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI INSIGHT SUMMARY */}
      <section className="relative overflow-hidden rounded-[28px] border border-indigo-400/20 bg-gradient-to-r from-indigo-500/[0.08] via-purple-500/[0.05] to-transparent p-7 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                AI Executive Health Assessment
              </span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-indigo-200">
                Live Analysis
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-white">
              {completionRate >= 80
                ? "Workspace is operating at peak productivity velocity."
                : completionRate >= 50
                ? "Workspace is maintaining steady progress with capacity for acceleration."
                : "Workspace backlog is accumulating — recommend sprint alignment."}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              {overdueTasks > 0
                ? `Attention required: ${overdueTasks} tasks are currently past due date. Prioritizing high-urgency items will recover velocity.`
                : "All scheduled milestones are on track. No critical blockers detected across current projects."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
