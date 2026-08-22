from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.models.user import User
from app.models.workspace_membership import WorkspaceMembership
from app.services.task_activity import record_activity
from app.services.notification import create_notification
from app.services.task_workflow import (
    validate_status_transition,
)
from app.models.label import Label
from app.models.task_label import TaskLabel

VALID_STATUSES = {
    "todo",
    "in_progress",
    "in_review",
    "done",
    "cancelled",
}

VALID_PRIORITIES = {
    "low",
    "medium",
    "high",
    "urgent",
}


def create_task(
    db: Session,
    workspace_id: str,
    project_id: str,
    user_id: str,
    data: TaskCreate,
) -> Task:

    if data.status not in VALID_STATUSES:
        raise ValueError("Invalid task status")

    if data.priority not in VALID_PRIORITIES:
        raise ValueError("Invalid task priority")
    
    assignee_id = validate_assignee(
    db,
    workspace_id,
    data.assignee_id,
)

    task = Task(
        workspace_id=workspace_id,
        project_id=project_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        assignee_id=assignee_id,
        due_date=data.due_date,
        created_by=user_id,
    )

    try:
        db.add(task)
        db.flush()
        if assignee_id is not None:
            create_notification(
                db=db,
                user_id=str(assignee_id),
                workspace_id=str(task.workspace_id),
                task_id=str(task.id),
                notification_type="task_assigned",
                title="New task assigned",
                message=f"You were assigned task '{task.title}'",
            )
        record_activity(
            db=db,
            task_id=str(task.id),
            workspace_id=workspace_id,
            user_id=user_id,
            action="task_created",
            details=f"Task '{task.title}' was created",
        )
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task


def get_tasks(
    db: Session,
    workspace_id: str,
    project_id: str,
):
    return db.scalars(
        select(Task)
        .where(
            Task.workspace_id == workspace_id,
            Task.project_id == project_id,
        )
        .order_by(Task.created_at.desc())
    ).all()


def get_task(
    db: Session,
    workspace_id: str,
    project_id: str,
    task_id: str,
):
    return db.scalar(
        select(Task).where(
            Task.id == task_id,
            Task.workspace_id == workspace_id,
            Task.project_id == project_id,
        )
    )


def update_task(
    db: Session,
    task: Task,
    data: TaskUpdate,
    user_id: str,
) -> Task:
    if not data.model_fields_set:
        raise ValueError("At least one field is required to update a task")

    old_status = task.status
    old_assignee_id = task.assignee_id

    if "status" in data.model_fields_set and data.status is not None:
        if data.status not in VALID_STATUSES:
            raise ValueError(
                "Invalid task status"
            )

        validate_status_transition(
            task.status,
            data.status,
        )
        task.status = data.status

    if data.priority is not None:
        if data.priority not in VALID_PRIORITIES:
            raise ValueError("Invalid task priority")
        task.priority = data.priority

    if data.title is not None:
        task.title = data.title

    if "description" in data.model_fields_set:
        task.description = data.description

    if "assignee_id" in data.model_fields_set:
        validate_assignee(
            db,
            str(task.workspace_id),
            data.assignee_id,
        )

    if "due_date" in data.model_fields_set:
        task.due_date = data.due_date

    try:
        if data.assignee_id is not None:
            task.assignee_id = data.assignee_id

            if old_assignee_id != data.assignee_id:
                create_notification(
                    db=db,
                    user_id=str(data.assignee_id),
                    workspace_id=str(task.workspace_id),
                    task_id=str(task.id),
                    notification_type="task_assigned",
                    title="New task assigned",
                    message=f"You were assigned task '{task.title}'",
                )

        if (
            "status" in data.model_fields_set
            and data.status is not None
            and old_status != data.status
        ):
            record_activity(
                db=db,
                task_id=str(task.id),
                workspace_id=str(task.workspace_id),
                user_id=user_id,
                action="status_changed",
                details=(
                    f"Status changed from "
                    f"'{old_status}' to "
                    f"'{data.status}'"
                ),
            )

        record_activity(
            db=db,
            task_id=str(task.id),
            workspace_id=str(task.workspace_id),
            user_id=user_id,
            action="task_updated",
            details=f"Task '{task.title}' was updated",
        )
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task


def delete_task(
    db: Session,
    task: Task,
):
    try:
        db.delete(task)
        db.commit()
    except Exception:
        db.rollback()
        raise

def validate_assignee(
    db: Session,
    workspace_id: str,
    assignee_id: UUID | None,
):
    if assignee_id is None:
        return None

    user = db.scalar(
        select(User).where(
            User.id == assignee_id
        )
    )

    if not user:
        raise ValueError(
            "Assignee user not found"
        )

    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == assignee_id,
        )
    )

    if not membership:
        raise ValueError(
            "Assignee must be a member of this workspace"
        )

    return assignee_id
def search_tasks(
    db: Session,
    workspace_id: str,
    project_id: str,
    search: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    assignee_id: str | None = None,
    label_id: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
):
    conditions = [
        Task.workspace_id == workspace_id,
        Task.project_id == project_id,
    ]

    # Search
    if search:
        search_pattern = f"%{search}%"

        conditions.append(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
            )
        )

    # Status
    if status:
        conditions.append(
            Task.status == status
        )

    # Priority
    if priority:
        conditions.append(
            Task.priority == priority
        )

    # Assignee
    if assignee_id:
        conditions.append(
            Task.assignee_id == assignee_id
        )

    # Label
    if label_id:
        conditions.append(
            Task.id.in_(
                select(TaskLabel.task_id)
                .where(
                    TaskLabel.label_id == label_id
                )
            )
        )

    # Total count
    total = db.scalar(
        select(func.count())
        .select_from(Task)
        .where(*conditions)
    ) or 0

    # Sorting
    sort_columns = {
        "created_at": Task.created_at,
        "updated_at": Task.updated_at,
        "title": Task.title,
        "priority": Task.priority,
        "due_date": Task.due_date,
        "status": Task.status,
    }

    sort_column = sort_columns.get(
        sort_by,
        Task.created_at,
    )

    if sort_order.lower() == "asc":
        order = sort_column.asc()
    else:
        order = sort_column.desc()

    # Pagination
    offset = (page - 1) * page_size

    tasks = db.scalars(
        select(Task)
        .where(*conditions)
        .order_by(order)
        .offset(offset)
        .limit(page_size)
    ).all()

    return tasks, total