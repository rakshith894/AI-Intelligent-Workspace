
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  type Project,
} from "../../services/project";


interface ProjectsProps {
  workspaceId: string;
}


export default function Projects({
  workspaceId,
}: ProjectsProps) {

  const navigate = useNavigate();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");


  /* ============================================================
     LOAD PROJECTS
  ============================================================ */

  async function loadProjects() {

    if (!workspaceId) {
      setLoading(false);

      setError(
        "No workspace selected.",
      );

      return;
    }


    try {

      setLoading(true);
      setError("");

      const data =
        await getProjects(workspaceId);

      setProjects(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load projects. Please try again.",
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadProjects();
  }, [workspaceId]);


  /* ============================================================
     CREATE MODAL
  ============================================================ */

  function openCreateModal() {

    setEditingProject(null);

    setName("");

    setDescription("");

    setError("");

    setModalOpen(true);
  }


  /* ============================================================
     EDIT MODAL
  ============================================================ */

  function openEditModal(
    project: Project,
  ) {

    setEditingProject(project);

    setName(project.name);

    setDescription(
      project.description ?? "",
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

    setEditingProject(null);

    setName("");

    setDescription("");
  }


  /* ============================================================
     CREATE / UPDATE
  ============================================================ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();


    if (!trimmedName) {

      setError(
        "Project name is required.",
      );

      return;
    }


    try {

      setSaving(true);

      setError("");


      /* UPDATE */

      if (editingProject) {

        const updated =
          await updateProject(
            workspaceId,
            editingProject.id,
            {
              name: trimmedName,
              description:
                trimmedDescription ||
                undefined,
            },
          );


        setProjects(
          (current) =>
            current.map(
              (project) =>
                project.id ===
                updated.id
                  ? updated
                  : project,
            ),
        );

      }


      /* CREATE */

      else {

        const created =
          await createProject(
            workspaceId,
            {
              name: trimmedName,
              description:
                trimmedDescription ||
                undefined,
            },
          );


        setProjects(
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
        editingProject
          ? "Unable to update project."
          : "Unable to create project.",
      );

    } finally {

      setSaving(false);

    }
  }


  /* ============================================================
     DELETE
  ============================================================ */

  async function handleDelete(
    project: Project,
  ) {

    const confirmed =
      window.confirm(
        `Delete "${project.name}"? This action cannot be undone.`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setError("");


      await deleteProject(
        workspaceId,
        project.id,
      );


      setProjects(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              project.id,
          ),
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to delete project. You may not have permission.",
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
            Loading projects...
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
                PROJECT MANAGEMENT
              </span>

            </div>


            <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
              Projects
            </h1>


            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
              Organize your work into focused
              projects and turn ideas into
              execution.
            </p>

          </div>


          {/* NEW PROJECT */}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
          >

            <Plus size={18} />

            New Project

          </button>

        </div>

      </section>


      {/* ERROR */}

      {error && (

        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">

          {error}

        </div>

      )}


      {/* EMPTY */}

      {projects.length === 0 && (

        <div className="flex min-h-[45vh] items-center justify-center">

          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.035] p-10 text-center shadow-2xl backdrop-blur-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-indigo-500/10">

              <FolderKanban
                size={28}
                className="text-indigo-300"
              />

            </div>


            <h2 className="mt-6 text-2xl font-semibold">
              No projects yet
            </h2>


            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
              Create your first project to start
              organizing work in this workspace.
            </p>


            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.12]"
            >

              <Plus size={17} />

              Create Project

            </button>

          </div>

        </div>

      )}


      {/* PROJECT GRID */}

      {projects.length > 0 && (

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {projects.map(
            (project) => (

              <div
                key={project.id}
                className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]"
              >

                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/[0.06] blur-3xl" />


                <div className="relative">

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045]">

                      <FolderKanban
                        size={19}
                        className="text-indigo-300"
                      />

                    </div>


                    <div className="flex items-center gap-1">

                      {/* EDIT */}

                      <button
                        type="button"
                        title="Edit project"
                        onClick={() =>
                          openEditModal(
                            project,
                          )
                        }
                        className="rounded-xl p-2 text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                      >

                        <Pencil size={16} />

                      </button>


                      {/* DELETE */}

                      <button
                        type="button"
                        title="Delete project"
                        onClick={() =>
                          handleDelete(
                            project,
                          )
                        }
                        className="rounded-xl p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                      >

                        <Trash2 size={16} />

                      </button>

                    </div>

                  </div>


                  <h2 className="mt-6 truncate text-xl font-semibold">
                    {project.name}
                  </h2>


                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/40">

                    {project.description ||
                      "No project description provided."}

                  </p>


                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">

                    <span className="truncate text-xs text-white/25">
                      /{project.slug}
                    </span>


                    {/* OPEN PROJECT */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/projects/${project.id}`,
                        )
                      }
                      className="flex items-center gap-1 text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
                    >

                      Open

                      <ArrowRight
                        size={13}
                      />

                    </button>

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

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">

          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101015] p-7 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between">

              <div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">

                  <FolderKanban
                    size={20}
                    className="text-indigo-300"
                  />

                </div>


                <h2 className="mt-5 text-2xl font-semibold">

                  {editingProject
                    ? "Edit project"
                    : "Create project"}

                </h2>


                <p className="mt-2 text-sm text-white/40">

                  {editingProject
                    ? "Update your project details."
                    : "Add a new project to this workspace."}

                </p>

              </div>


              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >

                <X size={19} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Project name
                </label>


                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. AI Platform"
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
                  placeholder="What is this project about?"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
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
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
