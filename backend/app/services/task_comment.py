from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID

from app.events.instance import event_dispatcher
from app.events.types import CommentAddedEvent
from app.models.task_comment import TaskComment
from app.schemas.task_comment import CommentCreate


def create_comment(
    db: Session,
    task_id: str,
    workspace_id: str,
    user_id: str,
    data: CommentCreate,
    assignee_id: UUID | None,
    task_title: str,
):
    comment = TaskComment(
        task_id=task_id,
        workspace_id=workspace_id,
        user_id=user_id,
        content=data.content,
    )

    try:
        db.add(comment)
        db.flush()

        event_dispatcher.dispatch(
            CommentAddedEvent(
                db=db,
                task_id=UUID(task_id),
                workspace_id=UUID(workspace_id),
                user_id=UUID(user_id),
                assignee_id=assignee_id,
                task_title=task_title,
            )
        )

        db.commit()
        db.refresh(comment)
    except Exception:
        db.rollback()
        raise

    return comment


def get_comments(
    db: Session,
    task_id: str,
    workspace_id: str,
):
    return db.scalars(
        select(TaskComment)
        .where(
            TaskComment.task_id == task_id,
            TaskComment.workspace_id == workspace_id,
        )
        .order_by(TaskComment.created_at.asc())
    ).all()
