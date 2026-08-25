
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellOff,
  CheckCheck,
  Loader2,
  Trash2,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "../../services/notifications";

/* ============================================================
   NOTIFICATION ICON BY TYPE
============================================================ */

function NotificationIcon({ type }: { type: string }) {
  if (type === "task_assigned") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
        <CheckCircle2 size={18} className="text-indigo-300" />
      </div>
    );
  }
  if (type === "task_created") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
        <FolderKanban size={18} className="text-violet-300" />
      </div>
    );
  }
  if (type === "status_changed") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
        <RefreshCw size={18} className="text-cyan-300" />
      </div>
    );
  }
  if (type === "mention") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pink-400/20 bg-pink-500/10">
        <MessageSquare size={18} className="text-pink-300" />
      </div>
    );
  }
  if (type === "workspace_invitation" || type === "invitation" || type === "member_joined") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
        <CheckCircle2 size={18} className="text-emerald-300" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
      <AlertTriangle size={18} className="text-white/40" />
    </div>
  );
}

/* ============================================================
   NOTIFICATIONS PAGE
============================================================ */

type FilterType = "all" | "unread" | "read";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      void handleMarkRead(notification);
    }

    if (
      notification.type === "workspace_invitation" ||
      notification.type === "invitation"
    ) {
      navigate("/workspace/members");
    } else if (notification.type === "member_joined") {
      navigate("/workspace/members");
    } else if (notification.task_id) {
      navigate("/tasks");
    } else {
      navigate("/");
    }
  }

  /* ============================================================
     LOAD NOTIFICATIONS
  ============================================================ */

  async function loadNotifications(
    currentFilter: FilterType = filter,
    currentPage = 1,
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications({
        filter: currentFilter,
        page: currentPage,
        page_size: 20,
      });

      setNotifications(data.items);
      setTotal(data.total);
      setUnreadCount(data.unread_count);
      setTotalPages(data.total_pages);
      setPage(currentPage);
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifications(filter, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  /* ============================================================
     MARK ONE AS READ
  ============================================================ */

  async function handleMarkRead(notification: Notification) {
    if (notification.is_read || markingId) return;

    try {
      setMarkingId(notification.id);
      const updated = await markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  }

  /* ============================================================
     MARK ALL AS READ
  ============================================================ */

  async function handleMarkAllRead() {
    if (markingAll || unreadCount === 0) return;

    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  }

  /* ============================================================
     DELETE NOTIFICATION
  ============================================================ */

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await deleteNotification(id);

      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  /* ============================================================
     FORMAT DATE
  ============================================================ */

  function formatDate(dateStr: string): string {
    // Ensure UTC timestamps are parsed correctly (append Z if missing)
    const normalised = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
    const date = new Date(normalised);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading && notifications.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2 size={24} className="animate-spin text-indigo-300" />
          </div>
          <p className="text-sm text-white/40">Loading notifications...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="relative mx-auto max-w-[1000px] space-y-8">
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
        <div className="absolute bottom-[15%] right-[10%] h-[350px] w-[350px] rounded-full bg-violet-600/[0.05] blur-[150px]" />
      </div>

      {/* HEADER */}
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
                <Sparkles size={15} className="text-indigo-300" />
              </div>
              <span className="text-xs font-semibold tracking-[0.25em] text-indigo-300/80">
                INBOX
              </span>
            </div>

            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-sm font-semibold text-indigo-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Stay up to date with task assignments, updates, and mentions.
            </p>
          </div>

          {/* MARK ALL READ */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/60 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCheck size={16} />
              )}
              Mark all read
            </button>
          )}
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* FILTER TABS */}
      <section className="flex items-center gap-2">
        {(["all", "unread", "read"] as FilterType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setFilter(tab);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              filter === tab
                ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/20"
                : "text-white/40 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}

        <span className="ml-auto text-xs text-white/25">
          {total} total
        </span>
      </section>

      {/* NOTIFICATION LIST */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/10 backdrop-blur-2xl">
        {loading ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
            <Loader2 size={22} className="animate-spin text-indigo-300" />
            <p className="text-sm text-white/30">Refreshing...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <BellOff size={26} className="text-white/20" />
            </div>

            <h3 className="text-base font-semibold">No notifications</h3>

            <p className="text-sm text-white/30">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : filter === "read"
                  ? "No read notifications yet."
                  : "You have no notifications yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {notifications.map((notification) => {
              const isInvitation =
                notification.type === "workspace_invitation" ||
                notification.type === "invitation" ||
                notification.type === "member_joined";

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative flex items-start gap-4 p-5 transition-colors cursor-pointer ${
                    !notification.is_read
                      ? "bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06]"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.7)]" />
                  )}

                  <NotificationIcon type={notification.type} />

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            notification.is_read
                              ? "text-white/60"
                              : "text-white font-semibold"
                          }`}
                        >
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/45">
                          {notification.message}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        {!notification.is_read && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleMarkRead(notification);
                            }}
                            disabled={markingId === notification.id}
                            className="rounded-lg p-1.5 text-white/30 transition hover:bg-indigo-500/10 hover:text-indigo-300 disabled:opacity-50"
                          >
                            {markingId === notification.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCheck size={14} />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(notification.id);
                          }}
                          disabled={deletingId === notification.id}
                          className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === notification.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] capitalize text-white/30">
                          {notification.type.replace(/_/g, " ")}
                        </span>

                        <span className="text-[11px] text-white/30">
                          {formatDate(notification.created_at)}
                        </span>

                        {!notification.is_read && (
                          <span className="text-[10px] font-semibold text-indigo-400">
                            NEW
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition ${
                          isInvitation
                            ? "bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30"
                            : "bg-white/[0.05] text-white/70 hover:bg-white/[0.1] hover:text-white"
                        }`}
                      >
                        <span>
                          {isInvitation
                            ? "View Workspace Members"
                            : notification.task_id
                              ? "View Task"
                              : "View"}
                        </span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <section className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => loadNotifications(filter, page - 1)}
            className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-white/30">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => loadNotifications(filter, page + 1)}
            className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </section>
      )}
    </div>
  );
}
