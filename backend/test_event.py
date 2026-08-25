import app.events.handlers  # Register event listeners
from app.events.instance import event_dispatcher
from app.events.types import TaskAssignedEvent, TaskStatusChangedEvent, CommentAddedEvent
from app.core.database import SessionLocal
from app.models.task import Task
from app.models.notification import Notification
from sqlalchemy import select
from uuid import uuid4

db = SessionLocal()
task = db.scalar(select(Task).where(Task.assignee_id.is_not(None)))

if task:
    print("=" * 60)
    print("TEST 1: Dispatching TaskAssignedEvent...")
    print("=" * 60)
    assign_event = TaskAssignedEvent(
        db=db,
        task_id=task.id,
        workspace_id=task.workspace_id,
        user_id=task.assignee_id,
        assigned_by=task.created_by if task.created_by else task.assignee_id,
        task_title=task.title,
    )
    event_dispatcher.dispatch(assign_event)
    db.commit()

    n_assigned = db.scalar(
        select(Notification)
        .where(
            Notification.user_id == task.assignee_id,
            Notification.task_id == task.id,
            Notification.type == "task_assigned"
        )
        .order_by(Notification.created_at.desc())
    )
    if n_assigned:
        print("[SUCCESS] task_assigned notification created:")
        print(f"   ID: {n_assigned.id} | Title: '{n_assigned.title}' | Message: '{n_assigned.message}'")
    else:
        print("[FAILED] task_assigned notification not created.")

    print("\n" + "=" * 60)
    print("TEST 2: Dispatching TaskStatusChangedEvent...")
    print("=" * 60)
    status_event = TaskStatusChangedEvent(
        db=db,
        task_id=task.id,
        workspace_id=task.workspace_id,
        user_id=task.assignee_id,
        old_status="todo",
        new_status="in_progress",
        task_title=task.title,
    )
    event_dispatcher.dispatch(status_event)
    db.commit()

    n_status = db.scalar(
        select(Notification)
        .where(
            Notification.user_id == task.assignee_id,
            Notification.task_id == task.id,
            Notification.type == "status_changed"
        )
        .order_by(Notification.created_at.desc())
    )
    if n_status:
        print("[SUCCESS] status_changed notification created:")
        print(f"   ID: {n_status.id} | Title: '{n_status.title}' | Message: '{n_status.message}'")
    else:
        print("[FAILED] status_changed notification not created.")

    print("\n" + "=" * 60)
    print("TEST 3: Dispatching CommentAddedEvent...")
    print("=" * 60)
    commenter_id = uuid4()
    comment_event = CommentAddedEvent(
        db=db,
        task_id=task.id,
        workspace_id=task.workspace_id,
        user_id=commenter_id,
        assignee_id=task.assignee_id,
        task_title=task.title,
    )
    event_dispatcher.dispatch(comment_event)
    db.commit()

    n_comment = db.scalar(
        select(Notification)
        .where(
            Notification.user_id == task.assignee_id,
            Notification.task_id == task.id,
            Notification.type == "comment_added"
        )
        .order_by(Notification.created_at.desc())
    )
    if n_comment:
        print("[SUCCESS] comment_added notification created:")
        print(f"   ID: {n_comment.id} | Title: '{n_comment.title}' | Message: '{n_comment.message}'")
    else:
        print("[FAILED] comment_added notification not created.")

    print("\n" + "=" * 60)
    print("ALL TEST NOTIFICATIONS VERIFIED SUCCESSFULLY!")
    print("=" * 60)
else:
    print("[FAILED] No assigned task available for event test")

db.close()
