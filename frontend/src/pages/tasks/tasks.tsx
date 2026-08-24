import { useEffect, useState } from "react";
import {
  CheckSquare,
  FolderKanban,
  Loader2,
  Plus,
} from "lucide-react";

import {
  getMyWorkspaces,
  type Workspace,
} from "../../services/workspace";

import {
  getProjects,
  type Project,
} from "../../services/project";

import {
  getTasks,
  type Task,
} from "../../services/task";

export default function Tasks() {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loadingWorkspace, setLoadingWorkspace] =
    useState(true);

  const [loadingTasks, setLoadingTasks] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ============================================================
     LOAD WORKSPACE + PROJECTS
  ============================================================ */

  useEffect(() => {
    async function loadWorkspaceAndProjects() {
      try {
        setLoadingWorkspace(true);
        setError("");

        const workspaces =
          await getMyWorkspaces();

        if (workspaces.length === 0) {
          setWorkspace(null);
          setProjects([]);
          setSelectedProject(null);

          setError(
            "No workspace found. Please create a workspace first.",
          );

          return;
        }

        const currentWorkspace =
          workspaces[0];

        setWorkspace(currentWorkspace);

        const projectData =
          await getProjects(
            currentWorkspace.id,
          );

        setProjects(projectData);

        if (projectData.length > 0) {
          setSelectedProject(projectData[0]);
        } else {
          setSelectedProject(null);
        }
      } catch (err) {
        console.error(
          "Failed to load workspace and projects:",
          err,
        );

        setError(
          "Unable to load your workspace and projects.",
        );
      } finally {
        setLoadingWorkspace(false);
      }
    }

    loadWorkspaceAndProjects();
  }, []);

  /* ============================================================
     LOAD TASKS
  ============================================================ */

  useEffect(() => {
    async function loadTasks() {
      if (!workspace || !selectedProject) {
        setTasks([]);
        return;
      }

      try {
        setLoadingTasks(true);
        setError("");

        const response = await getTasks(
          workspace.id,
          selectedProject.id,
          {
            page: 1,
            page_size: 100,
            sort_by: "created_at",
            sort_order: "desc",
          },
        );

        setTasks(response.items);
      } catch (err) {
        console.error(
          "Failed to load tasks:",
          err,
        );

        setTasks([]);

        setError(
          "Unable to load tasks for this project.",
        );
      } finally {
        setLoadingTasks(false);
      }
    }

    loadTasks();
  }, [workspace, selectedProject]);

  /* ============================================================
     LOADING SCREEN
  ============================================================ */

  if (loadingWorkspace) {
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
    <div className="mx-auto max-w-[1500px] space-y-8">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
            <CheckSquare
              size={20}
              className="text-indigo-300"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tasks
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Manage and track your workspace tasks.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] hover:shadow-indigo-500/30"
        >
          <Plus size={17} />
          New Task
        </button>

      </section>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ========================================================
          WORKSPACE
      ======================================================== */}

      {workspace && (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <FolderKanban
                size={18}
                className="text-indigo-300"
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                Workspace
              </p>

              <p className="mt-1 text-lg font-semibold">
                {workspace.name}
              </p>
            </div>

          </div>

        </section>
      )}

      {/* ========================================================
          PROJECT SELECTOR
      ======================================================== */}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6">

        <div className="mb-5">
          <h2 className="text-base font-semibold">
            Project
          </h2>

          <p className="mt-1 text-xs text-white/30">
            Select a project to view its tasks.
          </p>
        </div>

        {projects.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">

            <FolderKanban
              size={28}
              className="mx-auto text-white/20"
            />

            <h3 className="mt-4 text-sm font-medium">
              No projects found
            </h3>

            <p className="mt-2 text-xs text-white/30">
              Create a project before creating tasks.
            </p>

          </div>

        ) : (

          <div className="flex flex-wrap gap-2">

            {projects.map((project) => {

              const isActive =
                selectedProject?.id ===
                project.id;

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    setSelectedProject(project);
                  }}
                  className={`
                    rounded-xl
                    border
                    px-4
                    py-2.5
                    text-sm
                    transition-all
                    ${
                      isActive
                        ? "border-indigo-400/30 bg-indigo-500/15 text-indigo-200 shadow-lg shadow-indigo-500/10"
                        : "border-white/10 bg-white/[0.025] text-white/50 hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
                    }
                  `}
                >
                  {project.name}
                </button>
              );
            })}

          </div>

        )}

      </section>

      {/* ========================================================
          TASK LIST
      ======================================================== */}

      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6">

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold">
              All Tasks
            </h2>

            <p className="mt-1 text-sm text-white/30">
              {selectedProject
                ? `Tasks in ${selectedProject.name}`
                : "Select a project to view tasks."}
            </p>
          </div>

          {selectedProject && (
            <div className="w-fit rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/40">
              {tasks.length}{" "}
              {tasks.length === 1
                ? "task"
                : "tasks"}
            </div>
          )}

        </div>

        {/* ======================================================
            TASK LOADING
        ====================================================== */}

        {loadingTasks ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center">

            <Loader2
              size={25}
              className="animate-spin text-indigo-300"
            />

            <p className="mt-3 text-sm text-white/30">
              Loading project tasks...
            </p>

          </div>

        ) : !selectedProject ? (

          /* ====================================================
             NO PROJECT
          ==================================================== */

          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10">

            <FolderKanban
              size={30}
              className="text-white/20"
            />

            <h3 className="mt-4 text-sm font-medium">
              Select a project
            </h3>

            <p className="mt-2 text-xs text-white/30">
              Choose a project above to view its tasks.
            </p>

          </div>

        ) : tasks.length === 0 ? (

          /* ====================================================
             EMPTY TASKS
          ==================================================== */

          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
              <CheckSquare
                size={24}
                className="text-white/20"
              />
            </div>

            <h3 className="mt-4 text-sm font-medium">
              No tasks yet
            </h3>

            <p className="mt-2 text-xs text-white/30">
              Create your first task to get started.
            </p>

            <button
              type="button"
              className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Plus size={15} />
              Create Task
            </button>

          </div>

        ) : (

          /* ====================================================
             TASKS
          ==================================================== */

          <div className="space-y-3">

            {tasks.map((task) => (

              <div
                key={task.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition-all hover:border-white/[0.14] hover:bg-white/[0.04]"
              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0">

                    <h3 className="truncate font-medium text-white">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/30">
                        {task.description}
                      </p>
                    )}

                  </div>

                  <span className="w-fit shrink-0 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-indigo-300">
                    {formatStatus(task.status)}
                  </span>

                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">

                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] capitalize text-white/40">
                    {task.priority}
                  </span>

                  {task.due_date && (
                    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/30">
                      Due{" "}
                      {formatDate(
                        task.due_date,
                      )}
                    </span>
                  )}

                  {task.labels.length > 0 &&
                    task.labels.map((label) => (
                      <span
                        key={label.id}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/40"
                      >
                        {label.name}
                      </span>
                    ))}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatStatus(
  status: string,
): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(
  date: string,
): string {
  const parsedDate =
    new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString();
}