import { useEffect, useState } from "react";
import {
  Bell,
  Command,
  Menu,
  Search,
  Sparkles,
  Plus,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface TopbarProps {
  onMenuClick: () => void;
}

interface CommandItem {
  label: string;
  description: string;
  icon: React.ElementType;
}

const commands: CommandItem[] = [
  {
    label: "Dashboard",
    description: "Open your workspace dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Create Task",
    description: "Create a new task",
    icon: Plus,
  },
  {
    label: "Tasks",
    description: "View and manage your tasks",
    icon: CheckSquare,
  },
  {
    label: "Projects",
    description: "Browse your projects",
    icon: FolderKanban,
  },
  {
    label: "Team",
    description: "Manage your workspace team",
    icon: Users,
  },
  {
    label: "Settings",
    description: "Manage workspace settings",
    icon: Settings,
  },
];

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const [commandOpen, setCommandOpen] =
    useState(false);

  const [search, setSearch] = useState("");

  /* ========================================= */
  /* KEYBOARD SHORTCUT */
  /* ========================================= */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  const filteredCommands = commands.filter(
    (command) =>
      command.label
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      command.description
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <>
      {/* ======================================= */}
      {/* TOPBAR */}
      {/* ======================================= */}

      <header
        className="
          fixed
          left-0
          right-0
          top-0
          z-40
          h-20
          border-b
          border-white/[0.07]
          bg-[#080914]/65
          backdrop-blur-2xl
        "
      >
        <div
          className="
            flex
            h-full
            items-center
            gap-4
            px-4
            md:pl-[280px]
            md:pr-8
          "
        >

          {/* Mobile menu */}

          <button
            onClick={onMenuClick}
            className="
              rounded-xl
              border
              border-white/[0.08]
              bg-white/[0.035]
              p-2.5
              text-gray-400
              transition
              hover:bg-white/[0.08]
              hover:text-white
              md:hidden
            "
          >
            <Menu size={19} />
          </button>

          {/* Search */}

          <motion.button
            onClick={() =>
              setCommandOpen(true)
            }
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.99,
            }}
            className="
              group
              hidden
              h-11
              w-full
              max-w-xl
              items-center
              gap-3
              rounded-xl
              border
              border-white/[0.08]
              bg-white/[0.035]
              px-4
              text-left
              transition
              hover:border-indigo-400/20
              hover:bg-white/[0.055]
              md:flex
            "
          >
            <Search
              size={17}
              className="
                text-gray-500
                transition
                group-hover:text-indigo-400
              "
            />

            <span className="flex-1 text-sm text-gray-500">
              Search your workspace...
            </span>

            <span
              className="
                flex
                items-center
                gap-1
                rounded-lg
                border
                border-white/[0.08]
                bg-black/20
                px-2
                py-1
                text-[10px]
                text-gray-500
              "
            >
              <Command size={10} />
              K
            </span>
          </motion.button>

          {/* Right side */}

          <div className="ml-auto flex items-center gap-2">

            {/* AI */}

            <motion.button
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="
                hidden
                items-center
                gap-2
                rounded-xl
                border
                border-indigo-400/15
                bg-indigo-500/[0.08]
                px-3
                py-2.5
                text-sm
                text-indigo-300
                sm:flex
              "
            >
              <Sparkles size={16} />

              <span>AI</span>
            </motion.button>

            {/* Notifications */}

            <motion.button
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="
                relative
                rounded-xl
                border
                border-white/[0.08]
                bg-white/[0.035]
                p-2.5
                text-gray-400
                transition
                hover:bg-white/[0.07]
                hover:text-white
              "
            >
              <Bell size={18} />

              <span
                className="
                  absolute
                  right-2
                  top-2
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-indigo-400
                  shadow-[0_0_8px_rgba(129,140,248,0.9)]
                "
              />
            </motion.button>

            {/* Profile */}

            <motion.button
              whileHover={{
                scale: 1.02,
              }}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                p-1.5
                pr-3
                transition
                hover:bg-white/[0.04]
              "
            >
              <div
                className="
                  relative
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-indigo-400
                  via-purple-500
                  to-fuchsia-500
                  text-xs
                  font-bold
                  shadow-[0_0_20px_rgba(99,102,241,0.25)]
                "
              >
                R

                <span
                  className="
                    absolute
                    bottom-0
                    right-0
                    h-2.5
                    w-2.5
                    rounded-full
                    border-2
                    border-[#080914]
                    bg-emerald-400
                  "
                />
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium">
                  Rakshith
                </p>

                <p className="text-[10px] text-gray-500">
                  Workspace Admin
                </p>
              </div>
            </motion.button>

          </div>
        </div>

        {/* Bottom glow */}

        <div
          className="
            pointer-events-none
            absolute
            bottom-0
            left-1/2
            h-px
            w-[45%]
            -translate-x-1/2
            bg-gradient-to-r
            from-transparent
            via-indigo-400/30
            to-transparent
          "
        />
      </header>

      {/* ======================================= */}
      {/* COMMAND PALETTE */}
      {/* ======================================= */}

      <AnimatePresence>
        {commandOpen && (
          <motion.div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-start
              justify-center
              bg-black/60
              px-4
              pt-[15vh]
              backdrop-blur-md
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onMouseDown={() =>
              setCommandOpen(false)
            }
          >
            <motion.div
              initial={{
                opacity: 0,
                y: -20,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.96,
              }}
              transition={{
                duration: 0.2,
              }}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
              className="
                w-full
                max-w-2xl
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.1]
                bg-[#0c0d18]/95
                shadow-[0_30px_100px_rgba(0,0,0,0.7)]
                backdrop-blur-3xl
              "
            >

              {/* Search input */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  border-b
                  border-white/[0.07]
                  px-5
                  py-4
                "
              >
                <Search
                  size={20}
                  className="text-indigo-400"
                />

                <input
                  autoFocus
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="What do you want to do?"
                  className="
                    flex-1
                    bg-transparent
                    text-base
                    text-white
                    outline-none
                    placeholder:text-gray-600
                  "
                />

                <button
                  onClick={() =>
                    setCommandOpen(false)
                  }
                  className="
                    rounded-lg
                    p-1.5
                    text-gray-500
                    hover:bg-white/[0.06]
                    hover:text-white
                  "
                >
                  <X size={17} />
                </button>
              </div>

              {/* Commands */}

              <div className="max-h-[420px] overflow-y-auto p-2">

                {filteredCommands.length > 0 ? (
                  filteredCommands.map(
                    (command) => {
                      const Icon =
                        command.icon;

                      return (
                        <button
                          key={command.label}
                          onClick={() =>
                            setCommandOpen(false)
                          }
                          className="
                            group
                            flex
                            w-full
                            items-center
                            gap-4
                            rounded-xl
                            px-4
                            py-3
                            text-left
                            transition
                            hover:bg-white/[0.06]
                          "
                        >
                          <div
                            className="
                              rounded-lg
                              border
                              border-white/[0.07]
                              bg-white/[0.035]
                              p-2
                              text-gray-400
                              transition
                              group-hover:border-indigo-400/20
                              group-hover:bg-indigo-500/10
                              group-hover:text-indigo-300
                            "
                          >
                            <Icon size={17} />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {command.label}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {command.description}
                            </p>
                          </div>

                          <span
                            className="
                              text-xs
                              text-gray-600
                              opacity-0
                              transition
                              group-hover:opacity-100
                            "
                          >
                            Enter
                          </span>
                        </button>
                      );
                    },
                  )
                ) : (
                  <div
                    className="
                      px-6
                      py-12
                      text-center
                    "
                  >
                    <Search
                      size={28}
                      className="
                        mx-auto
                        text-gray-700
                      "
                    />

                    <p className="mt-3 text-sm text-gray-400">
                      No commands found
                    </p>
                  </div>
                )}

              </div>

              {/* Footer */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-white/[0.07]
                  px-5
                  py-3
                  text-[10px]
                  text-gray-600
                "
              >
                <span>
                  Intelligent Workspace
                </span>

                <div className="flex gap-4">
                  <span>↑↓ Navigate</span>
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