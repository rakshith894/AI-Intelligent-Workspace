
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Command,
  Menu,
  Search,
  Sparkles,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  X,
  LogOut,
  BarChart3,
  Shield,
  Zap,
  Crown,
  ChevronDown,
  Plus,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { logout } from "../../services/auth";
import { getNotifications, getUnreadNotificationCount } from "../../services/notifications";
import { getMyWorkspaces, type Workspace } from "../../services/workspace";

interface TopbarProps {
  onMenuClick: () => void;
}


interface CommandItem {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const commands: CommandItem[] = [
  {
    label: "Dashboard",
    description: "Open your workspace command center",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Tasks",
    description: "View and manage workspace tasks",
    icon: CheckSquare,
    path: "/tasks",
  },
  {
    label: "Projects",
    description: "Browse and create projects",
    icon: FolderKanban,
    path: "/projects",
  },
  {
    label: "Analytics",
    description: "Deep productivity and workload metrics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "Team Workload",
    description: "Manage team capacity & distribution",
    icon: Users,
    path: "/team",
  },
  {
    label: "AI Copilot",
    description: "Intelligent workspace assistant",
    icon: Zap,
    path: "/ai",
  },
  {
    label: "Notifications",
    description: "Review unread notifications and alerts",
    icon: Bell,
    path: "/notifications",
  },
  {
    label: "Settings",
    description: "Workspace & notification preferences",
    icon: Settings,
    path: "/settings",
  },
];

export default function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [notifData, wsData] = await Promise.all([
          getNotifications().catch(() => ({ unread_count: 0 })),
          getMyWorkspaces().catch(() => []),
        ]);
        setUnreadCount(notifData.unread_count ?? 0);
        setWorkspaces(wsData || []);
        if (wsData && wsData.length > 0) {
          setActiveWorkspace(wsData[0]);
        }
      } catch {
        // quiet fallback
      }
    }
    void loadData();

    // Poll unread count using the lightweight endpoint (every 30s)
    const interval = setInterval(() => {
      void getUnreadNotificationCount()
        .then((data) => setUnreadCount(data.count ?? 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* KEYBOARD SHORTCUT */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setProfileOpen(false);
        setWorkspaceOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* CLICK-AWAY */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
    }
    if (profileOpen || workspaceOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen, workspaceOpen]);

  const filteredCommands = commands.filter(
    (command) =>
      command.label.toLowerCase().includes(search.toLowerCase()) ||
      command.description.toLowerCase().includes(search.toLowerCase()),
  );

  function executeCommand(path: string) {
    setCommandOpen(false);
    navigate(path);
  }

  return (
    <>
      {/* TOPBAR HEADER */}
      <header className="fixed left-0 right-0 top-0 z-40 h-20 border-b border-white/[0.07] bg-[#080914]/75 backdrop-blur-2xl">
        <div className="flex h-full items-center gap-3 px-4 md:pl-[280px] md:pr-8">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5 text-gray-400 transition hover:bg-white/[0.08] hover:text-white md:hidden"
          >
            <Menu size={19} />
          </button>

          {/* Search Trigger */}
          <motion.button
            type="button"
            onClick={() => setCommandOpen(true)}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className="group hidden h-11 w-full max-w-sm items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-left transition hover:border-indigo-400/30 hover:bg-white/[0.055] lg:flex"
          >
            <Search size={16} className="text-gray-500 transition group-hover:text-indigo-400" />
            <span className="flex-1 text-xs text-gray-500">Quick search (Ctrl + K)...</span>
            <span className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/20 px-2 py-0.5 text-[10px] text-gray-400">
              <Command size={9} />K
            </span>
          </motion.button>

          {/* Right Side Actions */}
          <div className="ml-auto flex items-center gap-2.5">
            {/* WORKSPACE SELECTOR DROPDOWN */}
            {activeWorkspace && (
              <div className="relative" ref={workspaceRef}>
                <motion.button
                  type="button"
                  onClick={() => setWorkspaceOpen((prev) => !prev)}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                    {activeWorkspace.role === "owner" ? (
                      <Crown size={12} className="text-amber-300" />
                    ) : (
                      <Users size={12} className="text-indigo-300" />
                    )}
                  </div>
                  <span className="max-w-[120px] truncate font-semibold">
                    {activeWorkspace.name}
                  </span>
                  <ChevronDown size={13} className="text-white/40" />
                </motion.button>

                {workspaceOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d18]/95 p-2 shadow-2xl backdrop-blur-2xl">
                    <div className="border-b border-white/[0.06] px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        Your Workspaces ({workspaces.length})
                      </p>
                    </div>

                    <div className="max-h-48 overflow-y-auto py-1 space-y-1">
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            setActiveWorkspace(ws);
                            setWorkspaceOpen(false);
                            navigate("/");
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                            activeWorkspace.id === ws.id
                              ? "bg-indigo-500/20 text-white font-semibold"
                              : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {ws.role === "owner" ? (
                              <Crown size={13} className="text-amber-300 shrink-0" />
                            ) : (
                              <Users size={13} className="text-indigo-300 shrink-0" />
                            )}
                            <span className="truncate">{ws.name}</span>
                          </div>
                          {activeWorkspace.id === ws.id && (
                            <Check size={13} className="text-indigo-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-white/[0.06] pt-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setWorkspaceOpen(false);
                          navigate("/settings");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/10 transition font-medium"
                      >
                        <Plus size={13} />
                        <span>Create Workspace</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWorkspaceOpen(false);
                          navigate("/workspace/members");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.05] hover:text-white transition"
                      >
                        <Users size={13} />
                        <span>Manage Team & Invites</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWorkspaceOpen(false);
                          navigate("/settings");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.05] hover:text-white transition"
                      >
                        <Settings size={13} />
                        <span>Workspace Settings</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* AI Copilot shortcut */}
            <motion.button
              type="button"
              onClick={() => navigate("/ai")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 px-3 py-2 text-xs font-medium text-indigo-300 transition hover:border-indigo-400/40 hover:from-indigo-500/25 hover:to-purple-500/25"
            >
              <Sparkles size={14} className="text-indigo-300" />
              <span className="hidden sm:inline">AI Copilot</span>
            </motion.button>

            {/* Notifications button */}
            <motion.button
              type="button"
              onClick={() => navigate("/notifications")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative rounded-xl border border-white/[0.08] bg-white/[0.035] p-2 text-gray-400 transition hover:bg-white/[0.07] hover:text-white"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(129,140,248,0.9)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>

              <motion.button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 rounded-xl p-1.5 pr-3 transition hover:bg-white/[0.05]"
              >
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-500 text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  IW
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#080914] bg-emerald-400" />
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-xs font-medium text-white">My Account</p>
                  <p className="text-[10px] text-indigo-300/70">Workspace Active</p>
                </div>
              </motion.button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d18]/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                  <div className="border-b border-white/[0.06] px-3 py-2.5">
                    <p className="text-xs font-semibold text-white">Intelligent Workspace</p>
                    <p className="text-[10px] text-white/40">Collaborative Cloud Suite</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Settings size={14} className="text-indigo-400" />
                      <span>Settings & Preferences</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/workspace/members");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Users size={14} className="text-purple-400" />
                      <span>Workspace Members</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/workspace/owner-access");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Shield size={14} className="text-amber-400" />
                      <span>Owner Permissions</span>
                    </button>
                  </div>

                  <div className="border-t border-white/[0.06] pt-1">
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-rose-400 transition hover:bg-rose-500/10"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ambient bottom glow */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[50%] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
      </header>

      {/* COMMAND PALETTE MODAL */}
      <AnimatePresence>
        {commandOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0d18]/95 shadow-[0_30px_100px_rgba(0,0,0,0.7)] backdrop-blur-3xl"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                <Search size={20} className="text-indigo-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredCommands.length > 0) {
                      executeCommand(filteredCommands[0].path);
                    }
                  }}
                  placeholder="Type a command or jump to page..."
                  className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setCommandOpen(false)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Commands List */}
              <div className="max-h-[420px] overflow-y-auto p-2">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.label}
                        type="button"
                        onClick={() => executeCommand(command.path)}
                        className="group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.06]"
                      >
                        <div className="rounded-lg border border-white/[0.07] bg-white/[0.035] p-2 text-gray-400 transition group-hover:border-indigo-400/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-300">
                          <Icon size={17} />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{command.label}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{command.description}</p>
                        </div>

                        <span className="text-xs text-gray-600 opacity-0 transition group-hover:opacity-100">
                          Jump ↵
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center">
                    <Search size={28} className="mx-auto text-gray-700" />
                    <p className="mt-3 text-sm text-gray-400">No matching commands</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[10px] text-gray-500">
                <span>Intelligent Workspace</span>
                <div className="flex gap-4">
                  <span>↵ Select</span>
                  <span>ESC Close</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}