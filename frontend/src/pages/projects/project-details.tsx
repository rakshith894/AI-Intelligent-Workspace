
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileIcon,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Tag,
  GitBranch,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  type Task,
} from "../../services/task";

import {
  getProject,
  updateProject,
  type Project,
} from "../../services/project";

import {
  createLabel,
  deleteLabel,
  getLabels,
  attachLabel,
  removeLabel,
  type Label,
} from "../../services/label";

import {
  getMyWorkspaces,
  type Workspace,
} from "../../services/workspace";

import {
  deleteAttachment,
  getAttachmentDownloadUrl,
  getProjectAttachments,
  uploadAttachment,
  type Attachment,
} from "../../services/attachment";


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

const LABEL_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

const PAGE_SIZE = 20;


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

    case "low":
    default:
      return "border-white/10 bg-white/[0.04] text-white/40";
  }
}


function normalizeLabelColor(
  color: string,
): string {
  const value = color.trim().toLowerCase();

  const namedColors: Record<string, string> = {
    blue: "#3b82f6",
    indigo: "#6366f1",
    violet: "#8b5cf6",
    purple: "#a855f7",
    pink: "#ec4899",
    red: "#ef4444",
    orange: "#f97316",
    yellow: "#eab308",
    green: "#22c55e",
    emerald: "#10b981",
    teal: "#14b8a6",
    cyan: "#06b6d4",
    sky: "#0ea5e9",
  };

  if (namedColors[value]) {
    return namedColors[value];
  }

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const r = value[1];
    const g = value[2];
    const b = value[3];

    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return "#6366f1";
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
     WORKSPACE & PROJECT
  ========================================================== */

  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [workspaceLoading, setWorkspaceLoading] =
    useState(true);

  const [project, setProject] =
    useState<Project | null>(null);

  const [projectLoading, setProjectLoading] =
    useState(true);

  const [projectUrlModalOpen, setProjectUrlModalOpen] =
    useState(false);

  const [editUrlInput, setEditUrlInput] =
    useState("");

  const [savingUrl, setSavingUrl] =
    useState(false);


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


  /* ==========================================================
     LABELS
  ========================================================== */

  const [labels, setLabels] =
    useState<Label[]>([]);

  const [labelsLoading, setLabelsLoading] =
    useState(false);

  const [labelFilter, setLabelFilter] =
    useState("");

  const [labelActionKey, setLabelActionKey] =
    useState<string | null>(null);


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
     TABS & ATTACHMENTS
  ========================================================== */

  const [activeTab, setActiveTab] = useState<"tasks" | "files" | "url">("tasks");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Feature 1: Drag & drop state for the file dropzone
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Feature 3: Bulk upload progress tracking
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);

  // Feature 4: Image preview modal
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalName, setPreviewModalName] = useState<string>("");

  // Feature 5: File search and sort
  const [fileSearch, setFileSearch] = useState("");
  const [fileSort, setFileSort] = useState<
    "date_desc" | "date_asc" | "name_asc" | "name_desc" | "size_desc" | "size_asc"
  >("date_desc");

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [searchInput, setSearchInput] =
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

  const [selectedLabelIds, setSelectedLabelIds] =
    useState<string[]>([]);


  /* ==========================================================
     CREATE LABEL
  ========================================================== */

  const [newLabelName, setNewLabelName] =
    useState("");

  const [newLabelColor, setNewLabelColor] =
    useState(LABEL_COLORS[0]);

  const [creatingLabel, setCreatingLabel] =
    useState(false);


  /* ==========================================================
     ERROR
  ========================================================== */

  const [error, setError] =
    useState("");


  /* ==========================================================
     REQUEST VERSION
  ========================================================== */

  /*
   * Prevents an older API response from overwriting
   * newer task data.
   */
  const taskRequestVersion =
    useRef(0);


  /* ==========================================================
     LOAD WORKSPACE & PROJECT
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      try {
        setWorkspaceLoading(true);
        setError("");

        const data = await getMyWorkspaces();

        if (!mounted) {
          return;
        }

        if (data.length === 0) {
          setWorkspace(null);
          setError("No workspace found.");
          return;
        }

        // Try to find the exact workspace containing this project
        let matchingWs = data[0];
        if (projectId) {
          for (const ws of data) {
            try {
              const p = await getProject(ws.id, projectId);
              if (p && mounted) {
                matchingWs = ws;
                setProject(p);
                break;
              }
            } catch {
              // try next workspace
            }
          }
        }

        if (mounted) {
          setWorkspace(matchingWs);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setWorkspace(null);
          setError("Unable to load workspace.");
        }
      } finally {
        if (mounted) {
          setWorkspaceLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      mounted = false;
    };
  }, [projectId]);


  /* ==========================================================
     LOAD LABELS
  ========================================================== */

  useEffect(() => {
    if (!workspace?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabels([]);
      return;
    }

    const workspaceId = workspace.id;
    let mounted = true;

    async function loadLabels() {
      try {
        setLabelsLoading(true);

        const data =
          await getLabels(workspaceId);

        if (mounted) {
          setLabels(
            [...data].sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name,
                ),
            ),
          );
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "Unable to load workspace labels.",
          );
        }
      } finally {
        if (mounted) {
          setLabelsLoading(false);
        }
      }
    }

    void loadLabels();

    return () => {
      mounted = false;
    };
  }, [workspace?.id]);


  /* ==========================================================
     LOAD TASKS
  ========================================================== */

  const loadTasks = useCallback(
    async (
      options?: {
        showLoading?: boolean;
      },
    ) => {
      if (!workspace?.id || !projectId) {
        setTasks([]);
        setTotalTasks(0);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      const requestVersion =
        ++taskRequestVersion.current;

      try {
        if (
          options?.showLoading ??
          true
        ) {
          setLoading(true);
        }

        setError("");

        const response =
          await getTasks(
            workspace.id,
            projectId,
            {
              search:
                search.trim() ||
                undefined,

              status:
                statusFilter ||
                undefined,

              priority:
                priorityFilter ||
                undefined,

              label_id:
                labelFilter ||
                undefined,

              page,

              page_size: PAGE_SIZE,

              sort_by: "created_at",

              sort_order: "desc",
            },
          );

        /*
         * Ignore stale responses.
         */
        if (
          requestVersion !==
          taskRequestVersion.current
        ) {
          return;
        }

        setTasks(response.items);

        setTotalTasks(
          response.total,
        );

        setTotalPages(
          response.total_pages,
        );
      } catch (err) {
        console.error(err);

        if (
          requestVersion ===
          taskRequestVersion.current
        ) {
          setError(
            "Unable to load tasks. Please try again.",
          );
        }
      } finally {
        if (
          requestVersion ===
          taskRequestVersion.current
        ) {
          setLoading(false);
        }
      }
    },
    [
      workspace,
      projectId,
      search,
      statusFilter,
      priorityFilter,
      labelFilter,
      page,
    ],
  );


  /* ==========================================================
     LOAD PROJECT
  ========================================================== */

  const loadProject = useCallback(async () => {
    if (!workspace?.id || !projectId) return;
    try {
      setProjectLoading(true);
      const data = await getProject(workspace.id, projectId);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setProjectLoading(false);
    }
  }, [workspace, projectId]);


  /* ==========================================================
     UPDATE PROJECT URL
  ========================================================== */

  async function handleUpdateProjectUrl(newUrl: string) {
    if (!workspace?.id || !projectId) return;
    try {
      setSavingUrl(true);
      const trimmed = newUrl.trim();
      const updated = await updateProject(workspace.id, projectId, {
        project_url: trimmed ? trimmed : null,
      });
      setProject(updated);
      setProjectUrlModalOpen(false);
    } catch (err) {
      console.error("Failed to update project URL:", err);
      alert("Failed to update project URL.");
    } finally {
      setSavingUrl(false);
    }
  }

  function handleCopyProjectUrl() {
    if (!project?.project_url) return;
    const fullUrl = project.project_url.startsWith("http")
      ? project.project_url
      : `https://${project.project_url}`;
    void navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }


  /* ==========================================================
     LOAD ATTACHMENTS
  ========================================================== */

  const loadAttachments = useCallback(async () => {
    if (!workspace?.id || !projectId) return;
    try {
      setLoadingAttachments(true);
      const res = await getProjectAttachments(workspace.id, projectId);
      setAttachments(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttachments(false);
    }
  }, [workspace, projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProject();
    void loadTasks();
    void loadAttachments();
  }, [loadProject, loadTasks, loadAttachments]);

  // Feature 3: Bulk multi-file upload handler
  async function handleUploadFiles(files: FileList | File[]) {
    if (!workspace?.id || !projectId) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingFile(true);
    setUploadError("");
    setUploadingCount(0);
    setUploadTotal(fileArray.length);

    const errors: string[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      try {
        setUploadingCount(i + 1);
        const created = await uploadAttachment(workspace.id, projectId, fileArray[i]);
        setAttachments((prev) => [created, ...prev]);
      } catch (err) {
        console.error(err);
        errors.push(fileArray[i].name);
      }
    }

    setUploadingFile(false);
    setUploadingCount(0);
    setUploadTotal(0);
    if (errors.length > 0) {
      setUploadError(`Failed to upload: ${errors.join(", ")}`);
    }
  }



  // Feature 1: Drag & drop handlers for the project files dropzone
  function handleFilesDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  }

  function handleFilesDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  }

  function handleFilesDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      void handleUploadFiles(files);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!workspace?.id) return;
    const confirmed = window.confirm("Delete this attachment?");
    if (!confirmed) return;
    try {
      await deleteAttachment(workspace.id, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete attachment.");
    }
  }


  /* ==========================================================
     SEARCH DEBOUNCE
  ========================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setSearch(
          searchInput.trim(),
        );

        setPage(1);
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);


  /* ==========================================================
     RESET FORM
  ========================================================== */

  function resetForm() {
    setEditingTask(null);

    setTitle("");

    setDescription("");

    setStatus("todo");

    setPriority("medium");

    setDueDate("");

    setSelectedLabelIds([]);

    setNewLabelName("");

    setNewLabelColor(
      LABEL_COLORS[0],
    );
  }


  /* ==========================================================
     OPEN CREATE
  ========================================================== */

  function openCreateModal() {
    resetForm();

    setError("");

    setModalOpen(true);
  }


  /* ==========================================================
     OPEN EDIT
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

    setSelectedLabelIds(
      task.labels.map(
        (label) => label.id,
      ),
    );

    setNewLabelName("");

    setNewLabelColor(
      LABEL_COLORS[0],
    );

    setError("");

    setModalOpen(true);
  }


  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  function closeModal() {
    if (
      saving ||
      creatingLabel
    ) {
      return;
    }

    setModalOpen(false);

    resetForm();
  }


  /* ==========================================================
     TOGGLE LABEL
  ========================================================== */

  function toggleLabel(
    labelId: string,
  ) {
    setSelectedLabelIds(
      (current) =>
        current.includes(labelId)
          ? current.filter(
              (id) =>
                id !== labelId,
            )
          : [
              ...current,
              labelId,
            ],
    );
  }


  /* ==========================================================
     CREATE LABEL
  ========================================================== */

  async function handleCreateLabel() {
    if (!workspace?.id) {
      return;
    }

    const trimmedName =
      newLabelName.trim();

    if (!trimmedName) {
      setError(
        "Enter a label name.",
      );
      return;
    }

    if (trimmedName.length > 50) {
      setError(
        "Label name cannot exceed 50 characters.",
      );
      return;
    }

    try {
      setCreatingLabel(true);
      setError("");

      const created =
        await createLabel(
          workspace.id,
          {
            name: trimmedName,
            color: newLabelColor,
          },
        );

      setLabels(
        (current) => {
          const exists =
            current.some(
              (label) =>
                label.id ===
                created.id,
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            created,
          ].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
              ),
          );
        },
      );

      setSelectedLabelIds(
        (current) =>
          current.includes(
            created.id,
          )
            ? current
            : [
                ...current,
                created.id,
              ],
      );

      setNewLabelName("");

      setNewLabelColor(
        LABEL_COLORS[0],
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to create label. It may already exist or you may not have permission.",
      );
    } finally {
      setCreatingLabel(false);
    }
  }


  /* ==========================================================
     DELETE LABEL
  ========================================================== */

  async function handleDeleteLabel(
    labelId: string,
    event?: React.MouseEvent,
  ) {
    if (event) {
      event.stopPropagation();
    }

    if (!workspace?.id) {
      return;
    }

    try {
      setError("");

      await deleteLabel(
        workspace.id,
        labelId,
      );

      setLabels(
        (current) =>
          current.filter(
            (label) =>
              label.id !== labelId,
          ),
      );

      setSelectedLabelIds(
        (current) =>
          current.filter(
            (id) =>
              id !== labelId,
          ),
      );

      setTasks(
        (current) =>
          current.map((task) => ({
            ...task,
            labels: task.labels.filter(
              (l) => l.id !== labelId,
            ),
          })),
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete label. Please try again.",
      );
    }
  }


  /* ==========================================================
     SYNC LABELS
  ========================================================== */

  async function syncTaskLabels(
    taskId: string,
    oldLabelIds: string[],
    newLabelIds: string[],
    workspaceId: string,
    currentProjectId: string,
  ) {
    const oldSet =
      new Set(oldLabelIds);

    const newSet =
      new Set(newLabelIds);

    const labelsToAttach =
      newLabelIds.filter(
        (id) =>
          !oldSet.has(id),
      );

    const labelsToRemove =
      oldLabelIds.filter(
        (id) =>
          !newSet.has(id),
      );

    await Promise.all(
      labelsToAttach.map(
        (labelId) =>
          attachLabel(
            workspaceId,
            currentProjectId,
            taskId,
            labelId,
          ),
      ),
    );

    await Promise.all(
      labelsToRemove.map(
        (labelId) =>
          removeLabel(
            workspaceId,
            currentProjectId,
            taskId,
            labelId,
          ),
      ),
    );
  }


  /* ==========================================================
     REFRESH TASK
  ========================================================== */

  async function refreshTask(
    taskId: string,
    workspaceId: string,
    currentProjectId: string,
  ): Promise<Task> {
    return getTask(
      workspaceId,
      currentProjectId,
      taskId,
    );
  }


  /* ==========================================================
     CREATE / UPDATE TASK
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !workspace?.id ||
      !projectId
    ) {
      setError(
        "Workspace or project is missing.",
      );
      return;
    }

    const workspaceId =
      workspace.id;

    const currentProjectId =
      projectId;

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

      let savedTask: Task;

      let oldLabelIds: string[] = [];

      const isEditing =
        Boolean(editingTask);

      /*
       * First save the actual task.
       */
      if (editingTask) {
        oldLabelIds =
          editingTask.labels.map(
            (label) =>
              label.id,
          );

        savedTask =
          await updateTask(
            workspaceId,
            currentProjectId,
            editingTask.id,
            {
              title:
                trimmedTitle,

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
      } else {
        savedTask =
          await createTask(
            workspaceId,
            currentProjectId,
            {
              title:
                trimmedTitle,

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
      }

      /*
       * Then synchronize labels.
       */
      try {
        await syncTaskLabels(
          savedTask.id,
          oldLabelIds,
          selectedLabelIds,
          workspaceId,
          currentProjectId,
        );
      } catch (labelError) {
        console.error(
          labelError,
        );

        /*
         * The task itself was successfully
         * saved. Keep the user informed instead
         * of pretending the whole operation failed.
         */
        setError(
          isEditing
            ? "Task was saved, but some label changes could not be applied."
            : "Task was created, but some labels could not be applied.",
        );
      }

      /*
       * Always fetch the authoritative task
       * after mutation.
       */
      try {
        await refreshTask(
          savedTask.id,
          workspaceId,
          currentProjectId,
        );
      } catch (refreshError) {
        console.error(
          refreshError,
        );
      }

      /*
       * Close the modal regardless of whether
       * label synchronization partially failed.
       *
       * The task itself has already been saved.
       */
      setModalOpen(false);
      resetForm();

      /*
       * Re-read the current paginated result.
       *
       * This prevents:
       * - wrong page counts
       * - stale filters
       * - tasks appearing where they shouldn't
       * - incorrect ordering
       */
      await loadTasks({
        showLoading: false,
      });
    } catch (err) {
      console.error(err);

      setError(
        editingTask
          ? "Unable to update the task. Please try again."
          : "Unable to create the task. Please try again.",
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
    if (
      !workspace?.id ||
      !projectId
    ) {
      return;
    }

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
        workspace.id,
        projectId,
        task.id,
      );

      /*
       * If the last item on the current page
       * was deleted, move back one page.
       */
      if (
        tasks.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1,
        );
      } else {
        await loadTasks({
          showLoading: false,
        });
      }
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
    if (
      !workspace?.id ||
      !projectId ||
      task.status === nextStatus
    ) {
      return;
    }

    try {
      setError("");

      await updateTask(
        workspace.id,
        projectId,
        task.id,
        {
          status: nextStatus,
        },
      );

      /*
       * Reload from backend so filters,
       * ordering and pagination stay correct.
       */
      await loadTasks({
        showLoading: false,
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to change task status.",
      );
    }
  }


  /* ==========================================================
     ADD LABEL
  ========================================================== */

  async function handleInlineAddLabel(
    task: Task,
    labelId: string,
  ) {
    if (
      !workspace?.id ||
      !projectId ||
      !labelId
    ) {
      return;
    }

    const alreadyAttached =
      task.labels.some(
        (label) =>
          label.id === labelId,
      );

    if (alreadyAttached) {
      return;
    }

    const actionKey =
      `add-${task.id}-${labelId}`;

    try {
      setLabelActionKey(
        actionKey,
      );

      setError("");

      await attachLabel(
        workspace.id,
        projectId,
        task.id,
        labelId,
      );

      /*
       * Refresh only the task for a
       * responsive inline operation.
       */
      const refreshed =
        await refreshTask(
          task.id,
          workspace.id,
          projectId,
        );

      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id === task.id
                ? refreshed
                : item,
          ),
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to add label to task.",
      );
    } finally {
      setLabelActionKey(null);
    }
  }


  /* ==========================================================
     REMOVE LABEL
  ========================================================== */

  async function handleInlineRemoveLabel(
    task: Task,
    labelId: string,
  ) {
    if (
      !workspace?.id ||
      !projectId
    ) {
      return;
    }

    const actionKey =
      `remove-${task.id}-${labelId}`;

    try {
      setLabelActionKey(
        actionKey,
      );

      setError("");

      await removeLabel(
        workspace.id,
        projectId,
        task.id,
        labelId,
      );

      /*
       * Refresh only the task.
       */
      const refreshed =
        await refreshTask(
          task.id,
          workspace.id,
          projectId,
        );

      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id === task.id
                ? refreshed
                : item,
          ),
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to remove label from task.",
      );
    } finally {
      setLabelActionKey(null);
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
            className="mt-5 rounded-xl bg-white/[0.08] px-5 py-3 text-sm transition hover:bg-white/[0.12]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }


  /* ==========================================================
     MISSING PROJECT
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
            className="mt-5 rounded-xl bg-white/[0.08] px-5 py-3 text-sm transition hover:bg-white/[0.12]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }


  /* ============================================================
     PAGE
  ============================================================ */

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

            <div className="flex flex-wrap items-center gap-3">
              <FolderKanban
                size={28}
                className="text-indigo-300 shrink-0"
              />

              <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                {projectLoading ? "Loading project..." : project?.name || "Project Tasks"}
              </h1>

              {project?.slug && (
                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/40">
                  /{project.slug}
                </span>
              )}
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 md:text-base">
              {project?.description ||
                "Manage tasks, priorities, labels, status and deadlines for this project."}
            </p>

            {/* PROJECT URL BADGE */}
            {project?.project_url && (
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={
                    project.project_url.startsWith("http")
                      ? project.project_url
                      : `https://${project.project_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open external project URL: ${project.project_url}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 transition hover:border-indigo-400/50 hover:bg-indigo-500/20 hover:text-indigo-200 shadow-md shadow-indigo-500/10"
                >
                  <Globe size={14} className="shrink-0" />
                  <span className="max-w-[260px] truncate">
                    {project.project_url.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                  <ExternalLink size={12} className="shrink-0 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setEditUrlInput(project?.project_url || "");
                    setProjectUrlModalOpen(true);
                  }}
                  title="Change or update project URL"
                  className="rounded-xl p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ATTACH / EDIT URL BUTTON (if not already set or for quick access) */}
            {!project?.project_url ? (
              <button
                type="button"
                onClick={() => {
                  setEditUrlInput(project?.project_url || "");
                  setProjectUrlModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-300"
              >
                <Globe size={14} />
                <span>Add Project URL</span>
              </button>
            ) : (
              <a
                href={
                  project.project_url.startsWith("http")
                    ? project.project_url
                    : `https://${project.project_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-emerald-500/20 transition hover:scale-[1.02]"
              >
                <Globe size={14} />
                <span>Open Project URL</span>
                <ExternalLink size={12} />
              </a>
            )}

            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === "tasks"
                    ? "bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/10"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <FolderKanban size={15} />
                <span>Tasks ({totalTasks})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("files")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === "files"
                    ? "bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/10"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Paperclip size={15} />
                <span>Files & Attachments ({attachments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === "url"
                    ? "bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/10"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Globe size={15} />
                <span>Live URL & App</span>
                {project?.project_url && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            {activeTab === "tasks" && (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
              >
                <Plus size={18} />
                New Task
              </button>
            )}

            {/* Git Connect Button */}
            <button
              type="button"
              onClick={() => {
                setEditUrlInput(project?.project_url || "");
                setProjectUrlModalOpen(true);
              }}
              title={
                project?.project_url
                  ? `Git Connected: ${project.project_url}`
                  : "Connect Git repository or URL to this project"
              }
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition ${
                project?.project_url
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/50"
              }`}
            >
              <GitBranch size={15} />
              <span>{project?.project_url ? "Git Connected" : "Git Connect"}</span>
              {project?.project_url && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
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

      {/* ==========================================================
         FILES & ATTACHMENTS VIEW
      ========================================================== */}
      {activeTab === "files" && (
        <section className="space-y-6">

          {/* Feature 4: Image Preview Modal */}
          {previewModalUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
              onClick={() => setPreviewModalUrl(null)}
            >
              <div
                className="relative max-h-[90vh] max-w-[90vw] rounded-2xl border border-white/10 bg-black/60 p-2 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(null)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/70 backdrop-blur-sm hover:bg-black/80 hover:text-white"
                >
                  <X size={16} />
                </button>
                <img
                  src={previewModalUrl}
                  alt={previewModalName}
                  className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
                />
                <p className="mt-2 text-center text-xs text-white/50">{previewModalName}</p>
              </div>
            </div>
          )}

          {/* File Upload Dropzone — Feature 1: Drag & Drop, Feature 3: multi */}
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl backdrop-blur-2xl">
            <h3 className="text-base font-semibold text-white">Upload Files & Attachments</h3>
            <p className="mt-1 text-xs text-white/40">Drag & drop or select multiple files — specs, screenshots, docs, or project artifacts.</p>

            {uploadError && (
              <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.05] p-3 text-xs text-rose-300">
                {uploadError}
              </div>
            )}

            <label
              className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                isDraggingFiles
                  ? "border-indigo-400/80 bg-indigo-500/[0.10] shadow-[0_0_30px_rgba(99,102,241,0.25)]"
                  : "border-white/15 bg-white/[0.02] hover:border-indigo-400/50 hover:bg-indigo-500/[0.04]"
              }`}
              onDragOver={handleFilesDragOver}
              onDragLeave={handleFilesDragLeave}
              onDrop={handleFilesDrop}
            >
              {uploadingFile ? (
                <>
                  <Loader2 size={28} className="animate-spin text-indigo-400" />
                  <span className="mt-3 text-sm font-semibold text-white">
                    {uploadTotal > 1
                      ? `Uploading file ${uploadingCount} of ${uploadTotal}...`
                      : "Uploading file..."}
                  </span>
                  {uploadTotal > 1 && (
                    <div className="mt-3 h-1.5 w-48 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-indigo-400 transition-all"
                        style={{ width: `${(uploadingCount / uploadTotal) * 100}%` }}
                      />
                    </div>
                  )}
                </>
              ) : isDraggingFiles ? (
                <>
                  <Upload size={32} className="text-indigo-300" />
                  <span className="mt-3 text-sm font-semibold text-indigo-200">Release to upload</span>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-indigo-400" />
                  <span className="mt-3 text-sm font-semibold text-white">Click or drag & drop files here</span>
                  <span className="mt-1 text-xs text-white/40">Select multiple files at once — images, PDFs, ZIP archives, code, docs (up to 100MB)</span>
                </>
              )}
              <input
                type="file"
                multiple
                disabled={uploadingFile}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    void handleUploadFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>

          {/* Files List — Features 5 (search/sort) + 4 (thumbnails) */}
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl backdrop-blur-2xl">
            {/* Header + search/sort controls */}
            <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Project Files
                  <span className="ml-2 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white/50">
                    {fileSearch
                      ? `${attachments.filter((a) => a.filename.toLowerCase().includes(fileSearch.toLowerCase())).length} of ${attachments.length}`
                      : attachments.length}
                  </span>
                </h3>
                <p className="text-xs text-white/40">All documents and attachments for this project</p>
              </div>

              {/* Feature 5: Search + Sort controls */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Search files..."
                      className="h-9 w-44 rounded-xl border border-white/10 bg-black/20 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-indigo-400/40"
                    />
                    {fileSearch && (
                      <button
                        type="button"
                        onClick={() => setFileSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <select
                      value={fileSort}
                      onChange={(e) => setFileSort(e.target.value as typeof fileSort)}
                      className="h-9 appearance-none rounded-xl border border-white/10 bg-[#111116] pl-8 pr-8 text-xs text-white outline-none focus:border-indigo-400/40"
                    >
                      <option value="date_desc">Newest first</option>
                      <option value="date_asc">Oldest first</option>
                      <option value="name_asc">Name A–Z</option>
                      <option value="name_desc">Name Z–A</option>
                      <option value="size_desc">Largest first</option>
                      <option value="size_asc">Smallest first</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                  </div>
                </div>
              )}
            </div>

            {loadingAttachments ? (
              <div className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-indigo-300 mx-auto" />
                <p className="mt-2 text-xs text-white/40">Loading attachments...</p>
              </div>
            ) : attachments.length === 0 ? (
              <div className="py-12 text-center">
                <FileIcon size={32} className="mx-auto text-white/20" />
                <p className="mt-3 text-sm font-medium text-white/60">No files attached yet</p>
                <p className="mt-1 text-xs text-white/30">Upload project documents or packages above.</p>
              </div>
            ) : (() => {
              // Feature 5: Apply search filter
              const filtered = attachments.filter((a) =>
                fileSearch ? a.filename.toLowerCase().includes(fileSearch.toLowerCase()) : true
              );

              // Feature 5: Apply sort
              const sorted = [...filtered].sort((a, b) => {
                switch (fileSort) {
                  case "date_asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  case "name_asc": return a.filename.localeCompare(b.filename);
                  case "name_desc": return b.filename.localeCompare(a.filename);
                  case "size_desc": return b.file_size - a.file_size;
                  case "size_asc": return a.file_size - b.file_size;
                  default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
              });

              if (sorted.length === 0) {
                return (
                  <div className="py-12 text-center">
                    <Search size={28} className="mx-auto text-white/20" />
                    <p className="mt-3 text-sm text-white/50">No files match "{fileSearch}"</p>
                    <button
                      type="button"
                      onClick={() => setFileSearch("")}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Clear search
                    </button>
                  </div>
                );
              }

              return (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sorted.map((att) => {
                    const sizeKB = Math.round(att.file_size / 1024);
                    const sizeText = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
                    const downloadUrl = workspace?.id ? getAttachmentDownloadUrl(workspace.id, att.id) : "#";
                    // Feature 4: detect images
                    const isImage = att.content_type.startsWith("image/");
                    const thumbUrl = isImage && workspace?.id ? downloadUrl : null;

                    return (
                      <div
                        key={att.id}
                        className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden transition hover:border-indigo-400/30 hover:bg-white/[0.05]"
                      >
                        {/* Feature 4: Image thumbnail or file icon */}
                        {thumbUrl ? (
                          <div
                            className="relative h-36 w-full cursor-zoom-in overflow-hidden bg-black/20"
                            onClick={() => {
                              setPreviewModalUrl(thumbUrl);
                              setPreviewModalName(att.filename);
                            }}
                          >
                            <img
                              src={thumbUrl}
                              alt={att.filename}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                              <Eye size={24} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-20 w-full items-center justify-center bg-white/[0.02]">
                            <FileText size={32} className="text-indigo-300/40" />
                          </div>
                        )}

                        <div className="flex flex-col gap-3 p-4">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isImage ? "bg-purple-500/15 text-purple-300" : "bg-indigo-500/15 text-indigo-300"}`}>
                              {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-white" title={att.filename}>
                                {att.filename}
                              </p>
                              <p className="mt-0.5 text-[10px] text-white/40">
                                {sizeText} • {new Date(att.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
                            <a
                              href={downloadUrl}
                              download={att.filename}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => void handleDeleteAttachment(att.id)}
                              className="rounded-xl p-1.5 text-rose-400/60 transition hover:bg-rose-500/10 hover:text-rose-300"
                              title="Delete file"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ==========================================================
         LIVE URL & APP VIEW
      ========================================================== */}
      {activeTab === "url" && (
        <section className="space-y-6">
          {project?.project_url ? (
            <>
              {/* URL Control Bar */}
              <div className="flex flex-col gap-4 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                    <Globe size={20} className="text-indigo-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                        Live Project Attached
                      </span>
                    </div>
                    <a
                      href={
                        project.project_url.startsWith("http")
                          ? project.project_url
                          : `https://${project.project_url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-sm font-medium text-white transition hover:text-indigo-300"
                    >
                      {project.project_url}
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyProjectUrl}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    {copiedUrl ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIframeKey((k) => k + 1)}
                    title="Reload live preview frame"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    <RefreshCw size={14} />
                    <span>Reload Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditUrlInput(project.project_url || "");
                      setProjectUrlModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Pencil size={13} />
                    <span>Edit URL</span>
                  </button>

                  <a
                    href={
                      project.project_url.startsWith("http")
                        ? project.project_url
                        : `https://${project.project_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02]"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Embedded Frame Viewport */}
              <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0c0c10] shadow-2xl">
                {/* Browser top-bar chrome */}
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/50" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="flex max-w-md flex-1 items-center justify-center">
                    <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
                      <Globe size={12} className="text-white/40" />
                      <span className="truncate">{project.project_url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <button
                      type="button"
                      onClick={() => setIframeKey((k) => k + 1)}
                      className="rounded-lg p-1 transition hover:bg-white/10 hover:text-white"
                      title="Refresh"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                {/* Frame container */}
                <div className="relative min-h-[580px] w-full bg-[#08080c]">
                  <iframe
                    key={iframeKey}
                    src={
                      project.project_url.startsWith("http")
                        ? project.project_url
                        : `https://${project.project_url}`
                    }
                    title="Live Project Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    className="h-[650px] w-full border-0"
                  />
                </div>

                {/* Footnote */}
                <div className="border-t border-white/[0.06] bg-black/30 px-6 py-3 text-xs text-white/40 flex items-center justify-between">
                  <span>
                    Note: Some websites and repositories (like GitHub) restrict direct framing via CSP or X-Frame-Options headers.
                  </span>
                  <a
                    href={
                      project.project_url.startsWith("http")
                        ? project.project_url
                        : `https://${project.project_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-300 hover:underline shrink-0 ml-4"
                  >
                    Open directly <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                <Globe size={30} className="text-indigo-300" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">No Live URL Attached</h3>
              <p className="mt-2 max-w-md text-sm text-white/40">
                Attach a live deployment link, GitHub repository, documentation site, or production web application to view and manage it right here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditUrlInput("");
                  setProjectUrlModalOpen(true);
                }}
                className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
              >
                <Plus size={16} />
                <span>Attach Project URL</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ==========================================================
         TASKS VIEW
      ========================================================== */}
      {activeTab === "tasks" && (
      <>


      {/* FILTER BAR */}

      <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4 shadow-xl shadow-black/10 backdrop-blur-2xl">
        <div className="flex flex-col gap-3 xl:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(
                  event.target.value,
                );
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
              className="h-11 min-w-[170px] appearance-none rounded-xl border border-white/10 bg-[#111116] px-4 pr-10 text-sm text-white outline-none focus:border-indigo-400/40"
            >
              <option
                value=""
                className="bg-[#111116] text-white"
              >
                All statuses
              </option>

              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-[#111116] text-white"
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
              className="h-11 min-w-[170px] appearance-none rounded-xl border border-white/10 bg-[#111116] px-4 pr-10 text-sm text-white outline-none focus:border-indigo-400/40"
            >
              <option
                value=""
                className="bg-[#111116] text-white"
              >
                All priorities
              </option>

              {PRIORITY_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-[#111116] text-white"
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


          {/* LABEL FILTER */}

          <div className="relative">
            <select
              value={labelFilter}
              onChange={(event) => {
                setLabelFilter(
                  event.target.value,
                );

                setPage(1);
              }}
              disabled={labelsLoading}
              className="h-11 min-w-[190px] appearance-none rounded-xl border border-white/10 bg-[#111116] px-4 pr-10 text-sm text-white outline-none focus:border-indigo-400/40 disabled:opacity-50"
            >
              <option
                value=""
                className="bg-[#111116] text-white"
              >
                All labels
              </option>

              {labels.map(
                (label) => (
                  <option
                    key={label.id}
                    value={label.id}
                    className="bg-[#111116] text-white"
                  >
                    {label.name}
                  </option>
                ),
              )}
            </select>

            <Tag
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
            />
          </div>
        </div>
      </section>


      {/* SUMMARY */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex items-center gap-2 text-xs text-white/30">
          <Tag size={13} />

          {labelsLoading
            ? "Loading labels..."
            : `${labels.length} workspace label${
                labels.length === 1
                  ? ""
                  : "s"
              }`}
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
              Create a task or change
              your search and filters.
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

                  <div className="relative shrink-0">
                    <select
                      value={task.status}
                      onChange={(event) =>
                        void handleStatusChange(
                          task,
                          event.target
                            .value as TaskStatus,
                        )
                      }
                      className="h-10 appearance-none rounded-xl border border-white/10 bg-[#111116] pl-9 pr-9 text-sm text-white outline-none focus:border-indigo-400/40"
                    >
                      {STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                            className="bg-[#111116] text-white"
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

                    <div className="mt-3 flex flex-wrap items-center gap-2">

                      {task.labels.map(
                        (label) => {
                          const color =
                            normalizeLabelColor(
                              label.color,
                            );

                          const removeKey =
                            `remove-${task.id}-${label.id}`;

                          const removing =
                            labelActionKey ===
                            removeKey;

                          return (
                            <span
                              key={label.id}
                              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium"
                              style={{
                                borderColor:
                                  `${color}55`,
                                color,
                                backgroundColor:
                                  `${color}12`,
                              }}
                            >
                              <span>
                                {label.name}
                              </span>

                              <button
                                type="button"
                                title={`Remove ${label.name}`}
                                disabled={
                                  removing
                                }
                                onClick={() =>
                                  void handleInlineRemoveLabel(
                                    task,
                                    label.id,
                                  )
                                }
                                className="ml-0.5 rounded-md p-0.5 opacity-60 transition hover:bg-white/10 hover:opacity-100 disabled:opacity-30"
                              >
                                {removing ? (
                                  <Loader2
                                    size={10}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <X
                                    size={10}
                                  />
                                )}
                              </button>
                            </span>
                          );
                        },
                      )}


                      {/* ADD LABEL */}

                      {labels.length > 0 && (
                        <div className="relative">
                          <select
                            value=""
                            disabled={
                              labelActionKey !==
                              null
                            }
                            onChange={(event) => {
                              const value =
                                event.target
                                  .value;

                              if (value) {
                                void handleInlineAddLabel(
                                  task,
                                  value,
                                );
                              }
                            }}
                            className="h-7 appearance-none rounded-lg border border-dashed border-white/10 bg-black/20 px-2 pr-7 text-[10px] text-white/35 outline-none transition hover:border-indigo-400/30 hover:text-white/60 disabled:opacity-50"
                          >
                            <option
                              value=""
                              className="bg-[#111116] text-white"
                            >
                              + Add label
                            </option>

                            {labels
                              .filter(
                                (label) =>
                                  !task.labels.some(
                                    (taskLabel) =>
                                      taskLabel.id ===
                                      label.id,
                                  ),
                              )
                              .map(
                                (label) => (
                                  <option
                                    key={
                                      label.id
                                    }
                                    value={
                                      label.id
                                    }
                                    className="bg-[#111116] text-white"
                                  >
                                    {label.name}
                                  </option>
                                ),
                              )}
                          </select>

                          <ChevronDown
                            size={10}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/20"
                          />
                        </div>
                      )}

                      {task.labels.length ===
                        0 &&
                        labels.length ===
                          0 && (
                          <span className="text-[10px] text-white/20">
                            No labels available
                          </span>
                        )}
                    </div>
                  </div>


                  {/* DUE DATE */}

                  {task.due_date && (
                    <div className="flex shrink-0 items-center gap-2 text-xs text-white/30">
                      <Clock3
                        size={14}
                      />

                      {new Date(
                        task.due_date,
                      ).toLocaleDateString()}
                    </div>
                  )}


                  {/* ACTIONS */}

                  <div className="flex shrink-0 items-center gap-1">
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
                        void handleDelete(
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
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/50 transition hover:bg-white/[0.08] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </>
      )}

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md">

          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101015] p-7 shadow-2xl">

            {/* MODAL HEADER */}

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
                    ? "Update the task details and labels."
                    : "Add a new task to this project."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  creatingLabel
                }
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
                        event.target
                          .value as TaskStatus,
                      )
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                          className="bg-[#111116] text-white"
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
                        event.target
                          .value as TaskPriority,
                      )
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 text-sm text-white outline-none focus:border-indigo-400/50"
                  >
                    {PRIORITY_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                          className="bg-[#111116] text-white"
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


              {/* LABELS */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <Tag
                      size={15}
                      className="text-indigo-300"
                    />

                    Labels
                  </label>

                  <span className="text-[11px] text-white/25">
                    {selectedLabelIds.length}{" "}
                    selected
                  </span>
                </div>


                {/* AVAILABLE LABELS */}

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">

                  {labelsLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-white/30">
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />

                      Loading labels...
                    </div>
                  ) : labels.length ===
                    0 ? (
                    <div className="py-3 text-xs text-white/30">
                      No workspace labels
                      yet. Create one
                      below.
                    </div>
                  ) : (
                    <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                      {labels.map(
                        (label) => {
                          const color =
                            normalizeLabelColor(
                              label.color,
                            );

                          const selected =
                            selectedLabelIds.includes(
                              label.id,
                            );

                          return (
                            <div
                              key={label.id}
                              className="group inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                              style={{
                                borderColor:
                                  selected
                                    ? color
                                    : `${color}45`,
                                color,
                                backgroundColor:
                                  selected
                                    ? `${color}25`
                                    : `${color}08`,
                                boxShadow:
                                  selected
                                    ? `0 0 0 1px ${color}35`
                                    : "none",
                              }}
                            >
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  toggleLabel(label.id)
                                }
                                className="flex items-center gap-1"
                              >
                                {selected ? "✓ " : ""}
                                {label.name}
                              </button>

                              <button
                                type="button"
                                title={`Delete label "${label.name}" from workspace`}
                                disabled={saving}
                                onClick={(event) =>
                                  void handleDeleteLabel(
                                    label.id,
                                    event,
                                  )
                                }
                                className="ml-1 rounded p-0.5 opacity-40 hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300 transition"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}

                </div>


                {/* CREATE LABEL */}

                <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3">

                  <p className="mb-3 text-xs font-medium text-white/50">
                    Create workspace label
                  </p>

                  <div className="flex gap-2">

                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(event) =>
                        setNewLabelName(
                          event.target
                            .value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          void handleCreateLabel();
                        }
                      }}
                      placeholder="Label name"
                      maxLength={50}
                      disabled={
                        saving ||
                        creatingLabel
                      }
                      className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-indigo-400/40 disabled:opacity-50"
                    />

                    <input
                      type="color"
                      value={
                        newLabelColor
                      }
                      onChange={(event) =>
                        setNewLabelColor(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        saving ||
                        creatingLabel
                      }
                      title="Choose label color"
                      className="h-10 w-10 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void handleCreateLabel()
                      }
                      disabled={
                        saving ||
                        creatingLabel ||
                        !newLabelName.trim()
                      }
                      className="flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 text-xs font-medium text-white/70 transition hover:bg-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {creatingLabel ? (
                        <Loader2
                          size={13}
                          className="animate-spin"
                        />
                      ) : (
                        <Plus
                          size={13}
                        />
                      )}

                      Create
                    </button>

                  </div>


                  {/* COLOR PRESETS */}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {LABEL_COLORS.map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          disabled={
                            saving ||
                            creatingLabel
                          }
                          title={color}
                          onClick={() =>
                            setNewLabelColor(
                              color,
                            )
                          }
                          className="h-5 w-5 rounded-full border-2 transition hover:scale-110 disabled:opacity-50"
                          style={{
                            backgroundColor:
                              color,
                            borderColor:
                              newLabelColor ===
                              color
                                ? "#ffffff"
                                : "transparent",
                          }}
                        />
                      ),
                    )}
                  </div>

                </div>
              </div>


              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    saving ||
                    creatingLabel
                  }
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    creatingLabel
                  }
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

      {/* PROJECT URL MODAL */}
      {projectUrlModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#101015] p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Globe size={20} className="text-indigo-300" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold">
                  {project?.project_url ? "Edit Project URL" : "Attach Project URL"}
                </h2>
                <p className="mt-1.5 text-xs text-white/40">
                  Link an already built web project, GitHub repository, or live deployment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProjectUrlModalOpen(false)}
                disabled={savingUrl}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdateProjectUrl(editUrlInput);
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Project URL or Repository Link
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={editUrlInput}
                    onChange={(e) => setEditUrlInput(e.target.value)}
                    placeholder="https://github.com/org/repo or https://myproject.app"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <p className="mt-1 text-[11px] text-white/35">
                  Leave empty and save if you want to remove the link.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectUrlModalOpen(false)}
                  disabled={savingUrl}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUrl}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-xs font-semibold shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {savingUrl && <Loader2 size={15} className="animate-spin" />}
                  {savingUrl ? "Saving..." : "Save URL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
