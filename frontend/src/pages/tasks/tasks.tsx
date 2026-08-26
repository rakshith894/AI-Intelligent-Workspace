import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock3,
  FolderKanban,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
  Zap,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  type Workspace,
  type WorkspaceMember,
} from "../../services/workspace";
import { getProjects, createProject, type Project } from "../../services/project";
import { getAITaskBreakdown, getAIAutoAssign } from "../../services/ai";
import {
  createTask,
  deleteTask,
  getWorkspaceTasks,
  updateTask,
  type Task,
  type TaskCreate,
} from "../../services/task";
import {
  getLabels,
  createLabel,
  deleteLabel,
  type Label,
} from "../../services/label";
import {
  getTaskComments,
  addTaskComment,
  getTaskActivities,
  type TaskComment,
  type TaskActivity,
} from "../../services/comments";

type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-blue-400 border-blue-400/20 bg-blue-500/10" },
  { value: "medium", label: "Medium", color: "text-amber-400 border-amber-400/20 bg-amber-500/10" },
  { value: "high", label: "High", color: "text-orange-400 border-orange-400/20 bg-orange-500/10" },
  { value: "urgent", label: "Urgent", color: "text-rose-400 border-rose-400/20 bg-rose-500/10" },
];

export default function Tasks() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null); // null = All Projects
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);

  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Task Creation / Editing Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366f1");
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [loadingAIBreakdown, setLoadingAIBreakdown] = useState(false);
  const [loadingAutoAssign, setLoadingAutoAssign] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  // Quick Project Create Modal
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Inspector / Details Drawer Modal
  const [inspectorTask, setInspectorTask] = useState<Task | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"details" | "comments" | "activity">("details");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loadingInspectorData, setLoadingInspectorData] = useState(false);

  /* Load Initial Data */
  useEffect(() => {
    async function init() {
      try {
        setLoadingWorkspace(true);
        setError("");
        const wsList = await getMyWorkspaces();
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          const ws = wsList[0];
          setWorkspace(ws);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load workspace data.");
      } finally {
        setLoadingWorkspace(false);
      }
    }
    void init();
  }, []);

  /* Load Workspace Dependencies (Projects, Members, Labels) */
  useEffect(() => {
    if (!workspace) return;
    async function loadWorkspaceData() {
      try {
        const [projList, memberList, labelList] = await Promise.all([
          getProjects(workspace!.id).catch(() => []),
          getWorkspaceMembers(workspace!.id).catch(() => []),
          getLabels(workspace!.id).catch(() => []),
        ]);
        setProjects(projList);
        setMembers(memberList);
        setLabels(labelList);
      } catch (err) {
        console.error(err);
      }
    }
    void loadWorkspaceData();
  }, [workspace]);

  /* Load Tasks (Supports All Projects or Specific Project) */
  useEffect(() => {
    if (!workspace) {
      setTasks([]);
      return;
    }

    async function loadTasks() {
      try {
        setLoadingTasks(true);
        setError("");
        const response = await getWorkspaceTasks(workspace!.id, {
          project_id: selectedProjectId || undefined,
          page: 1,
          page_size: 100,
          sort_by: "created_at",
          sort_order: "desc",
        });
        setTasks(response.items);
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setError("Unable to load tasks.");
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    }

    void loadTasks();
  }, [workspace, selectedProjectId]);

  /* Load Inspector Comments & Activity */
  useEffect(() => {
    if (!inspectorTask || !workspace) return;
    const projId = inspectorTask.project_id;
    if (!projId) return;

    async function loadDetails() {
      try {
        setLoadingInspectorData(true);
        const [commentList, activityList] = await Promise.all([
          getTaskComments(workspace!.id, projId, inspectorTask!.id).catch(() => []),
          getTaskActivities(workspace!.id, projId, inspectorTask!.id).catch(() => []),
        ]);
        setComments(commentList);
        setActivities(activityList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInspectorData(false);
      }
    }
    void loadDetails();
  }, [inspectorTask, workspace]);

  /* Create Workspace Label */
  async function handleCreateLabel() {
    if (!workspace || !newLabelName.trim()) return;
    try {
      setCreatingLabel(true);
      const created = await createLabel(workspace.id, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setLabels((prev) => [...prev.filter((l) => l.id !== created.id), created]);
      setSelectedLabelIds((prev) => [...prev, created.id]);
      setNewLabelName("");
    } catch (err) {
      console.error("Failed to create label:", err);
    } finally {
      setCreatingLabel(false);
    }
  }

  /* Delete Workspace Label */
  async function handleDeleteLabel(labelId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!workspace) return;
    try {
      setDeletingLabelId(labelId);
      await deleteLabel(workspace.id, labelId);
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      setSelectedLabelIds((prev) => prev.filter((id) => id !== labelId));
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          labels: t.labels?.filter((l) => l.id !== labelId) || [],
        }))
      );
      if (inspectorTask) {
        setInspectorTask({
          ...inspectorTask,
          labels: inspectorTask.labels?.filter((l) => l.id !== labelId) || [],
        });
      }
    } catch (err) {
      console.error("Failed to delete label:", err);
    } finally {
      setDeletingLabelId(null);
    }
  }

  /* AI Task Breakdown */
  async function handleAIBreakdown() {
    if (!workspace || !taskTitle.trim()) return;
    try {
      setLoadingAIBreakdown(true);
      setAiMessage("");
      const result = await getAITaskBreakdown(
        workspace.id,
        taskTitle.trim(),
        taskDescription,
        taskPriority
      );
      if (result.suggested_description) {
        const subtasksText = result.subtasks
          .map((s) => `- [ ] ${s.title} (~${s.estimated_hours}h)`)
          .join("\n");
        setTaskDescription(
          `${result.suggested_description}\n\n### Subtasks Checklist:\n${subtasksText}`
        );
      }
      if (result.suggested_priority) {
        setTaskPriority(result.suggested_priority as TaskPriority);
      }
      setAiMessage("✨ AI enhanced description and generated subtasks!");
      setTimeout(() => setAiMessage(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAIBreakdown(false);
    }
  }

  /* AI Auto Assign */
  async function handleAIAutoAssign() {
    if (!workspace || !taskTitle.trim()) return;
    try {
      setLoadingAutoAssign(true);
      setAiMessage("");
      const result = await getAIAutoAssign(workspace.id, taskTitle.trim(), taskPriority);
      if (result.recommended_user_id) {
        setTaskAssignee(result.recommended_user_id);
        setAiMessage(`✨ Auto-assigned to ${result.recommended_name || "member"} (${result.reason})`);
        setTimeout(() => setAiMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAutoAssign(false);
    }
  }

  /* Quick Project Create */
  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!workspace || !newProjectName.trim()) return;
    try {
      setCreatingProject(true);
      const created = await createProject(workspace.id, { name: newProjectName.trim() });
      setProjects((prev) => [...prev, created]);
      setSelectedProjectId(created.id);
      setTaskProjectId(created.id);
      setNewProjectName("");
      setNewProjectModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingProject(false);
    }
  }

  function openCreateTaskModal() {
    setEditingTask(null);
    setTaskProjectId(selectedProjectId || (projects.length > 0 ? projects[0].id : ""));
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskDueDate("");
    setTaskAssignee("");
    setSelectedLabelIds([]);
    setTaskModalOpen(true);
  }

  function openEditTaskModal(task: Task) {
    setEditingTask(task);
    setTaskProjectId(task.project_id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskStatus((task.status as TaskStatus) || "todo");
    setTaskPriority((task.priority as TaskPriority) || "medium");
    setTaskDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setTaskAssignee(task.assignee_id || "");
    setSelectedLabelIds(task.labels?.map((l) => l.id) || []);
    setTaskModalOpen(true);
  }

  async function handleSaveTask(e: FormEvent) {
    e.preventDefault();
    if (!workspace || !taskTitle.trim()) return;

    const targetProjId = editingTask ? editingTask.project_id : taskProjectId;
    if (!targetProjId) {
      setError("Please select or create a project for this task.");
      return;
    }

    try {
      setSavingTask(true);
      setError("");

      if (editingTask) {
        const updated = await updateTask(workspace.id, targetProjId, editingTask.id, {
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          status: taskStatus,
          priority: taskPriority,
          due_date: taskDueDate || null,
          assignee_id: taskAssignee || null,
          label_ids: selectedLabelIds,
        });

        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (inspectorTask?.id === updated.id) {
          setInspectorTask(updated);
        }
      } else {
        const payload: TaskCreate = {
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          status: taskStatus,
          priority: taskPriority,
          due_date: taskDueDate || undefined,
          assignee_id: taskAssignee || undefined,
          label_ids: selectedLabelIds,
        };
        const created = await createTask(workspace.id, targetProjId, payload);
        setTasks((prev) => [created, ...prev]);
      }

      setTaskModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save task. Please check details and try again.");
    } finally {
      setSavingTask(false);
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!workspace) return;
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

    try {
      await deleteTask(workspace.id, task.project_id, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (inspectorTask?.id === task.id) {
        setInspectorTask(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
    }
  }

  async function handleQuickStatusChange(task: Task, newStatus: TaskStatus) {
    if (!workspace) return;
    try {
      await updateTask(workspace.id, task.project_id, task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      if (inspectorTask?.id === task.id) {
        setInspectorTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (!workspace || !inspectorTask || !newComment.trim()) return;

    try {
      setPostingComment(true);
      const created = await addTaskComment(
        workspace.id,
        inspectorTask.project_id,
        inspectorTask.id,
        newComment.trim()
      );
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loadingWorkspace) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2 size={24} className="animate-spin text-indigo-300" />
          </div>
          <p className="text-sm text-white/40">Loading workspace tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-8">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[15%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-600/[0.08] blur-[140px]" />
        <div className="absolute right-[10%] top-[20%] h-[450px] w-[450px] rounded-full bg-purple-600/[0.06] blur-[150px]" />
      </div>

      {/* HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <CheckSquare size={16} />
            </div>
            <span className="text-xs font-semibold tracking-[0.2em] text-indigo-300/80">TASK BACKLOG</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Tasks & Deliverables</h1>
          <p className="mt-1 text-sm text-white/40">
            View, track, and collaborate on tasks across your entire workspace team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace Switcher if multiple */}
          {workspaces.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-medium text-white hover:bg-white/[0.08] transition"
              >
                <span>{workspace?.name}</span>
                <ChevronDown size={14} className="text-white/40" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0c0d18] p-1.5 shadow-2xl backdrop-blur-2xl">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        setWorkspace(ws);
                        setSelectedProjectId(null);
                        setWorkspaceMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
                        workspace?.id === ws.id
                          ? "bg-indigo-500/20 text-indigo-300 font-semibold"
                          : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <FolderKanban size={14} />
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={openCreateTaskModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* PROJECT SELECTOR PILLS */}
      <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 shadow-xl backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Project Filter</p>
          <button
            type="button"
            onClick={() => setNewProjectModalOpen(true)}
            className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 transition"
          >
            <Plus size={13} />
            <span>New Project</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* ALL PROJECTS PILL */}
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              selectedProjectId === null
                ? "border border-indigo-400/40 bg-indigo-500/25 text-indigo-200 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <Sparkles size={14} className={selectedProjectId === null ? "text-indigo-300" : "text-white/40"} />
            <span>All Projects ({tasks.length})</span>
          </button>

          {/* INDIVIDUAL PROJECT PILLS */}
          {projects.map((proj) => {
            const active = selectedProjectId === proj.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => setSelectedProjectId(proj.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border border-indigo-400/40 bg-indigo-500/25 text-indigo-200 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <FolderKanban size={14} className={active ? "text-indigo-300" : "text-white/40"} />
                <span>{proj.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-xs text-white outline-none placeholder:text-white/30 focus:border-indigo-400/40"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-[#0c0d18] px-3.5 text-xs text-white/80 outline-none focus:border-indigo-400/40"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-[#0c0d18] px-3.5 text-xs text-white/80 outline-none focus:border-indigo-400/40"
          >
            <option value="all">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* TASK LIST */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl backdrop-blur-2xl">
        {loadingTasks ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
            <Loader2 size={28} className="animate-spin text-indigo-300" />
            <p className="text-sm text-white/40">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <CheckSquare size={28} className="text-white/30" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No tasks found</h3>
              <p className="mt-1 max-w-sm text-xs text-white/40">
                {search || statusFilter !== "all" || priorityFilter !== "all"
                  ? "No tasks match your current search and filter criteria."
                  : "No tasks created in this project yet. Click 'New Task' to get started!"}
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateTaskModal}
              className="flex items-center gap-2 rounded-xl bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 transition"
            >
              <Plus size={15} />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredTasks.map((task) => {
              const priorityInfo =
                PRIORITY_OPTIONS.find((p) => p.value === task.priority) || PRIORITY_OPTIONS[1];
              const assignee = members.find((m) => (m.user_id || m.id) === task.assignee_id);
              const projectName = projects.find((p) => p.id === task.project_id)?.name;

              return (
                <div
                  key={task.id}
                  onClick={() => setInspectorTask(task)}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors hover:bg-white/[0.03] rounded-2xl cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Quick status cycle button */}
                    <button
                      type="button"
                      title={`Current status: ${task.status}. Click to complete.`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleQuickStatusChange(
                          task,
                          task.status === "done" ? "todo" : "done"
                        );
                      }}
                      className="mt-0.5 shrink-0 rounded-lg p-1 text-white/30 hover:text-emerald-400 transition"
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            task.status === "done"
                              ? "text-white/40 line-through"
                              : "text-white group-hover:text-indigo-200"
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Project Tag when in All Projects view */}
                        {projectName && selectedProjectId === null && (
                          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                            {projectName}
                          </span>
                        )}

                        {/* Labels */}
                        {task.labels?.map((lbl) => (
                          <span
                            key={lbl.id}
                            style={{ borderColor: `${lbl.color}40`, color: lbl.color }}
                            className="rounded-md border bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium"
                          >
                            #{lbl.name}
                          </span>
                        ))}
                      </div>

                      {task.description && (
                        <p className="mt-1 text-xs text-white/40 line-clamp-1">
                          {task.description.replace(/^#+\s/gm, "")}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/30">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Clock3 size={12} />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {assignee && (
                          <span className="text-indigo-300/70">
                            Assigned to: {assignee.full_name || assignee.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${priorityInfo.color}`}
                    >
                      {priorityInfo.label}
                    </span>

                    <span className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] capitalize text-white/60">
                      {task.status.replace("_", " ")}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        title="Edit task"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTaskModal(task);
                        }}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete task"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteTask(task);
                        }}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-rose-500/20 hover:text-rose-300 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QUICK PROJECT CREATE MODAL */}
      <AnimatePresence>
        {newProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0d18] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    <FolderKanban size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white">Create New Project</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
                  className="rounded-xl p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Website Redesign, Backend API..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-indigo-400/40"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewProjectModalOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs text-white/70 hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject || !newProjectName.trim()}
                    className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {creatingProject ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASK MODAL */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0c0d18] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    <CheckSquare size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {editingTask ? "Edit Task" : "Create Deliverable Task"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-xl p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {aiMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
                  <Sparkles size={14} className="shrink-0" />
                  <span>{aiMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
                {/* Project Selector (when creating a task) */}
                {!editingTask && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium text-white/70">Project</label>
                      <button
                        type="button"
                        onClick={() => setNewProjectModalOpen(true)}
                        className="text-[11px] text-indigo-300 hover:underline"
                      >
                        + New Project
                      </button>
                    </div>
                    <select
                      required
                      value={taskProjectId}
                      onChange={(e) => setTaskProjectId(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#121324] px-3 text-xs text-white outline-none"
                    >
                      <option value="" disabled>
                        Select a project
                      </option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-medium text-white/70">Task Title</label>
                    <button
                      type="button"
                      onClick={handleAIBreakdown}
                      disabled={loadingAIBreakdown || !taskTitle.trim()}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 disabled:opacity-40"
                    >
                      {loadingAIBreakdown ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      <span>AI Breakdown</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Implement user authentication API..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-indigo-400/40"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">Description</label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Task details, requirements, acceptance criteria..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white outline-none focus:border-indigo-400/40"
                  />
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/70">Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#121324] px-3 text-xs text-white outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/70">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#121324] px-3 text-xs text-white outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Due Date & Assignee */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/70">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium text-white/70">Assignee</label>
                      <button
                        type="button"
                        onClick={handleAIAutoAssign}
                        disabled={loadingAutoAssign || !taskTitle.trim()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-purple-200 disabled:opacity-40"
                      >
                        {loadingAutoAssign ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                        <span>Auto-Assign</span>
                      </button>
                    </div>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#121324] px-3 text-xs text-white outline-none"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id || m.user_id} value={m.user_id || m.id}>
                          {m.full_name || m.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Labels Selector & Management */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-white/70">Workspace Labels</label>
                    <span className="text-[10px] text-white/40">{labels.length} available</span>
                  </div>

                  {labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map((lbl) => {
                        const active = selectedLabelIds.includes(lbl.id);
                        const isDeleting = deletingLabelId === lbl.id;
                        return (
                          <div
                            key={lbl.id}
                            className={`group inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                              active
                                ? "border-indigo-400 bg-indigo-500/20 text-indigo-200"
                                : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedLabelIds((prev) =>
                                  active ? prev.filter((id) => id !== lbl.id) : [...prev, lbl.id]
                                )
                              }
                              className="flex items-center gap-1"
                            >
                              {active ? "✓ " : ""}#{lbl.name}
                            </button>
                            <button
                              type="button"
                              title={`Delete #${lbl.name}`}
                              disabled={isDeleting}
                              onClick={(e) => handleDeleteLabel(lbl.id, e)}
                              className="ml-1 rounded p-0.5 text-white/30 hover:bg-rose-500/20 hover:text-rose-300 transition"
                            >
                              {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <X size={11} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Create Label Form */}
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-2">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCreateLabel();
                        }
                      }}
                      placeholder="New label name (e.g. backend, bug)..."
                      className="h-8 flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder:text-white/25"
                    />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      title="Label color"
                      className="h-7 w-7 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateLabel()}
                      disabled={creatingLabel || !newLabelName.trim()}
                      className="flex h-8 items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/30 disabled:opacity-40"
                    >
                      {creatingLabel ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs font-medium text-white/70 hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTask}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-xs font-semibold text-white shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {savingTask && <Loader2 size={14} className="animate-spin" />}
                    <span>{editingTask ? "Save Changes" : "Create Task"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASK INSPECTOR & COMMENTS DRAWER */}
      <AnimatePresence>
        {inspectorTask && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0c0d18] shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Task Details & Thread</h3>
                    <p className="text-[10px] text-white/40">Inspect deliverables & live discussion</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectorTask(null)}
                  className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/[0.06] px-6">
                <button
                  type="button"
                  onClick={() => setInspectorTab("details")}
                  className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
                    inspectorTab === "details"
                      ? "border-indigo-400 text-indigo-300"
                      : "border-transparent text-white/40 hover:text-white"
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("comments")}
                  className={`flex items-center gap-1.5 border-b-2 py-3 px-4 text-xs font-semibold transition ${
                    inspectorTab === "comments"
                      ? "border-indigo-400 text-indigo-300"
                      : "border-transparent text-white/40 hover:text-white"
                  }`}
                >
                  <MessageSquare size={13} />
                  <span>Comments ({comments.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("activity")}
                  className={`flex items-center gap-1.5 border-b-2 py-3 px-4 text-xs font-semibold transition ${
                    inspectorTab === "activity"
                      ? "border-indigo-400 text-indigo-300"
                      : "border-transparent text-white/40 hover:text-white"
                  }`}
                >
                  <Activity size={13} />
                  <span>Activity</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {inspectorTab === "details" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{inspectorTask.title}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-white/70">
                          {inspectorTask.status.replace("_", " ")}
                        </span>
                        <span className="rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-xs capitalize text-indigo-300">
                          {inspectorTask.priority} priority
                        </span>
                      </div>
                    </div>

                    {inspectorTask.description && (
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                        {inspectorTask.description}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] text-white/40 uppercase">Assignee</p>
                        <p className="mt-1 font-medium text-white">
                          {members.find((m) => (m.user_id || m.id) === inspectorTask.assignee_id)
                            ?.full_name || "Unassigned"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] text-white/40 uppercase">Due Date</p>
                        <p className="mt-1 font-medium text-white">
                          {inspectorTask.due_date
                            ? new Date(inspectorTask.due_date).toLocaleDateString()
                            : "No due date"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {inspectorTab === "comments" && (
                  <div className="space-y-4">
                    {loadingInspectorData ? (
                      <div className="py-8 text-center text-xs text-white/40">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <p className="py-8 text-center text-xs text-white/30 italic">No comments yet. Start the conversation!</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((c) => {
                          const author = members.find((m) => (m.user_id || m.id) === c.user_id);
                          return (
                            <div
                              key={c.id}
                              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                            >
                              <div className="flex items-center justify-between text-[11px] text-white/40">
                                <span className="font-semibold text-indigo-300">
                                  {author?.full_name || author?.email || "Workspace Member"}
                                </span>
                                <span>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="mt-1 text-white/80">{c.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="h-10 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-indigo-400/40"
                      />
                      <button
                        type="submit"
                        disabled={postingComment || !newComment.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white disabled:opacity-50"
                      >
                        {postingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </form>
                  </div>
                )}

                {inspectorTab === "activity" && (
                  <div className="space-y-3">
                    {loadingInspectorData ? (
                      <div className="py-8 text-center text-xs text-white/40">Loading activity...</div>
                    ) : activities.length === 0 ? (
                      <p className="py-8 text-center text-xs text-white/30 italic">No activity recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {activities.map((a) => {
                          const detailText =
                            typeof a.details === "string"
                              ? a.details
                              : a.details
                              ? JSON.stringify(a.details)
                              : a.action.replace("_", " ");
                          return (
                            <div
                              key={a.id}
                              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-xs"
                            >
                              <span className="text-white/70">{detailText}</span>
                              <span className="text-[10px] text-white/30">
                                {new Date(a.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}