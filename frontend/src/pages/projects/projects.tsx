
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileUp,
  FolderKanban,
  GitBranch,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  type Project,
} from "../../services/project";
import { uploadProjectPackage } from "../../services/attachment";


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

  const [projectUrl, setProjectUrl] =
    useState("");

  // Project Import / Upload State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCustomName, setImportCustomName] = useState("");
  const [importProjectUrl, setImportProjectUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");


  /* ============================================================
     LOAD PROJECTS
  ============================================================ */

  async function loadProjects() {
    if (!workspaceId) {
      setLoading(false);
      setError("No workspace selected.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await getProjects(workspaceId);
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);


  /* ============================================================
     CREATE MODAL
  ============================================================ */

  function openCreateModal() {

    setEditingProject(null);

    setName("");

    setDescription("");

    setProjectUrl("");

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

    setProjectUrl(
      project.project_url ?? "",
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

    setProjectUrl("");
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

    const trimmedUrl =
      projectUrl.trim();


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
                null,
              project_url:
                trimmedUrl ||
                null,
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
              project_url:
                trimmedUrl ||
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


          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setImportFile(null);
                setImportCustomName("");
                setImportProjectUrl("");
                setImportSuccess("");
                setError("");
                setImportModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/90 shadow-xl transition hover:bg-white/10 hover:scale-[1.02]"
            >
              <Upload size={17} className="text-indigo-300" />
              <span>Import / Upload Project</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
            >
              <Plus size={18} />
              New Project
            </button>
          </div>
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

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 shadow-md shadow-indigo-500/10">
                        <FolderKanban size={22} />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ON TRACK
                      </span>
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

                  {/* PROJECT & GITHUB URLS */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {project.project_url && (
                      <a
                        href={
                          project.project_url.startsWith("http")
                            ? project.project_url
                            : `https://${project.project_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`Open Live App: ${project.project_url}`}
                        className="inline-flex max-w-[48%] items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 transition hover:border-indigo-400/50 hover:bg-indigo-500/20 hover:text-indigo-200"
                      >
                        <Globe size={13} className="shrink-0" />
                        <span className="truncate">
                          {project.project_url.replace(/^https?:\/\/(www\.)?/, "")}
                        </span>
                        <ExternalLink size={11} className="shrink-0 opacity-70" />
                      </a>
                    )}

                    {project.github_url && (
                      <a
                        href={
                          project.github_url.startsWith("http")
                            ? project.github_url
                            : `https://${project.github_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`Visit GitHub Repository: ${project.github_url}`}
                        className="inline-flex max-w-[48%] items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200"
                      >
                        <GitBranch size={13} className="shrink-0" />
                        <span className="truncate">
                          {project.github_url.replace(/^https?:\/\/(www\.)?/, "")}
                        </span>
                        <ExternalLink size={11} className="shrink-0 opacity-70" />
                      </a>
                    )}
                  </div>

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
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>


              {/* PROJECT URL / REPOSITORY / LIVE LINK */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Project URL <span className="text-xs font-normal text-white/40">(Optional - GitHub repo, live URL, etc.)</span>
                </label>

                <div className="relative">

                  <Globe
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    type="text"
                    value={projectUrl}
                    onChange={(event) =>
                      setProjectUrl(
                        event.target.value,
                      )
                    }
                    placeholder="https://github.com/username/project or https://myproject.app"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                  />

                </div>

                <p className="mt-1.5 text-xs text-white/35">
                  Link an already built workspace, repository, or deployed application.
                </p>

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

      {/* IMPORT / UPLOAD PROJECT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0c0d18]/95 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                  <FileUp size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Import / Upload Project</h3>
                  <p className="text-xs text-white/40">Upload a project ZIP archive or JSON template</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                disabled={importing}
                className="rounded-xl p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {importSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
                <p className="mt-3 text-sm font-semibold text-white">{importSuccess}</p>
                <p className="mt-1 text-xs text-white/40">Your project has been synthesized into the workspace.</p>
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false);
                    void loadProjects();
                  }}
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-500/20"
                >
                  View in Projects
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!importFile || !workspaceId) return;
                  try {
                    setImporting(true);
                    setError("");
                    const res = await uploadProjectPackage(
                      workspaceId,
                      importFile,
                      importCustomName.trim() || undefined,
                      importProjectUrl.trim() || undefined,
                    );
                    setImportSuccess(res.message);
                    void loadProjects();
                  } catch (err) {
                    console.error(err);
                    setError("Failed to import project package. Ensure it is a valid .zip or .json file.");
                  } finally {
                    setImporting(false);
                  }
                }}
                className="mt-6 space-y-4 text-xs"
              >
                {/* File Dropzone */}
                <div>
                  <label className="mb-2 block font-medium text-white/70">Project File (.zip or .json)</label>
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center cursor-pointer transition hover:border-indigo-400/50 hover:bg-indigo-500/[0.03]">
                    <Upload size={24} className="text-indigo-400" />
                    <span className="mt-2 font-medium text-white/80">
                      {importFile ? importFile.name : "Choose a project file or drag & drop"}
                    </span>
                    <span className="mt-0.5 text-[10px] text-white/40">Supports .zip archives with files/tasks or .json project templates</span>
                    <input
                      type="file"
                      accept=".zip,.json"
                      required
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImportFile(e.target.files[0]);
                          if (!importCustomName) {
                            setImportCustomName(e.target.files[0].name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="mb-1.5 block font-medium text-white/70">Custom Project Name (Optional)</label>
                  <input
                    type="text"
                    value={importCustomName}
                    onChange={(e) => setImportCustomName(e.target.value)}
                    placeholder="e.g. Project Aurora"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-medium text-white/70">Project URL / Live Link (Optional)</label>
                  <input
                    type="text"
                    value={importProjectUrl}
                    onChange={(e) => setImportProjectUrl(e.target.value)}
                    placeholder="e.g. https://github.com/org/repo or https://myproject.app"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    disabled={importing}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-xs font-semibold transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-xs font-semibold text-white shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Importing project...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={15} />
                        <span>Upload & Import</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
