
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  type Task,
} from "../../services/task";


interface ProjectTasksProps {
  workspaceId: string;
  projectId: string;
}


const STATUS_OPTIONS = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
];

const PRIORITY_OPTIONS = [
  "low",
  "medium",
  "high",
  "urgent",
];


function formatStatus(status: string) {

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


function formatDate(
  date: string | null,
) {

  if (!date) {
    return "No due date";
  }

  return new Date(date).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
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
        className="text-amber-300"
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


export default function ProjectTasks({
  workspaceId,
  projectId,
}: ProjectTasksProps) {

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("todo");

  const [priority, setPriority] =
    useState("medium");

  const [dueDate, setDueDate] =
    useState("");


  /* ============================================================
     LOAD TASKS
  ============================================================ */

  async function loadTasks() {

    if (!workspaceId || !projectId) {

      setLoading(false);

      setError(
        "Workspace or project is missing.",
      );

      return;
    }


    try {

      setLoading(true);
      setError("");

      const response =
        await getTasks(
          workspaceId,
          projectId,
          {
            search:
              search.trim() || undefined,
            page: 1,
            page_size: 100,
            sort_by: "created_at",
            sort_order: "desc",
          },
        );

      setTasks(response.items);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load tasks. Please try again.",
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workspaceId,
    projectId,
  ]);


  /* ============================================================
     CREATE MODAL
  ============================================================ */

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


  /* ============================================================
     EDIT MODAL
  ============================================================ */

  function openEditModal(
    task: Task,
  ) {

    setEditingTask(task);

    setTitle(task.title);

    setDescription(
      task.description ?? "",
    );

    setStatus(task.status);

    setPriority(task.priority);

    setDueDate(
      task.due_date
        ? task.due_date.slice(0, 10)
        : "",
    );

    setError("");

    setModalOpen(true);
  }


  /* ============================================================
     CLOSE MODAL
  ============================================================ */

  function closeModal() {

    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingTask(null);

    setTitle("");

    setDescription("");

    setStatus("todo");

    setPriority("medium");

    setDueDate("");
  }


  /* ============================================================
     CREATE / UPDATE
  ============================================================ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    const trimmedTitle =
      title.trim();

    const trimmedDescription =
      description.trim();


    if (!trimmedTitle) {

      setError(
        "Task title is required.",
      );

      return;
    }


    try {

      setSaving(true);

      setError("");


      const taskData = {
        title: trimmedTitle,

        description:
          trimmedDescription || null,

        status,

        priority,

        due_date:
          dueDate
            ? new Date(
                `${dueDate}T23:59:59`,
              ).toISOString()
            : null,
      };


      /* UPDATE */

      if (editingTask) {

        const updated =
          await updateTask(
            workspaceId,
            projectId,
            editingTask.id,
            taskData,
          );


        setTasks(
          (current) =>
            current.map(
              (task) =>
                task.id === updated.id
                  ? updated
                  : task,
            ),
        );

      }


      /* CREATE */

      else {

        const created =
          await createTask(
            workspaceId,
            projectId,
            taskData,
          );


        setTasks(
          (current) => [
            created,
            ...current,
          ],
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


  /* ============================================================
     DELETE
  ============================================================ */

  async function handleDelete(
    task: Task,
  ) {

    const confirmed =
      window.confirm(
        `Delete "${task.title}"? This action cannot be undone.`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setError("");


      await deleteTask(
        workspaceId,
        projectId,
        task.id,
      );


      setTasks(
        (current) =>
          current.filter(
            (item) =>
              item.id !== task.id,
          ),
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to delete task.",
      );

    }
  }


  /* ============================================================
     QUICK STATUS UPDATE
  ============================================================ */

  async function handleStatusChange(
    task: Task,
    newStatus: string,
  ) {

    if (task.status === newStatus) {
      return;
    }


    try {

      setError("");


      const updated =
        await updateTask(
          workspaceId,
          projectId,
          task.id,
          {
            status: newStatus,
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


  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {

    return (

      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="flex flex-col items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">

            <Loader2
              size={24}
              className="animate-spin text-indigo-300"
            />

          </div>

          <p className="text-sm text-white/40">
            Loading tasks...
          </p>

        </div>

      </div>
    );
  }


  /* ============================================================
     PAGE
  ============================================================ */

  return (

    <div className="relative mx-auto max-w-[1500px] space-y-8">

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
            window.history.back()
          }
          className="mb-6 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >

          <ArrowLeft size={16} />

          Back to Projects

        </button>


        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
              PROJECT TASKS
            </span>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] md:text-5xl">
              Tasks
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
              Manage tasks, track progress,
              and keep your project moving.
            </p>

          </div>


          {/* NEW TASK */}

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

        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">

          {error}

        </div>

      )}


      {/* SEARCH */}

      <section>

        <div className="relative max-w-xl">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            onKeyDown={(event) => {

              if (
                event.key === "Enter"
              ) {

                loadTasks();

              }

            }}
            placeholder="Search tasks..."
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
          />

        </div>

      </section>


      {/* EMPTY */}

      {tasks.length === 0 && (

        <div className="flex min-h-[45vh] items-center justify-center">

          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.035] p-10 text-center shadow-2xl backdrop-blur-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-indigo-500/10">

              <CheckCircle2
                size={28}
                className="text-indigo-300"
              />

            </div>


            <h2 className="mt-6 text-2xl font-semibold">
              No tasks yet
            </h2>


            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
              Create your first task to start
              working on this project.
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

      )}


      {/* TASK GRID */}

      {tasks.length > 0 && (

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {tasks.map(
            (task) => (

              <div
                key={task.id}
                className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]"
              >

                <div className="relative">

                  {/* TOP */}

                  <div className="flex items-start justify-between">

                    <button
                      type="button"
                      title="Change status"
                      onClick={() => {

                        const currentIndex =
                          STATUS_OPTIONS.indexOf(
                            task.status,
                          );

                        const nextStatus =
                          STATUS_OPTIONS[
                            (
                              currentIndex + 1
                            ) %
                              STATUS_OPTIONS.length
                          ];

                        handleStatusChange(
                          task,
                          nextStatus,
                        );

                      }}
                      className="rounded-xl p-1 transition hover:bg-white/[0.06]"
                    >

                      {getStatusIcon(
                        task.status,
                      )}

                    </button>


                    <div className="flex items-center gap-1">

                      <button
                        type="button"
                        title="Edit task"
                        onClick={() =>
                          openEditModal(
                            task,
                          )
                        }
                        className="rounded-xl p-2 text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                      >

                        <Pencil size={16} />

                      </button>


                      <button
                        type="button"
                        title="Delete task"
                        onClick={() =>
                          handleDelete(
                            task,
                          )
                        }
                        className="rounded-xl p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                      >

                        <Trash2 size={16} />

                      </button>

                    </div>

                  </div>


                  {/* TITLE */}

                  <h2 className="mt-5 text-xl font-semibold">
                    {task.title}
                  </h2>


                  {/* DESCRIPTION */}

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/40">

                    {task.description ||
                      "No task description provided."}

                  </p>


                  {/* META */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/50">

                      {formatStatus(
                        task.status,
                      )}

                    </span>


                    <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">

                      {formatStatus(
                        task.priority,
                      )}

                    </span>

                  </div>


                  {/* FOOTER */}

                  <div className="mt-6 border-t border-white/[0.06] pt-4">

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-white/25">

                        {formatDate(
                          task.due_date,
                        )}

                      </span>


                      {task.assignee_id && (

                        <span className="max-w-[130px] truncate text-xs text-white/30">

                          Assigned

                        </span>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            ),
          )}

        </section>

      )}


      {/* ========================================================
          CREATE / EDIT MODAL
      ======================================================== */}

      {modalOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md">

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
                    ? "Update your task details."
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
                  placeholder="e.g. Build authentication system"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="What needs to be done?"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>


              {/* STATUS */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#15151c] px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                >

                  {STATUS_OPTIONS.map(
                    (option) => (

                      <option
                        key={option}
                        value={option}
                      >
                        {formatStatus(
                          option,
                        )}
                      </option>

                    ),
                  )}

                </select>

              </div>


              {/* PRIORITY */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#15151c] px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                >

                  {PRIORITY_OPTIONS.map(
                    (option) => (

                      <option
                        key={option}
                        value={option}
                      >
                        {formatStatus(
                          option,
                        )}
                      </option>

                    ),
                  )}

                </select>

              </div>


              {/* DUE DATE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Due date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value,
                    )
                  }
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
