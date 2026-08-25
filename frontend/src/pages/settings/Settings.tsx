import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  CheckSquare,
  Copy,
  Crown,
  FolderKanban,
  Loader2,
  LogOut,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../../services/notification-preferences";
import { getMe, logout, type UserProfile } from "../../services/auth";
import { getMyWorkspaces, type Workspace } from "../../services/workspace";
import {
  getGitHubStatus,
  connectGitHub,
  disconnectGitHub,
  getGitHubRepos,
  type GitHubStatus,
  type GitHubRepo,
} from "../../services/github";

/* ============================================================
   TOGGLE SWITCH
============================================================ */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-indigo-500 bg-indigo-500"
          : "border-white/20 bg-white/[0.06]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* ============================================================
   PREFERENCE ROW
============================================================ */

function PreferenceRow({
  icon,
  label,
  description,
  checked,
  onChange,
  saving,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5 transition hover:border-white/[0.13] hover:bg-white/[0.04]">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-300">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-white/90">{label}</p>
          <p className="mt-0.5 text-xs text-white/35">{description}</p>
        </div>
      </div>

      <Toggle checked={checked} onChange={onChange} disabled={saving} />
    </div>
  );
}

/* ============================================================
   SETTINGS PAGE
============================================================ */

const DEFAULT_PREFERENCES: NotificationPreferences = {
  task_assigned: true,
  status_changed: true,
  task_created: true,
  task_updated: true,
  mention: true,
  comment_added: true,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* GitHub State */
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [githubUsernameInput, setGithubUsernameInput] = useState("");
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [connectingGithub, setConnectingGithub] = useState(false);

  /* ============================================================
     LOAD PREFERENCES & USER PROFILE
  ============================================================ */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [prefsData, profileData, workspacesData, ghStatus] = await Promise.all([
          getNotificationPreferences().catch((err) => {
            console.warn("Could not fetch preferences from server, using defaults:", err);
            return DEFAULT_PREFERENCES;
          }),
          getMe().catch(() => null),
          getMyWorkspaces().catch(() => []),
          getGitHubStatus().catch(() => null),
        ]);
        setPrefs(prefsData || DEFAULT_PREFERENCES);
        setUserProfile(profileData);
        if (workspacesData && workspacesData.length > 0) {
          setWorkspace(workspacesData[0]);
        }
        setGithubStatus(ghStatus);
        if (ghStatus?.is_connected) {
          getGitHubRepos().then(setGithubRepos).catch(() => []);
        }
      } catch (err) {
        console.error(err);
        setPrefs(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleConnectGitHub(e: React.FormEvent) {
    e.preventDefault();
    if (!githubUsernameInput.trim()) return;
    try {
      setConnectingGithub(true);
      setError("");
      const updated = await connectGitHub(githubUsernameInput.trim());
      setGithubStatus(updated);
      setSuccessMessage(`Connected GitHub account @${updated.github_username}!`);
      const repos = await getGitHubRepos().catch(() => []);
      setGithubRepos(repos);
      setGithubUsernameInput("");
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to connect GitHub account. Please check the username.");
    } finally {
      setConnectingGithub(false);
    }
  }

  async function handleDisconnectGitHub() {
    try {
      setConnectingGithub(true);
      setError("");
      const updated = await disconnectGitHub();
      setGithubStatus(updated);
      setGithubRepos([]);
      setSuccessMessage("GitHub account disconnected.");
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to disconnect GitHub account.");
    } finally {
      setConnectingGithub(false);
    }
  }

  /* ============================================================
     UPDATE PREFERENCE
  ============================================================ */

  async function handleToggle(
    key: keyof NotificationPreferences,
    value: boolean,
  ) {
    if (!prefs || saving) return;

    const previous = { ...prefs };
    setPrefs({ ...prefs, [key]: value });

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const updated = await updateNotificationPreferences({ [key]: value });
      setPrefs(updated);

      setSuccessMessage("Preference updated successfully.");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      console.error(err);
      setPrefs(previous);
      setError("Failed to save preference. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyWorkspaceId() {
    if (!workspace) return;
    void navigator.clipboard.writeText(workspace.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
          <p className="text-sm text-white/40">Loading settings...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="relative mx-auto max-w-[850px] space-y-8">
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[25%] top-[10%] h-[350px] w-[350px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[15%] h-[300px] w-[300px] rounded-full bg-violet-600/[0.05] blur-[150px]" />
      </div>

      {/* HEADER */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
            <Sparkles size={15} className="text-indigo-300" />
          </div>
          <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
            WORKSPACE SETTINGS
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
          Settings & Preferences
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/40">
          Manage your live event notifications, account information, and workspace configuration.
        </p>
      </section>

      {/* ALERTS */}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] px-5 py-4 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. NOTIFICATION PREFERENCES */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
            <Bell size={18} className="text-indigo-300" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              Event Notification Preferences
            </h2>
            <p className="mt-0.5 text-xs text-white/35">
              Choose which workspace events trigger in-app notifications.
            </p>
          </div>

          {saving && (
            <Loader2 size={16} className="ml-auto animate-spin text-indigo-300" />
          )}
        </div>

        {prefs ? (
          <div className="space-y-3">
            <PreferenceRow
              icon={<User size={17} />}
              label="Task Assigned"
              description="Get notified when a task is assigned to you."
              checked={prefs.task_assigned}
              onChange={(value) => handleToggle("task_assigned", value)}
              saving={saving}
            />

            <PreferenceRow
              icon={<RefreshCw size={17} />}
              label="Status Changed"
              description="Get notified when a deliverable status changes (e.g. To Do ➔ Done)."
              checked={prefs.status_changed}
              onChange={(value) => handleToggle("status_changed", value)}
              saving={saving}
            />

            <PreferenceRow
              icon={<FolderKanban size={17} />}
              label="Task Created"
              description="Get notified when a new task is created in your workspace."
              checked={prefs.task_created}
              onChange={(value) => handleToggle("task_created", value)}
              saving={saving}
            />

            <PreferenceRow
              icon={<CheckSquare size={17} />}
              label="Task Updated"
              description="Get notified when a task description, priority, or due date changes."
              checked={prefs.task_updated}
              onChange={(value) => handleToggle("task_updated", value)}
              saving={saving}
            />

            <PreferenceRow
              icon={<MessageCircle size={17} />}
              label="Comments & Discussions"
              description="Get notified when a teammate comments on your tasks."
              checked={prefs.comment_added}
              onChange={(value) => handleToggle("comment_added", value)}
              saving={saving}
            />

            <PreferenceRow
              icon={<MessageSquare size={17} />}
              label="Mentions"
              description="Get notified when someone mentions you in task discussions."
              checked={prefs.mention}
              onChange={(value) => handleToggle("mention", value)}
              saving={saving}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <SettingsIcon size={26} className="mx-auto text-white/20" />
            <p className="mt-3 text-sm text-white/30">
              Unable to load preferences.
            </p>
          </div>
        )}
      </section>

      {/* 2. ACCOUNT INFORMATION */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <User size={18} className="text-white/70" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">Account Information</h2>
              <p className="mt-0.5 text-xs text-white/35">
                Your personal identity and profile details.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            Active User
          </span>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-white/[0.04] pb-3">
            <span className="text-white/40">Full Name</span>
            <span className="font-medium text-white">{userProfile?.full_name || "Workspace Member"}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-white/[0.04] pb-3">
            <span className="text-white/40">Email Address</span>
            <span className="font-mono text-indigo-300">{userProfile?.email || "Signed In"}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-white/[0.04] pb-3">
            <span className="text-white/40">User ID</span>
            <span className="font-mono text-[11px] text-white/60">{userProfile?.user_id || "—"}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-white/40">Account Created</span>
            <span className="text-white/70">
              {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "Active"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. GITHUB ACCOUNT INTEGRATION */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">GitHub Account Integration</h2>
              <p className="mt-0.5 text-xs text-white/35">
                Connect your GitHub profile to link repositories and activity.
              </p>
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              githubStatus?.is_connected
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.05] text-white/40"
            }`}
          >
            {githubStatus?.is_connected ? "Connected" : "Not Connected"}
          </span>
        </div>

        {githubStatus?.is_connected ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={githubStatus.avatar_url || `https://github.com/${githubStatus.github_username}.png`}
                  alt="GitHub Avatar"
                  className="h-12 w-12 rounded-xl border border-white/10 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    @{githubStatus.github_username}
                  </p>
                  <a
                    href={githubStatus.profile_url || `https://github.com/${githubStatus.github_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-300 hover:underline"
                  >
                    View GitHub Profile ↗
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnectGitHub}
                disabled={connectingGithub}
                className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
              >
                {connectingGithub ? "Disconnecting..." : "Disconnect GitHub"}
              </button>
            </div>

            {githubRepos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/50">Your Public Repositories:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {githubRepos.slice(0, 6).map((repo) => (
                    <a
                      key={repo.name}
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs transition hover:border-indigo-400/30 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white group-hover:text-indigo-300">
                          {repo.name}
                        </span>
                        <span className="text-[10px] text-amber-300">
                          ★ {repo.stargazers_count}
                        </span>
                      </div>
                      {repo.description && (
                        <p className="mt-1 line-clamp-1 text-[11px] text-white/40">
                          {repo.description}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleConnectGitHub} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={githubUsernameInput}
              onChange={(e) => setGithubUsernameInput(e.target.value)}
              placeholder="Enter your GitHub username (e.g. octocat)"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-xs text-white placeholder:text-white/20 focus:border-indigo-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={connectingGithub}
              className="h-11 rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {connectingGithub ? "Connecting..." : "Connect GitHub"}
            </button>
          </form>
        )}
      </section>

      {/* 3. ACTIVE WORKSPACE CONTROLS */}
      {workspace && (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <Crown size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white">Active Workspace</h2>
                <p className="mt-0.5 text-xs text-white/35">
                  Workspace controls and administrative shortcuts.
                </p>
              </div>
            </div>

            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              {workspace.role || "Member"}
            </span>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <span className="text-white/40">Workspace Name</span>
              <span className="font-semibold text-white">{workspace.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/40">Workspace UUID</span>
              <button
                type="button"
                onClick={handleCopyWorkspaceId}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/70 hover:bg-white/[0.08] hover:text-white"
              >
                {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedId ? "Copied" : workspace.id.slice(0, 16) + "..."}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/workspace/members")}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <Users size={14} className="text-indigo-300" />
              <span>Manage Members</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/workspace/owner-access")}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
            >
              <Shield size={14} />
              <span>Owner Access Hub</span>
            </button>
          </div>
        </section>
      )}

      {/* 4. SIGN OUT */}
      <section className="rounded-[28px] border border-rose-500/20 bg-rose-500/[0.03] p-6 shadow-xl backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-rose-300">Sign Out</h3>
            <p className="mt-0.5 text-xs text-white/40">
              End your current authenticated workspace session.
            </p>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2.5 text-xs font-semibold text-rose-300 border border-rose-400/30 transition hover:bg-rose-500/30 hover:text-white"
          >
            <LogOut size={14} />
            <span>Sign Out of Workspace</span>
          </button>
        </div>
      </section>
    </div>
  );
}
