
from uuid import UUID

from sqlalchemy import select

from app.events.instance import event_dispatcher

from app.events.types import (
    TaskAssignedEvent,
    TaskStatusChangedEvent,
    CommentAddedEvent,
)

from app.services.notification import create_notification

from app.models.notification_preference import (
    NotificationPreference,
)


# ============================================================
# CHECK NOTIFICATION PREFERENCE
# ============================================================

def is_notification_enabled(
    db,
    user_id,
    preference_field: str,
) -> bool:
    """
    Check whether a user's notification preference is enabled.

    If the user does not have a preference row yet,
    notifications are enabled by default.
    """

    user_uuid = (
        user_id
        if isinstance(user_id, UUID)
        else UUID(str(user_id))
    )

    preference = db.scalar(
        select(NotificationPreference).where(
            NotificationPreference.user_id == user_uuid
        )
    )

    # No preference row = notifications enabled
    if preference is None:
        return True

    return bool(
        getattr(
            preference,
            preference_field,
            True,
        )
    )


# ============================================================
# TASK ASSIGNED
# ============================================================

def handle_task_assigned(
    event: TaskAssignedEvent,
):
    print("[EVENT] TASK ASSIGNED EVENT RECEIVED")
    print("Task:", event.task_title)
    print("User:", event.user_id)

    if event.user_id is None:
        return

    # Check user's task-assigned preference
    if not is_notification_enabled(
        event.db,
        event.user_id,
        "task_assigned",
    ):
        print(
            "[DISABLED] task_assigned notification disabled"
        )
        return

    create_notification(
        db=event.db,
        user_id=str(event.user_id),
        workspace_id=str(event.workspace_id),
        task_id=str(event.task_id),
        notification_type="task_assigned",
        title="New task assigned",
        message=(
            f"You were assigned task "
            f"'{event.task_title}'"
        ),
    )


# ============================================================
# TASK STATUS CHANGED
# ============================================================

def handle_task_status_changed(
    event: TaskStatusChangedEvent,
):
    print("[EVENT] STATUS EVENT RECEIVED")
    print("Task:", event.task_title)
    print("Old status:", event.old_status)
    print("New status:", event.new_status)

    if event.user_id is None:
        return

    # Check user's status-changed preference
    if not is_notification_enabled(
        event.db,
        event.user_id,
        "status_changed",
    ):
        print(
            "[DISABLED] status_changed notification disabled"
        )
        return

    create_notification(
        db=event.db,
        user_id=str(event.user_id),
        workspace_id=str(event.workspace_id),
        task_id=str(event.task_id),
        notification_type="status_changed",
        title="Task status changed",
        message=(
            f"Task '{event.task_title}' was moved "
            f"from '{event.old_status}' "
            f"to '{event.new_status}'"
        ),
    )


# ============================================================
# COMMENT ADDED
# ============================================================

def handle_comment_added(
    event: CommentAddedEvent,
):
    if event.assignee_id is None:
        return

    # Don't notify the assignee if they wrote
    # the comment themselves.
    if event.assignee_id == event.user_id:
        return

    # Check user's comment_added preference.
    if not is_notification_enabled(
        event.db,
        event.assignee_id,
        "comment_added",
    ):
        print(
            "[DISABLED] comment_added notification disabled"
        )
        return

    create_notification(
        db=event.db,
        user_id=str(event.assignee_id),
        workspace_id=str(event.workspace_id),
        task_id=str(event.task_id),
        notification_type="comment_added",
        title="New comment",
        message=(
            f"Someone commented on task "
            f"'{event.task_title}'"
        ),
    )


# ============================================================
# REGISTER EVENT HANDLERS
# ============================================================

print("REGISTERING TaskAssignedEvent")

event_dispatcher.register(
    TaskAssignedEvent,
    handle_task_assigned,
)


print("REGISTERING TaskStatusChangedEvent")

event_dispatcher.register(
    TaskStatusChangedEvent,
    handle_task_status_changed,
)


print("REGISTERING CommentAddedEvent")

event_dispatcher.register(
    CommentAddedEvent,
    handle_comment_added,
)

