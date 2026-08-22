from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.task import Task
from app.services.notification import create_notification


def create_comment(
    db: Session,
    task: Task,
    user_id: str,
    content: str,
):
    comment = Comment(
        task_id=task.id,
        workspace_id=task.workspace_id,
        user_id=UUID(user_id),
        content=content,
    )

    try:
        db.add(comment)
        db.flush()

        # Notify the task assignee
        if (
            task.assignee_id is not None
            and str(task.assignee_id) != str(user_id)
        ):
            create_notification(
                db=db,
                user_id=str(task.assignee_id),
                workspace_id=str(task.workspace_id),
                task_id=str(task.id),
                notification_type="comment_added",
                title="New comment",
                message=(
                    f"Someone commented on task "
                    f"'{task.title}'"
                ),
            )

        db.commit()
        db.refresh(comment)

    except Exception:
        db.rollback()
        raise

    return comment


def get_task_comments(
    db: Session,
    task_id: str,
    workspace_id: str,
):
    return db.scalars(
        select(Comment)
        .where(
            Comment.task_id == task_id,
            Comment.workspace_id == workspace_id,
        )
        .order_by(Comment.created_at.asc())
    ).all()