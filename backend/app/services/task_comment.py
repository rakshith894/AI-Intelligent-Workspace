from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task_comment import TaskComment
from app.schemas.task_comment import CommentCreate


def create_comment(
    db: Session,
    task_id: str,
    workspace_id: str,
    user_id: str,
    data: CommentCreate,
):
    comment = TaskComment(
        task_id=task_id,
        workspace_id=workspace_id,
        user_id=user_id,
        content=data.content,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

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