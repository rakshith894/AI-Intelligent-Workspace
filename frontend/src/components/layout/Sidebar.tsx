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
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

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

export default function Sidebar({
  collapsed,
  onCollapse,
}: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className={`
        fixed
        bottom-0
        left-0
        top-0
        z-50
        hidden
        border-r
        border-white/[0.07]
        bg-[#080914]/80
        backdrop-blur-2xl
        transition-all
        duration-300
        md:flex
        md:flex-col
        ${
          collapsed
            ? "w-[78px]"
            : "w-[260px]"
        }
      `}
    >
      {/* AMBIENT GLOW */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-24
          h-48
          w-48
          -translate-x-1/2
          rounded-full
          bg-indigo-600/10
          blur-[90px]
        "
      />

      {/* BRAND */}

      <div
        className={`
          relative
          flex
          h-20
          items-center
          border-b
          border-white/[0.07]
          ${
            collapsed
              ? "justify-center"
              : "px-5"
          }
        `}
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{
              rotate: 8,
              scale: 1.05,
            }}
            className="
              relative
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-xl
              bg-gradient-to-br
              from-indigo-400
              via-purple-500
              to-fuchsia-500
              shadow-[0_0_30px_rgba(99,102,241,0.3)]
            "
          >
            <Sparkles
              size={20}
              className="text-white"
            />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-tr
                from-white/20
                to-transparent
              "
            />
          </motion.div>

          {!collapsed && (
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Intelligent
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                Workspace
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE SWITCHER */}

      {!collapsed && (
        <div className="relative px-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-white/[0.07]
              bg-white/[0.035]
              p-3
              text-left
              transition
              hover:border-white/[0.12]
              hover:bg-white/[0.055]
            "
          >
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-gradient-to-br
                from-cyan-400/20
                to-indigo-500/20
                text-xs
                font-bold
                text-cyan-300
              "
            >
              IW
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                My Workspace
              </p>

              <p className="truncate text-[10px] text-gray-500">
                Personal workspace
              </p>
            </div>

            <ChevronDown
              size={15}
              className="text-gray-600"
            />
          </button>
        </div>
      )}

      {/* NAVIGATION */}

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pt-6">
        {!collapsed && (
          <p
            className="
              mb-3
              px-3
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-gray-600
            "
          >
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
                group
                relative
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                transition-all
                ${
                  isActive
                    ? "bg-indigo-500/[0.12] text-indigo-300"
                    : "text-gray-500 hover:bg-white/[0.045] hover:text-gray-200"
                }
                ${
                  collapsed
                    ? "justify-center"
                    : ""
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="
                        absolute
                        left-0
                        top-1/2
                        h-6
                        w-[3px]
                        -translate-y-1/2
                        rounded-r-full
                        bg-indigo-400
                        shadow-[0_0_12px_rgba(129,140,248,0.8)]
                      "
                    />
                  )}

                  <Icon
                    size={18}
                    className={`
                      shrink-0
                      ${
                        isActive
                          ? "text-indigo-300"
                          : "text-gray-600 group-hover:text-gray-300"
                      }
                    `}
                  />

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">
                        {item.label}
                      </span>

                      {item.label ===
                        "Notifications" && (
                        <span
                          className="
                            rounded-full
                            bg-indigo-500/15
                            px-2
                            py-0.5
                            text-[9px]
                            font-semibold
                            text-indigo-300
                          "
                        >
                          3
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
            <p
              className="
                mb-3
                px-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-gray-600
              "
            >
              Team Management
            </p>

            {/* WORKSPACE MEMBERS */}

            <NavLink
              to="/workspace/members"
              className={({ isActive }) => `
                group
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                transition
                ${
                  isActive
                    ? "bg-indigo-500/[0.12] text-indigo-300"
                    : "text-gray-500 hover:bg-white/[0.045] hover:text-gray-200"
                }
              `}
            >
              <Users
                size={18}
                className="shrink-0"
              />

              <span className="flex-1">
                Workspace Members
              </span>
            </NavLink>

            {/* OWNER ACCESS */}

            <NavLink
              to="/workspace/owner-access"
              className={({ isActive }) => `
                group
                mt-1
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                transition
                ${
                  isActive
                    ? "bg-indigo-500/[0.12] text-indigo-300"
                    : "text-gray-500 hover:bg-white/[0.045] hover:text-gray-200"
                }
              `}
            >
              <UserCog
                size={18}
                className="shrink-0"
              />

              <span className="flex-1">
                Owner Access
              </span>

              {/* OWNER BADGE
                  Clicking this badge will NOT
                  trigger the NavLink. */}

              <span
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="
                  cursor-default
                  rounded-full
                  border
                  border-amber-400/20
                  bg-amber-400/10
                  px-2
                  py-0.5
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-amber-300
                "
              >
                Owner
              </span>
            </NavLink>
          </div>
        )}

        {/* AI SECTION */}

        {!collapsed && (
          <div className="pt-6">
            <p
              className="
                mb-3
                px-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-gray-600
              "
            >
              Intelligence
            </p>

            <button
              type="button"
              onClick={() => navigate("/ai")}
              className="
                group
                relative
                flex
                w-full
                items-center
                gap-3
                overflow-hidden
                rounded-xl
                border
                border-indigo-400/10
                bg-gradient-to-r
                from-indigo-500/[0.08]
                to-purple-500/[0.05]
                px-3
                py-3
                text-sm
                text-indigo-300
                transition
                hover:border-indigo-400/20
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-500/10
                "
              >
                <Zap size={16} />
              </div>

              <div className="text-left">
                <p className="text-xs font-medium">
                  AI Copilot
                </p>

                <p className="text-[10px] text-indigo-300/50">
                  Ask anything
                </p>
              </div>

              <Sparkles
                size={14}
                className="
                  ml-auto
                  text-purple-400
                  transition
                  group-hover:rotate-12
                "
              />
            </button>
          </div>
        )}
      </nav>

      {/* BOTTOM */}

      <div className="relative space-y-2 border-t border-white/[0.07] p-3">
        {/* SETTINGS */}

        <button
          type="button"
          onClick={() => navigate("/settings")}
          className={`
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-3
            text-sm
            text-gray-500
            transition
            hover:bg-white/[0.045]
            hover:text-white
            ${
              collapsed
                ? "justify-center"
                : ""
            }
          `}
        >
          <Settings size={18} />

          {!collapsed && (
            <span>Settings</span>
          )}
        </button>

        {/* NEW TASK */}

        {!collapsed && (
          <motion.button
            type="button"
            onClick={() => navigate("/tasks")}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-indigo-500
              to-purple-500
              py-3
              text-xs
              font-semibold
              text-white
              shadow-[0_0_25px_rgba(99,102,241,0.2)]
              transition
              hover:shadow-[0_0_35px_rgba(99,102,241,0.35)]
            "
          >
            <Plus size={16} />

            New Task
          </motion.button>
        )}

        {/* COLLAPSE */}

        <button
          type="button"
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          onClick={onCollapse}
          className="
            absolute
            -right-3
            top-[-14px]
            hidden
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border
            border-white/[0.1]
            bg-[#10111d]
            text-gray-500
            shadow-lg
            transition
            hover:text-white
            md:flex
          "
        >
          <ChevronLeft
            size={14}
            className={`transition-transform ${
              collapsed
                ? "rotate-180"
                : ""
            }`}
          />
        </button>
      </div>
    </aside>
  );
}