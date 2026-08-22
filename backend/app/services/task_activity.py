from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task_activity import TaskActivity


def record_activity(
    db: Session,
    task_id: str,
    workspace_id: str,
    user_id: str,
    action: str,
    details: str | None = None,
):
    activity = TaskActivity(
        task_id=task_id,
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        details=details,
    )

    db.add(activity)


def get_activities(
    db: Session,
    task_id: str,
    workspace_id: str,
):
    return db.scalars(
        select(TaskActivity)
        .where(
            TaskActivity.task_id == task_id,
            TaskActivity.workspace_id == workspace_id,
        )
        .order_by(TaskActivity.created_at.asc())
    ).all()