from app.events.instance import event_dispatcher
from app.events.types import (
    TaskAssignedEvent,
    TaskStatusChangedEvent,
    CommentAddedEvent,
)
from app.services.notification import create_notification


def handle_task_assigned(
    event: TaskAssignedEvent,
):
    create_notification(
        db=event.db,
        user_id=str(event.user_id),
        workspace_id=str(event.workspace_id),
        task_id=str(event.task_id),
        notification_type="task_assigned",
        title="New task assigned",
        message=f"You were assigned task '{event.task_title}'",
    )


def handle_task_status_changed(
    event: TaskStatusChangedEvent,
):
    print("🔥 STATUS EVENT RECEIVED")
    print("Task:", event.task_title)
    print("Old status:", event.old_status)
    print("New status:", event.new_status)

    if event.user_id is None:
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


def handle_comment_added(
    event: CommentAddedEvent,
):
    if event.assignee_id is None:
        return

    # Don't notify the assignee if they wrote the comment themselves
    if event.assignee_id == event.user_id:
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


# Register event handlers

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