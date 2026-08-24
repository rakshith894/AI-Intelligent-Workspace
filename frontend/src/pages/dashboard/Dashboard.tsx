import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  {
    label: "Active Tasks",
    value: "24",
    change: "+12.5%",
    icon: CheckCircle2,
  },
  {
    label: "Projects",
    value: "08",
    change: "+2 this month",
    icon: FolderKanban,
  },
  {
    label: "Focus Time",
    value: "31.4h",
    change: "+8.2%",
    icon: Clock3,
  },
  {
    label: "Productivity",
    value: "87%",
    change: "+14.8%",
    icon: TrendingUp,
  },
];

const activity = [
  {
    title: "Project Aurora",
    text: "Database architecture completed",
    time: "12 min ago",
  },
  {
    title: "AI Workspace",
    text: "New task assigned to you",
    time: "34 min ago",
  },
  {
    title: "Marketing",
    text: "Sprint deadline updated",
    time: "1 hr ago",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">

      {/* ===================================== */}
      {/* HERO */}
      {/* ===================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 md:p-8">

        {/* Glow */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-indigo-500/15
            blur-[100px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-32
            left-1/3
            h-64
            w-64
            rounded-full
            bg-purple-500/10
            blur-[100px]
          "
        />

        <div className="relative">

          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-300">
              <Sparkles size={16} />
            </div>

            <span className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/70">
              Intelligent Workspace
            </span>
          </div>

          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
            Good morning,{" "}
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Rakshith.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500 md:text-base">
            Your workspace is performing beautifully.
            You have several important tasks waiting
            for your attention today.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">

            <button
              className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-indigo-500
                to-purple-500
                px-5
                py-3
                text-sm
                font-medium
                shadow-[0_0_30px_rgba(99,102,241,0.2)]
                transition
                hover:scale-[1.02]
              "
            >
              <Target size={17} />
              Focus Mode
            </button>

            <button
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/[0.08]
                bg-white/[0.035]
                px-5
                py-3
                text-sm
                text-gray-300
                transition
                hover:bg-white/[0.07]
              "
            >
              View activity
              <ArrowUpRight size={15} />
            </button>

          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/* KPI GRID */}
      {/* ===================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -4,
              }}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.07]
                bg-white/[0.025]
                p-5
                transition
                hover:border-indigo-400/15
                hover:bg-white/[0.04]
              "
            >

              <div
                className="
                  absolute
                  -right-8
                  -top-8
                  h-24
                  w-24
                  rounded-full
                  bg-indigo-500/5
                  blur-2xl
                  transition
                  group-hover:bg-indigo-500/10
                "
              />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2.5 text-gray-400">
                    <Icon size={18} />
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                    <TrendingUp size={12} />
                    {stat.change}
                  </span>

                </div>

                <p className="mt-5 text-xs text-gray-500">
                  {stat.label}
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>

              </div>
            </motion.div>
          );
        })}

      </section>

      {/* ===================================== */}
      {/* MAIN GRID */}
      {/* ===================================== */}

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* Productivity */}

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium">
                Productivity overview
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Your performance over the last 7 days
              </p>
            </div>

            <button className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[10px] text-gray-500 hover:text-white">
              Last 7 days
            </button>

          </div>

          {/* Fake premium chart */}

          <div className="mt-8 flex h-56 items-end gap-3">

            {[42, 58, 48, 72, 65, 88, 76].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <div
                    className="
                      relative
                      w-full
                      overflow-hidden
                      rounded-t-xl
                      bg-gradient-to-t
                      from-indigo-500/20
                      to-purple-400/50
                    "
                    style={{
                      height: `${height}%`,
                    }}
                  >
                    <div
                      className="
                        absolute
                        inset-x-0
                        top-0
                        h-px
                        bg-indigo-300/60
                        shadow-[0_0_12px_rgba(129,140,248,0.8)]
                      "
                    />
                  </div>

                  <span className="text-[10px] text-gray-600">
                    {["M", "T", "W", "T", "F", "S", "S"][index]}
                  </span>
                </div>
              ),
            )}

          </div>
        </div>

        {/* AI Insight */}

        <div className="relative overflow-hidden rounded-2xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.04] to-transparent p-6">

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-52
              w-52
              rounded-full
              bg-purple-500/15
              blur-[80px]
            "
          />

          <div className="relative">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
                <Sparkles size={19} />
              </div>

              <div>
                <p className="text-sm font-medium">
                  AI Insight
                </p>

                <p className="text-[10px] text-gray-500">
                  Workspace intelligence
                </p>
              </div>

            </div>

            <p className="mt-7 text-lg font-medium leading-7">
              You're most productive between{" "}
              <span className="text-indigo-300">
                9 AM and 12 PM.
              </span>
            </p>

            <p className="mt-3 text-xs leading-6 text-gray-500">
              Consider scheduling your highest-priority
              tasks during this window. Your completion
              rate is significantly higher during these
              hours.
            </p>

            <button className="mt-7 flex items-center gap-2 text-xs font-medium text-indigo-300 transition hover:text-indigo-200">
              View AI recommendations
              <ArrowUpRight size={14} />
            </button>

          </div>
        </div>

      </section>

      {/* ===================================== */}
      {/* RECENT ACTIVITY */}
      {/* ===================================== */}

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm font-medium">
              Recent activity
            </p>

            <p className="mt-1 text-xs text-gray-500">
              What's happening across your workspace
            </p>
          </div>

          <button className="text-xs text-gray-500 transition hover:text-white">
            View all
          </button>

        </div>

        <div className="mt-6 divide-y divide-white/[0.05]">

          {activity.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-4"
            >

              <div className="h-9 w-9 rounded-full border border-white/[0.07] bg-white/[0.035] p-2 text-indigo-300">
                <CheckCircle2 size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">
                  {item.title}
                </p>

                <p className="mt-1 truncate text-[11px] text-gray-500">
                  {item.text}
                </p>
              </div>

              <span className="text-[10px] text-gray-600">
                {item.time}
              </span>

            </div>
          ))}

        </div>
      </section>

    </div>
  );
}