from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.task import Task


def get_workspace_analytics(
    db: Session,
    workspace_id: str,
):
    base_filter = (
        Task.workspace_id == workspace_id
    )

    total_tasks = db.scalar(
        select(func.count(Task.id))
        .where(base_filter)
    ) or 0

    completed_tasks = db.scalar(
        select(func.count(Task.id))
        .where(
            base_filter,
            Task.status == "done",
        )
    ) or 0

    overdue_tasks = db.scalar(
        select(func.count(Task.id))
        .where(
            base_filter,
            Task.due_date.is_not(None),
            Task.due_date < datetime.now(timezone.utc),
            Task.status.notin_(
                ["done", "cancelled"]
            ),
        )
    ) or 0

    status_rows = db.execute(
        select(
            Task.status,
            func.count(Task.id),
        )
        .where(base_filter)
        .group_by(Task.status)
    ).all()

    status_counts = {
        "todo": 0,
        "in_progress": 0,
        "in_review": 0,
        "done": 0,
        "cancelled": 0,
    }

    for status, count in status_rows:
        if status in status_counts:
            status_counts[status] = count

    priority_rows = db.execute(
        select(
            Task.priority,
            func.count(Task.id),
        )
        .where(base_filter)
        .group_by(Task.priority)
    ).all()

    priority_counts = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "urgent": 0,
    }

    for priority, count in priority_rows:
        if priority in priority_counts:
            priority_counts[priority] = count

    completion_rate = (
        (completed_tasks / total_tasks) * 100
        if total_tasks
        else 0
    )

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_rate": round(
            completion_rate,
            2,
        ),
        "status": status_counts,
        "priority": priority_counts,
    }