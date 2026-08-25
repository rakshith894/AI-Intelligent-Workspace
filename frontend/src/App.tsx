import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  FolderKanban,
  Loader2,
  Plus,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Users,
  UserPlus,
  Zap,
} from "lucide-react";

import AppLayout from "./layouts/AppLayout";

import Login from "./pages/auth/login";
import Register from "./pages/auth/Register";

import Projects from "./pages/projects/projects";
import ProjectDetails from "./pages/projects/project-details";
import Tasks from "./pages/tasks/tasks";
import WorkspaceMembers from "./pages/workspace/members";
import Team from "./pages/team/Team";
import Notifications from "./pages/notifications/Notifications";
import Settings from "./pages/settings/Settings";
import Analytics from "./pages/analytics/Analytics";
import AICopilot from "./pages/ai/AICopilot";
import AcceptInvitation from "./pages/invitations/AcceptInvitation";

import {
  createWorkspace,
  getMyWorkspaces,
  type Workspace,
} from "./services/workspace";

import {
  getWorkspaceAnalytics,
  type WorkspaceAnalytics,
} from "./services/dashboard";

/* ============================================================
   PROTECTED LAYOUT
============================================================ */

function ProtectedLayout() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

/* ============================================================
   CREATE WORKSPACE
============================================================ */

function CreateWorkspace({
  onCreated,
}: {
  onCreated: (workspace: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(
        "Workspace name must contain at least 2 characters.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const workspace = await createWorkspace({
        name: trimmedName,
      });

      onCreated(workspace);
    } catch (err) {
      console.error(err);

      const message =
        (
          err as {
            response?: {
              data?: {
                detail?: string;
              };
            };
          }
        )?.response?.data?.detail;

      setError(
        message ||
          "Unable to create workspace. Please make sure the backend is running and you are authenticated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-[15%] h-[400px] w-[400px] rounded-full bg-indigo-600/[0.08] blur-[140px]" />

        <div className="absolute bottom-[10%] right-[10%] h-[450px] w-[450px] rounded-full bg-violet-600/[0.06] blur-[160px]" />
      </div>

      <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.035] p-8 shadow-2xl backdrop-blur-2xl md:p-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            <FolderKanban
              size={28}
              className="text-indigo-300"
            />
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300/70">
              Intelligent Workspace
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Create your workspace
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/40">
              You don't have a workspace yet. Create one
              to start managing projects, tasks, analytics
              and your team.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-left text-sm text-red-300">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 text-left"
          >
            <div>
              <label
                htmlFor="workspace-name"
                className="mb-2 block text-sm font-medium text-white/70"
              >
                Workspace name
              </label>

              <input
                id="workspace-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Intelligent Workspace"
                minLength={2}
                maxLength={255}
                required
                disabled={saving}
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Creating workspace...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Workspace
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function Dashboard() {
  const [workspaces, setWorkspaces] =
    useState<Workspace[]>([]);

  const [selectedWorkspace, setSelectedWorkspace] =
    useState<Workspace | null>(null);

  const [analytics, setAnalytics] =
    useState<WorkspaceAnalytics | null>(null);

  const [loadingWorkspaces, setLoadingWorkspaces] =
    useState(true);

  const [loadingAnalytics, setLoadingAnalytics] =
    useState(false);

  const [error, setError] = useState("");

  const [workspaceMenuOpen, setWorkspaceMenuOpen] =
    useState(false);

  /* ==========================================================
     LOAD WORKSPACES
  ========================================================== */

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        setLoadingWorkspaces(true);
        setError("");

        const data = await getMyWorkspaces();

        setWorkspaces(data);

        if (data.length > 0) {
          setSelectedWorkspace(data[0]);
        } else {
          setSelectedWorkspace(null);
        }
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load your workspaces. Please make sure the backend is running and you are authenticated.",
        );
      } finally {
        setLoadingWorkspaces(false);
      }
    }

    loadWorkspaces();
  }, []);

  /* ==========================================================
     LOAD ANALYTICS
  ========================================================== */

  useEffect(() => {
    if (!selectedWorkspace) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalytics(null);
      return;
    }

    const workspaceId = selectedWorkspace.id;

    async function loadAnalytics() {
      try {
        setLoadingAnalytics(true);
        setError("");

        const data =
          await getWorkspaceAnalytics(workspaceId);

        setAnalytics(data);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load workspace analytics.",
        );
      } finally {
        setLoadingAnalytics(false);
      }
    }

    loadAnalytics();
  }, [selectedWorkspace]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loadingWorkspaces) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2
              className="animate-spin text-indigo-300"
              size={24}
            />
          </div>

          <p className="text-sm text-white/40">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     NO WORKSPACE
  ========================================================== */

  if (workspaces.length === 0) {
    return (
      <CreateWorkspace
        onCreated={(workspace) => {
          setWorkspaces([workspace]);
          setSelectedWorkspace(workspace);
        }}
      />
    );
  }

  const totalTasks =
    analytics?.total_tasks ?? 0;

  const completedTasks =
    analytics?.completed_tasks ?? 0;

  const overdueTasks =
    analytics?.overdue_tasks ?? 0;

  const completionRate =
    analytics?.completion_rate ?? 0;

  /* ==========================================================
     DASHBOARD
  ========================================================== */

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-8">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[15%] top-[8%] h-[420px] w-[420px] rounded-full bg-indigo-600/[0.08] blur-[140px]" />

        <div className="absolute right-[5%] top-[25%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.06] blur-[160px]" />

        <div className="absolute bottom-0 left-[35%] h-[400px] w-[400px] rounded-full bg-cyan-500/[0.04] blur-[150px]" />
      </div>

      {/* HEADER */}

      <section>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
                <Sparkles
                  size={15}
                  className="text-indigo-300"
                />
              </div>

              <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
                INTELLIGENT WORKSPACE
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-[-0.03em] text-white md:text-5xl">
              Command center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
              Monitor your projects, tasks and team
              productivity from one intelligent workspace.
            </p>
          </div>

          {/* WORKSPACE SELECTOR */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setWorkspaceMenuOpen(
                  (current) => !current,
                )
              }
              className="flex min-w-[240px] items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left shadow-xl shadow-black/20 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10">
                  <FolderKanban
                    size={18}
                    className="text-indigo-300"
                  />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    Workspace
                  </p>

                  <p className="mt-1 max-w-[140px] truncate text-sm font-medium">
                    {selectedWorkspace?.name}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-white/30 transition ${
                  workspaceMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#101015]/95 p-1 shadow-2xl backdrop-blur-2xl">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkspace(
                        workspace,
                      );

                      setWorkspaceMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      selectedWorkspace?.id ===
                      workspace.id
                        ? "bg-indigo-500/10 text-indigo-200"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <FolderKanban size={16} />

                    <span className="truncate">
                      {workspace.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* STATS */}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<BarChart3 size={19} />}
          label="Total tasks"
          value={totalTasks}
          description="Across this workspace"
          loading={loadingAnalytics}
        />

        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Completed"
          value={completedTasks}
          description={`${completionRate}% completion rate`}
          loading={loadingAnalytics}
        />

        <StatCard
          icon={<AlertTriangle size={19} />}
          label="Overdue"
          value={overdueTasks}
          description="Requires attention"
          loading={loadingAnalytics}
        />

        <StatCard
          icon={<Activity size={19} />}
          label="Productivity"
          value={`${completionRate}%`}
          description={
            completionRate >= 80
              ? "Excellent performance"
              : "Room for improvement"
          }
          loading={loadingAnalytics}
        />
      </section>

      {/* ANALYTICS */}

      <section className="grid gap-5 xl:grid-cols-3">
        <AnalyticsCard
          title="Task status"
          description="Current distribution"
        >
          {loadingAnalytics ? (
            <AnalyticsLoading />
          ) : (
            <div className="space-y-4">
              <ProgressRow
                label="To do"
                value={analytics?.status.todo ?? 0}
                total={totalTasks}
              />

              <ProgressRow
                label="In progress"
                value={
                  analytics?.status.in_progress ?? 0
                }
                total={totalTasks}
              />

              <ProgressRow
                label="In review"
                value={
                  analytics?.status.in_review ?? 0
                }
                total={totalTasks}
              />

              <ProgressRow
                label="Done"
                value={
                  analytics?.status.done ?? 0
                }
                total={totalTasks}
              />

              <ProgressRow
                label="Cancelled"
                value={
                  analytics?.status.cancelled ?? 0
                }
                total={totalTasks}
              />
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Task priority"
          description="Workload distribution"
        >
          {loadingAnalytics ? (
            <AnalyticsLoading />
          ) : (
            <div className="space-y-4">
              <ProgressRow
                label="Low"
                value={analytics?.priority.low ?? 0}
                total={totalTasks}
              />

              <ProgressRow
                label="Medium"
                value={
                  analytics?.priority.medium ?? 0
                }
                total={totalTasks}
              />

              <ProgressRow
                label="High"
                value={
                  analytics?.priority.high ?? 0
                }
                total={totalTasks}
              />

              <ProgressRow
                label="Urgent"
                value={
                  analytics?.priority.urgent ?? 0
                }
                total={totalTasks}
              />
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Workspace intelligence"
          description="Live workspace overview"
        >
          <div className="space-y-5">
            <InsightRow
              icon={<FolderKanban size={18} />}
              label="Workspace"
              value={
                selectedWorkspace?.name ?? "—"
              }
            />

            <InsightRow
              icon={<Users size={18} />}
              label="Your role"
              value={
                selectedWorkspace?.role ?? "—"
              }
            />

            <InsightRow
              icon={<CheckCircle2 size={18} />}
              label="Completion"
              value={`${completionRate}%`}
            />

            <div className="rounded-2xl border border-indigo-400/10 bg-indigo-500/[0.05] p-4">
              <div className="flex items-center gap-3">
                <Sparkles
                  size={17}
                  className="text-indigo-300"
                />

                <p className="text-sm font-medium">
                  Workspace health
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-white/35">
                {completionRate >= 80
                  ? "Your workspace is performing exceptionally well."
                  : "Keep moving. Your team has opportunities to improve productivity."}
              </p>
            </div>
          </div>
        </AnalyticsCard>
      </section>
    </div>
  );
}

/* ============================================================
   PROJECTS ROUTE
============================================================ */

function ProjectsRoute() {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const data = await getMyWorkspaces();

        if (data.length > 0) {
          setWorkspace(data[0]);
        }
      } catch (error) {
        console.error(
          "Failed to load workspace:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2
          size={26}
          className="animate-spin text-indigo-300"
        />
      </div>
    );
  }

  if (!workspace) {
    return (
      <CreateWorkspace
        onCreated={(createdWorkspace) => {
          setWorkspace(createdWorkspace);
        }}
      />
    );
  }

  return (
    <Projects
      workspaceId={workspace.id}
    />
  );
}

/* ============================================================
   OWNER ACCESS
============================================================ */

function OwnerAccess() {
  const navigate = useNavigate();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyWorkspaces();
        if (data.length > 0) {
          setSelectedWorkspace(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    void load();
  }, []);

  function handleCopyWorkspaceId() {
    if (!selectedWorkspace) return;
    void navigator.clipboard.writeText(selectedWorkspace.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-8">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-[10%] h-[400px] w-[400px] rounded-full bg-amber-500/[0.06] blur-[140px]" />
        <div className="absolute right-[10%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-indigo-500/[0.06] blur-[150px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
              <Crown size={20} className="text-amber-300" />
            </div>

            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Owner Privileges
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Owner Command Center
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
            Complete administrative authority over workspace settings, team member roles, permissions, and workspace telemetry.
          </p>
        </div>

        {/* Workspace Quick Selector / Copy ID */}
        {selectedWorkspace && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyWorkspaceId}
              className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              {copiedId ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-300">Workspace ID Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-amber-300" />
                  <span>Copy Workspace ID</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 text-xs font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
            >
              <SettingsIcon size={14} />
              <span>Workspace Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Interactive Cards with Live Click Actions */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* CARD 1: WORKSPACE ADMINISTRATION */}
        <div className="group flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:border-amber-400/30 hover:bg-white/[0.05]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <Shield size={22} />
              </div>
              <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                Admin Control
              </span>
            </div>

            <h2 className="mt-6 text-xl font-bold text-white">
              Workspace Administration
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Manage workspace configuration, rename active workspaces, configure notification thresholds, and security policies.
            </p>

            <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-white/60">
              <div className="flex items-center justify-between">
                <span>Active Workspace:</span>
                <span className="font-semibold text-white">{selectedWorkspace?.name || "Loading..."}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Your Role:</span>
                <span className="font-semibold text-amber-300 uppercase">{selectedWorkspace?.role || "Owner"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 pt-2">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-500/20 hover:text-amber-200"
            >
              <span>Configure Workspace Settings</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              <FolderKanban size={14} />
              <span>Browse Projects</span>
            </button>
          </div>
        </div>

        {/* CARD 2: MEMBER PERMISSIONS & INVITATIONS */}
        <div className="group flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:border-indigo-400/30 hover:bg-white/[0.05]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                <Users size={22} />
              </div>
              <span className="rounded-full bg-indigo-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                Team Access
              </span>
            </div>

            <h2 className="mt-6 text-xl font-bold text-white">
              Member Permissions & Roles
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Invite teammates via email or link, assign Owner / Admin / Member roles, and revoke workspace access at any time.
            </p>

            <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Invite unlimited members to projects</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Assign Granular Permissions & Roles</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 pt-2">
            <button
              type="button"
              onClick={() => navigate("/workspace/members")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/20 py-2.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/30 hover:text-white"
            >
              <UserPlus size={14} />
              <span>Invite & Manage Members</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/team")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Users size={14} />
              <span>View Team Workload</span>
            </button>
          </div>
        </div>

        {/* CARD 3: WORKSPACE CONTROLS & INTELLIGENCE */}
        <div className="group flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:border-purple-400/30 hover:bg-white/[0.05]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
                <Zap size={22} />
              </div>
              <span className="rounded-full bg-purple-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-300">
                AI Intelligence
              </span>
            </div>

            <h2 className="mt-6 text-xl font-bold text-white">
              Workspace Controls & AI
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Run autonomous daily standups, diagnose sprint health, perform semantic knowledge search, and configure custom LLM keys.
            </p>

            <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-purple-400" />
                <span>Autonomous Daily Standup Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-purple-400" />
                <span>Predictive Sprint Blocker Modeling</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 pt-2">
            <button
              type="button"
              onClick={() => navigate("/ai")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 py-2.5 text-xs font-semibold text-purple-200 transition hover:from-purple-500/40 hover:to-indigo-500/40 hover:text-white"
            >
              <Sparkles size={14} />
              <span>Launch AI Command Center</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/analytics")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              <BarChart3 size={14} />
              <span>Performance Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS & COLLABORATION GUIDE */}
      <div className="relative overflow-hidden rounded-[28px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.04] to-black/40 p-7 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-300">
              <Bell size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Notifications & Event Dispatcher System
              </span>
            </div>

            <h3 className="text-xl font-bold text-white">
              How Notifications Work & How to Send Them
            </h3>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs">
                <p className="font-semibold text-indigo-200">📥 Receiving Notifications</p>
                <p className="mt-1 text-white/50 leading-5">
                  You automatically receive alerts whenever a task is assigned to you, a deliverable status changes, or a teammate comments on your work.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs">
                <p className="font-semibold text-emerald-200">📤 Sending / Triggering Notifications</p>
                <p className="mt-1 text-white/50 leading-5">
                  Assign any task to a member, update task status, or post a comment. The backend event bus dispatches real-time alerts immediately to their inbox.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.02]"
          >
            <Bell size={16} />
            <span>Open Notifications Center</span>
          </button>
        </div>
      </div>

      {/* ROLE PRIVILEGES MATRIX */}
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 shadow-xl backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Workspace Role Privileges</h3>
            <p className="text-xs text-white/40">Overview of capabilities by permission tier</p>
          </div>
          <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            Owner Controls
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="pb-3 font-semibold">Capability</th>
                <th className="pb-3 font-semibold text-amber-300">Owner</th>
                <th className="pb-3 font-semibold text-indigo-300">Admin</th>
                <th className="pb-3 font-semibold text-white/70">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-white/70">
              <tr>
                <td className="py-3">Manage Workspace Settings & Delete Workspace</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
                <td className="py-3 text-rose-400">✗</td>
                <td className="py-3 text-rose-400">✗</td>
              </tr>
              <tr>
                <td className="py-3">Invite Members & Assign Roles</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
                <td className="py-3 text-emerald-400">✓ Member Only</td>
                <td className="py-3 text-rose-400">✗</td>
              </tr>
              <tr>
                <td className="py-3">Create Projects & Assign Tasks</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
              </tr>
              <tr>
                <td className="py-3">AI Copilot, Standup Reports & Telemetry</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
                <td className="py-3 text-emerald-400">✓ Full</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
  description,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
  loading: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/[0.06] blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-indigo-300">
            {icon}
          </div>

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-white/30">
          {label}
        </p>

        {loading ? (
          <div className="mt-3 h-10 w-24 animate-pulse rounded-xl bg-white/10" />
        ) : (
          <p className="mt-2 text-4xl font-bold tracking-tight">
            {value}
          </p>
        )}

        <p className="mt-2 text-xs text-white/30">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ANALYTICS CARD
============================================================ */

function AnalyticsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl">
      <div className="mb-6">
        <h2 className="text-base font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-xs text-white/30">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

/* ============================================================
   PROGRESS ROW
============================================================ */

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-white/60">
          {label}
        </span>

        <span className="text-xs text-white/30">
          {value}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   INSIGHT ROW
============================================================ */

function InsightRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-300">
          {icon}
        </div>

        <span className="text-sm text-white/45">
          {label}
        </span>
      </div>

      <span className="max-w-[140px] truncate text-sm font-medium capitalize text-white/80">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   ANALYTICS LOADING
============================================================ */

function AnalyticsLoading() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map(
        (_, index) => (
          <div key={index}>
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-white/10" />

            <div className="h-1.5 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        ),
      )}
    </div>
  );
}

/* ============================================================
   APP ROUTER
============================================================ */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ======================================================
            PUBLIC ROUTES
        ====================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/invite/:token"
          element={<AcceptInvitation />}
        />

        <Route
          path="/invitations/:token/accept"
          element={<AcceptInvitation />}
        />

        {/* ======================================================
            PROTECTED ROUTES
        ====================================================== */}

        <Route element={<ProtectedLayout />}>

          {/* DASHBOARD */}

          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* TASKS */}

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          {/* WORKSPACE MEMBERS */}

          <Route
            path="/workspace/members"
            element={<WorkspaceMembers />}
          />

          {/* OWNER ACCESS */}

          <Route
            path="/workspace/owner-access"
            element={<OwnerAccess />}
          />

          {/* PROJECTS */}

          <Route
            path="/projects"
            element={<ProjectsRoute />}
          />

          {/* PROJECT DETAILS */}

          <Route
            path="/projects/:projectId"
            element={<ProjectDetails />}
          />

          {/* ANALYTICS */}

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          {/* TEAM */}

          <Route
            path="/team"
            element={<Team />}
          />

          {/* NOTIFICATIONS */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          {/* SETTINGS */}

          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* AI */}

          <Route
            path="/ai"
            element={<AICopilot />}
          />

        </Route>

        {/* ======================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
