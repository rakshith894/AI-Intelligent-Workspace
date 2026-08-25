from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.task import Task
from app.events.instance import event_dispatcher
from app.events.types import CommentAddedEvent

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

        if task.assignee_id is not None:
            event_dispatcher.dispatch(
                CommentAddedEvent(
                    db=db,
                    task_id=task.id,
                    workspace_id=task.workspace_id,
                    user_id=UUID(user_id),
                    assignee_id=task.assignee_id,
                    task_title=task.title,
                )
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