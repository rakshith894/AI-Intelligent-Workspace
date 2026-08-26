import { useEffect, useRef } from "react";
import { getNotifications, getUnreadNotificationCount } from "../../services/notifications";
import { useToast } from "../ui/Toast";

export default function NotificationListener() {
  const { showToast } = useToast();
  const lastCountRef = useRef<number | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initial fetch to record baseline count and notification IDs
    async function init() {
      try {
        const notifs = await getNotifications({ filter: "unread", page: 1, page_size: 10 });
        lastCountRef.current = notifs.unread_count ?? 0;
        notifs.items.forEach((item) => seenIdsRef.current.add(item.id));
      } catch {
        lastCountRef.current = 0;
      }
    }
    void init();

    // Periodic poll for new notifications (every 20s)
    const interval = setInterval(async () => {
      try {
        const countData = await getUnreadNotificationCount();
        const currentCount = countData.count ?? 0;

        if (lastCountRef.current !== null && currentCount > lastCountRef.current) {
          // New notification arrived! Fetch latest
          const notifs = await getNotifications({ filter: "unread", page: 1, page_size: 5 });
          const newItems = notifs.items.filter((item) => !seenIdsRef.current.has(item.id));

          newItems.forEach((item) => {
            seenIdsRef.current.add(item.id);
            const link =
              item.type === "workspace_invitation" || item.type === "invitation"
                ? "/workspace/members"
                : item.task_id
                ? "/tasks"
                : "/notifications";

            showToast({
              type: "notification",
              title: item.title || "New Notification",
              message: item.message,
              link,
              duration: 7000,
            });
          });
        }

        lastCountRef.current = currentCount;
      } catch {
        // Silently skip if network drops
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [showToast]);

  return null;
}
