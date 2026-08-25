
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  FolderKanban,
  Home,
  Plus,
  Settings,
  Sparkles,
  Users,
  UserCog,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";

import { getMyWorkspaces, type Workspace } from "../../services/workspace";
import { getNotifications } from "../../services/notifications";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

const navigation = [
  {
    label: "Overview",
    icon: Home,
    path: "/",
  },
  {
    label: "Tasks",
    icon: CheckSquare,
    path: "/tasks",
  },
  {
    label: "Projects",
    icon: FolderKanban,
    path: "/projects",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "Team",
    icon: Users,
    path: "/team",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
];

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    async function loadWorkspaceAndNotifications() {
      try {
        const [wsList, notifData] = await Promise.all([
          getMyWorkspaces().catch(() => []),
          getNotifications().catch(() => ({ items: [], unread_count: 0 })),
        ]);
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          setSelectedWorkspace(wsList[0]);
        }
        setUnreadNotifications(notifData.unread_count ?? 0);
      } catch (err) {
        console.error(err);
      }
    }
    void loadWorkspaceAndNotifications();
  }, []);

  return (
    <>
      {/* MOBILE BACKDROP */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onCollapse}
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#080914]/95 backdrop-blur-2xl transition-all duration-300
          ${collapsed ? "-translate-x-full md:translate-x-0 md:w-[78px]" : "translate-x-0 w-[260px]"}
        `}
      >
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[90px]" />

      {/* BRAND */}
      <div
        className={`relative flex h-20 items-center border-b border-white/[0.07] ${
          collapsed ? "justify-center" : "px-5"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left"
        >
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          >
            <Sparkles size={20} className="text-white" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
          </motion.div>

          {!collapsed && (
            <div>
              <p className="text-sm font-bold tracking-tight text-white">Intelligent</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-300/70">
                Workspace
              </p>
            </div>
          )}
        </button>
      </div>

      {/* WORKSPACE SWITCHER */}
      {!collapsed && (
        <div className="relative px-3 pt-4">
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition hover:border-white/[0.12] hover:bg-white/[0.055]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 text-xs font-bold text-cyan-300">
              {(selectedWorkspace?.name || "IW").slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {selectedWorkspace?.name || "My Workspace"}
              </p>
              <p className="truncate text-[10px] text-gray-500 capitalize">
                {selectedWorkspace?.role || "Active Workspace"}
              </p>
            </div>

            <ChevronDown size={15} className={`text-gray-500 transition ${workspaceMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d18]/95 p-1 shadow-2xl backdrop-blur-2xl">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setSelectedWorkspace(ws);
                    setWorkspaceMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
                    selectedWorkspace?.id === ws.id
                      ? "bg-indigo-500/15 text-indigo-300 font-semibold"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <FolderKanban size={14} />
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}

              <div className="border-t border-white/[0.06] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-500/10"
                >
                  <Plus size={14} />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pt-6">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Workspace
          </p>
        )}

        {/* MAIN NAVIGATION */}
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `
                group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all
                ${
                  isActive
                    ? "bg-indigo-500/[0.12] text-indigo-300 font-medium"
                    : "text-gray-400 hover:bg-white/[0.045] hover:text-white"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]"
                    />
                  )}

                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive ? "text-indigo-300" : "text-gray-500 group-hover:text-gray-300"
                    }`}
                  />

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.label === "Notifications" && unreadNotifications > 0 && (
                        <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[9px] font-bold text-indigo-300">
                          {unreadNotifications}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* TEAM MANAGEMENT */}
        {!collapsed && (
          <div className="pt-5">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Team Management
            </p>

            <NavLink
              to="/workspace/members"
              className={({ isActive }) => `
                group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition
                ${
                  isActive
                    ? "bg-indigo-500/[0.12] text-indigo-300 font-medium"
                    : "text-gray-400 hover:bg-white/[0.045] hover:text-white"
                }
              `}
            >
              <Users size={18} className="shrink-0" />
              <span className="flex-1">Workspace Members</span>
            </NavLink>

            <NavLink
              to="/workspace/owner-access"
              className={({ isActive }) => `
                group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition
                ${
                  isActive
                    ? "bg-indigo-500/[0.12] text-indigo-300 font-medium"
                    : "text-gray-400 hover:bg-white/[0.045] hover:text-white"
                }
              `}
            >
              <UserCog size={18} className="shrink-0" />
              <span className="flex-1">Owner Access</span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-amber-300">
                Owner
              </span>
            </NavLink>
          </div>
        )}


        {/* AI SECTION — always visible, even when collapsed */}
        <div className={collapsed ? "mt-4" : "pt-5"}>
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Intelligence
            </p>
          )}

          <NavLink
            to="/ai"
            className={({ isActive }) => `
              group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-sm transition
              ${isActive
                ? "border-indigo-400/30 bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-200"
                : "border-indigo-400/15 bg-gradient-to-r from-indigo-500/[0.08] to-purple-500/[0.05] text-indigo-300 hover:border-indigo-400/30"
              }
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]"
                  />
                )}

                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-indigo-500/25" : "bg-indigo-500/15"}`}>
                  <Zap size={16} className="text-indigo-300" />
                </div>

                {!collapsed && (
                  <>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white">AI Copilot</p>
                      <p className="text-[10px] text-indigo-300/60">Ask anything</p>
                    </div>

                    <Sparkles size={14} className="ml-auto text-purple-400 transition group-hover:rotate-12" />
                  </>
                )}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* FOOTER */}
      <div className="relative space-y-2 border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 transition hover:bg-white/[0.045] hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </button>

        {!collapsed && (
          <motion.button
            type="button"
            onClick={() => navigate("/tasks")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-xs font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.2)] transition hover:shadow-[0_0_35px_rgba(99,102,241,0.35)]"
          >
            <Plus size={16} />
            <span>New Task</span>
          </motion.button>
        )}

        {/* COLLAPSE TOGGLE */}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onCollapse}
          className="absolute -right-3 top-[-14px] hidden h-7 w-7 items-center justify-center rounded-full border border-white/[0.1] bg-[#10111d] text-gray-400 shadow-lg transition hover:text-white md:flex"
        >
          <ChevronLeft size={14} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
    </>
  );
}