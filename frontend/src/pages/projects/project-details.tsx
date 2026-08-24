import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  type Task,
} from "../../services/task";

import {
  getMyWorkspaces,
  type Workspace,
} from "../../services/workspace";


/* ============================================================
   TYPES
============================================================ */

type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

type TaskPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";


/* ============================================================
   CONSTANTS
============================================================ */

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
}[] = [
  {
    value: "todo",
    label: "To do",
  },
  {
    value: "in_progress",
    label: "In progress",
  },
  {
    value: "in_review",
    label: "In review",
  },
  {
    value: "done",
    label: "Done",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
}[] = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "urgent",
    label: "Urgent",
  },
];


/* ============================================================
   HELPERS
============================================================ */

function getPriorityLabel(
  priority: string,
): string {
  return (
    PRIORITY_OPTIONS.find(
      (item) => item.value === priority,
    )?.label ?? priority
  );
}


function getStatusIcon(
  status: string,
) {
  if (status === "done") {
    return (
      <CheckCircle2
        size={17}
        className="text-emerald-300"
      />
    );
  }

  if (status === "in_progress") {
    return (
      <Clock3
        size={17}
        className="text-blue-300"
      />
    );
  }

  return (
    <Circle
      size={17}
      className="text-white/30"
    />
  );
}


function getPriorityClass(
  priority: string,
): string {
  switch (priority) {
    case "urgent":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "high":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "medium":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

    default:
      return "border-white/10 bg-white/[0.04] text-white/40";
  }
}


/* ============================================================
   COMPONENT
============================================================ */

export default function ProjectDetails() {
  const navigate = useNavigate();

  const { projectId } = useParams<{
    projectId: string;
  }>();


  /* ==========================================================
     WORKSPACE
  ========================================================== */

  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [workspaceLoading, setWorkspaceLoading] =
    useState(true);


  /* ==========================================================
     TASKS
  ========================================================== */

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [totalTasks, setTotalTasks] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const pageSize = 20;


  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingTaskId, setDeletingTaskId] =
    useState<string | null>(null);


  /* ==========================================================
     FILTERS
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");


  /* ==========================================================
     MODAL
  ========================================================== */

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<TaskStatus>("todo");

  const [priority, setPriority] =
    useState<TaskPriority>("medium");

  const [dueDate, setDueDate] =
    useState("");

  const [error, setError] =
    useState("");


  /* ==========================================================
     LOAD WORKSPACE
  ========================================================== */

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setWorkspaceLoading(true);

        const data =
          await getMyWorkspaces();

        if (data.length > 0) {
          setWorkspace(data[0]);
        }
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load workspace.",
        );
      } finally {
        setWorkspaceLoading(false);
      }
    }

    loadWorkspace();
  }, []);


  /* ==========================================================
     LOAD TASKS
  ========================================================== */

  useEffect(() => {
    /*
     * Important:
     * Capture these values after the null/undefined check.
     * This allows TypeScript to safely use them inside
     * the async function below.
     */
    if (!workspace?.id || !projectId) {
      setLoading(false);
      return;
    }

    const workspaceId = workspace.id;
    const currentProjectId = projectId;

    async function loadTasks() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getTasks(
            workspaceId,
            currentProjectId,
            {
              search:
                search.trim() || undefined,

              status:
                statusFilter || undefined,

              priority:
                priorityFilter || undefined,

              page,

              page_size: pageSize,

              sort_by: "created_at",

              sort_order: "desc",
            },
          );

        setTasks(response.items);

        setTotalTasks(response.total);

        setTotalPages(
          response.total_pages,
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load tasks. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [
    workspace?.id,
    projectId,
    search,
    statusFilter,
    priorityFilter,
    page,
  ]);


  /* ==========================================================
     OPEN CREATE MODAL
  ========================================================== */

  function openCreateModal() {
    setEditingTask(null);

    setTitle("");

    setDescription("");

    setStatus("todo");

    setPriority("medium");

    setDueDate("");

    setError("");

    setModalOpen(true);
  }


  /* ==========================================================
     OPEN EDIT MODAL
  ========================================================== */

  function openEditModal(
    task: Task,
  ) {
    setEditingTask(task);

    setTitle(task.title);

    setDescription(
      task.description ?? "",
    );

    setStatus(
      task.status as TaskStatus,
    );

    setPriority(
      task.priority as TaskPriority,
    );

    setDueDate(
      task.due_date
        ? task.due_date.slice(0, 16)
        : "",
    );

    setError("");

    setModalOpen(true);
  }


  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingTask(null);

    setTitle("");

    setDescription("");

    setDueDate("");
  }


  /* ==========================================================
     CREATE / UPDATE TASK
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!workspace?.id || !projectId) {
      setError(
        "Workspace or project is missing.",
      );

      return;
    }

    const workspaceId = workspace.id;
    const currentProjectId = projectId;

    const trimmedTitle =
      title.trim();

    const trimmedDescription =
      description.trim();

    if (trimmedTitle.length < 2) {
      setError(
        "Task title must contain at least 2 characters.",
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

      if (editingTask) {
        const updated =
          await updateTask(
            workspaceId,
            currentProjectId,
            editingTask.id,
            {
              title: trimmedTitle,

              description:
                trimmedDescription ||
                null,

              status,

              priority,

              due_date:
                dueDate
                  ? new Date(
                      dueDate,
                    ).toISOString()
                  : null,
            },
          );

        setTasks(
          (current) =>
            current.map(
              (task) =>
                task.id ===
                updated.id
                  ? updated
                  : task,
            ),
        );
      } else {
        const created =
          await createTask(
            workspaceId,
            currentProjectId,
            {
              title: trimmedTitle,

              description:
                trimmedDescription ||
                null,

              status,

              priority,

              due_date:
                dueDate
                  ? new Date(
                      dueDate,
                    ).toISOString()
                  : null,
            },
          );

        setTasks(
          (current) => [
            created,
            ...current,
          ],
        );

        setTotalTasks(
          (current) =>
            current + 1,
        );
      }

      closeModal();
    } catch (err) {
      console.error(err);

      setError(
        editingTask
          ? "Unable to update task."
          : "Unable to create task.",
      );
    } finally {
      setSaving(false);
    }
  }


  /* ==========================================================
     DELETE TASK
  ========================================================== */

  async function handleDelete(
    task: Task,
  ) {
    if (!workspace?.id || !projectId) {
      return;
    }

    const workspaceId = workspace.id;
    const currentProjectId = projectId;

    const confirmed =
      window.confirm(
        `Delete "${task.title}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(
        task.id,
      );

      setError("");

      await deleteTask(
        workspaceId,
        currentProjectId,
        task.id,
      );

      setTasks(
        (current) =>
          current.filter(
            (item) =>
              item.id !== task.id,
          ),
      );

      setTotalTasks(
        (current) =>
          Math.max(0, current - 1),
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete task.",
      );
    } finally {
      setDeletingTaskId(null);
    }
  }


  /* ==========================================================
     QUICK STATUS CHANGE
  ========================================================== */

  async function handleStatusChange(
    task: Task,
    nextStatus: TaskStatus,
  ) {
    if (!workspace?.id || !projectId) {
      return;
    }

    const workspaceId = workspace.id;
    const currentProjectId = projectId;

    if (task.status === nextStatus) {
      return;
    }

    try {
      const updated =
        await updateTask(
          workspaceId,
          currentProjectId,
          task.id,
          {
            status: nextStatus,
          },
        );

      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id === updated.id
                ? updated
                : item,
          ),
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to change task status.",
      );
    }
  }


  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (workspaceLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={28}
            className="animate-spin text-indigo-300"
          />

          <p className="text-sm text-white/40">
            Loading project...
          </p>
        </div>
      </div>
    );
  }


  /* ==========================================================
     MISSING WORKSPACE
  ========================================================== */

  if (!workspace) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="text-white/50">
            No workspace found.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/projects")
            }
            className="mt-5 rounded-xl bg-white/[0.08] px-5 py-3 text-sm hover:bg-white/[0.12]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }


  /* ==========================================================
     MISSING PROJECT ID
  ========================================================== */

  if (!projectId) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="text-white/50">
            Project ID is missing.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/projects")
            }
            className="mt-5 rounded-xl bg-white/[0.08] px-5 py-3 text-sm hover:bg-white/[0.12]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }


  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-7">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[15%] top-[8%] h-[420px] w-[420px] rounded-full bg-indigo-600/[0.08] blur-[140px]" />

        <div className="absolute right-[5%] top-[25%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.06] blur-[160px]" />
      </div>


      {/* HEADER */}

      <section>
        <button
          type="button"
          onClick={() =>
            navigate("/projects")
          }
          className="mb-6 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />

          Back to Projects
        </button>


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
                PROJECT WORKSPACE
              </span>
            </div>


            <div className="flex items-center gap-3">
              <FolderKanban
                size={28}
                className="text-indigo-300"
              />

              <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
                Project Tasks
              </h1>
            </div>


            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
              Manage tasks, priorities, status and
              deadlines for this project.
            </p>
          </div>


          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
          >
            <Plus size={18} />

            New Task
          </button>
        </div>
      </section>


      {/* ERROR */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="text-red-300/60 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* FILTER BAR */}

      <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4 shadow-xl shadow-black/10 backdrop-blur-2xl">
        <div className="flex flex-col gap-3 lg:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );

                setPage(1);
              }}
              placeholder="Search tasks..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/40"
            />
          </div>


          {/* STATUS */}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value,
                );

                setPage(1);
              }}
              className="h-11 min-w-[170px] appearance-none rounded-xl border border-white/10 bg-black/20 px-4 pr-10 text-sm text-white/60 outline-none focus:border-indigo-400/40"
            >
              <option value="">
                All statuses
              </option>

              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
            />
          </div>


          {/* PRIORITY */}

          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(
                  event.target.value,
                );

                setPage(1);
              }}
              className="h-11 min-w-[170px] appearance-none rounded-xl border border-white/10 bg-black/20 px-4 pr-10 text-sm text-white/60 outline-none focus:border-indigo-400/40"
            >
              <option value="">
                All priorities
              </option>

              {PRIORITY_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
            />
          </div>
        </div>
      </section>


      {/* TASK SUMMARY */}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">
            Tasks
          </p>

          <p className="mt-1 text-xs text-white/30">
            {totalTasks} total task
            {totalTasks === 1
              ? ""
              : "s"}
          </p>
        </div>
      </div>


      {/* TASK LIST */}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              size={26}
              className="animate-spin text-indigo-300"
            />

            <p className="text-sm text-white/40">
              Loading tasks...
            </p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/[0.035] p-10 text-center shadow-2xl backdrop-blur-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-indigo-500/10">
              <CheckCircle2
                size={28}
                className="text-indigo-300"
              />
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              No tasks found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
              Create a task or change your
              search and filters.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.12]"
            >
              <Plus size={17} />

              Create Task
            </button>
          </div>
        </div>
      ) : (
        <section className="space-y-3">
          {tasks.map(
            (task) => (
              <div
                key={task.id}
                className="group rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl transition hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

                  {/* STATUS */}

                  <div className="relative">
                    <select
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(
                          task,
                          event.target.value as TaskStatus,
                        )
                      }
                      className="h-10 appearance-none rounded-xl border border-white/10 bg-black/20 pl-9 pr-9 text-sm text-white/60 outline-none focus:border-indigo-400/40"
                    >
                      {STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>

                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      {getStatusIcon(
                        task.status,
                      )}
                    </div>

                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                    />
                  </div>


                  {/* CONTENT */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-base font-semibold text-white">
                        {task.title}
                      </h2>

                      <span
                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${getPriorityClass(
                          task.priority,
                        )}`}
                      >
                        {getPriorityLabel(
                          task.priority,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/35">
                      {task.description ||
                        "No description provided."}
                    </p>


                    {/* LABELS */}

                    {task.labels.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.labels.map(
                          (label) => (
                            <span
                              key={label.id}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/40"
                            >
                              {label.name}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>


                  {/* DUE DATE */}

                  {task.due_date && (
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <Clock3
                        size={14}
                      />

                      {new Date(
                        task.due_date,
                      ).toLocaleDateString()}
                    </div>
                  )}


                  {/* ACTIONS */}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit task"
                      onClick={() =>
                        openEditModal(
                          task,
                        )
                      }
                      className="rounded-xl p-2.5 text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      title="Delete task"
                      disabled={
                        deletingTaskId ===
                        task.id
                      }
                      onClick={() =>
                        handleDelete(
                          task,
                        )
                      }
                      className="rounded-xl p-2.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                    >
                      {deletingTaskId ===
                      task.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={16}
                        />
                      )}
                    </button>
                  </div>

                </div>
              </div>
            ),
          )}
        </section>
      )}


      {/* PAGINATION */}

      {!loading &&
        totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/50 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>

            <span className="rounded-xl bg-white/[0.05] px-4 py-2 text-sm text-white/60">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/50 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}


      {/* ========================================================
          CREATE / EDIT MODAL
      ======================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101015] p-7 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                  <CheckCircle2
                    size={20}
                    className="text-indigo-300"
                  />
                </div>

                <h2 className="mt-5 text-2xl font-semibold">
                  {editingTask
                    ? "Edit task"
                    : "Create task"}
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  {editingTask
                    ? "Update the task details."
                    : "Add a new task to this project."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Task title
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Implement authentication"
                  disabled={saving}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                />
              </div>


              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe what needs to be done..."
                  disabled={saving}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                />
              </div>


              {/* STATUS + PRIORITY */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as TaskStatus,
                      )
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>


                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value as TaskPriority,
                      )
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                  >
                    {PRIORITY_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>


              {/* DUE DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Due date
                </label>

                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                />
              </div>


              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}