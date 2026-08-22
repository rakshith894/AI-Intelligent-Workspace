from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.task import Task


def get_member_workload(
    db: Session,
    workspace_id: str,
):
    rows = db.execute(
        select(
            Task.assignee_id,
            func.count(Task.id).label("total_tasks"),
            func.count(
                Task.id
            ).filter(
                Task.status == "done"
            ).label("completed_tasks"),
            func.count(
                Task.id
            ).filter(
                Task.status == "in_progress"
            ).label("in_progress_tasks"),
            func.count(
                Task.id
            ).filter(
                Task.due_date.is_not(None),
                Task.due_date < datetime.now(timezone.utc),
                Task.status.notin_(
                    ["done", "cancelled"]
                ),
            ).label("overdue_tasks"),
        )
        .where(
            Task.workspace_id == workspace_id,
            Task.assignee_id.is_not(None),
        )
        .group_by(Task.assignee_id)
    ).all()

    result = []

    for row in rows:
        total = row.total_tasks
        completed = row.completed_tasks

        completion_rate = (
            (completed / total) * 100
            if total
            else 0
        )

        result.append(
            {
                "user_id": str(row.assignee_id),
                "total_tasks": total,
                "completed_tasks": completed,
                "in_progress_tasks": row.in_progress_tasks,
                "overdue_tasks": row.overdue_tasks,
                "completion_rate": round(
                    completion_rate,
                    2,
                ),
            }
        )

    return result