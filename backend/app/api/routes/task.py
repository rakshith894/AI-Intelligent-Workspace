from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.project import Project
from app.models.task import Task
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.task import (
    TaskCreate,
    TaskLabelInfo,
    TaskResponse,
    TaskUpdate,
)
from app.services.task import (
    create_task,
    delete_task,
    get_task,
    get_tasks,
    update_task,
)
from app.models.label import Label
from app.models.task_label import TaskLabel


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Tasks"],
)


def serialize_task(
    task: Task,
    db: Session,
) -> TaskResponse:

    label_rows = db.execute(
        select(Label)
        .join(
            TaskLabel,
            TaskLabel.label_id == Label.id,
        )
        .where(
            TaskLabel.task_id == task.id
        )
        .order_by(Label.name.asc())
    ).scalars().all()

    labels = [
        TaskLabelInfo(
            id=str(label.id),
            name=label.name,
            color=label.color,
        )
        for label in label_rows
    ]

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id),
        workspace_id=str(task.workspace_id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        assignee_id=(
            str(task.assignee_id)
            if task.assignee_id
            else None
        ),
        due_date=task.due_date,
        created_by=str(task.created_by),
        created_at=task.created_at,
        updated_at=task.updated_at,
        labels=labels,
    )


def get_project_or_404(
    db: Session,
    workspace_id: UUID,
    project_id: UUID,
):
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.workspace_id == workspace_id,
        )
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.post(
    "/{workspace_id}/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_task(
    workspace_id: UUID,
    project_id: UUID,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    get_project_or_404(
        db,
        workspace_id,
        project_id,
    )

    try:
        task = create_task(
            db=db,
            workspace_id=str(workspace_id),
            project_id=str(project_id),
            user_id=current_user_id,
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return serialize_task(task, db)


@router.get(
    "/{workspace_id}/projects/{project_id}/tasks",
    response_model=list[TaskResponse],
)
def list_project_tasks(
    workspace_id: UUID,
    project_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    get_project_or_404(
        db,
        workspace_id,
        project_id,
    )

    tasks = get_tasks(
        db,
        str(workspace_id),
        str(project_id),
    )

    return [
        serialize_task(task, db)
        for task in tasks
    ]


@router.get(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}",
    response_model=TaskResponse,
)
def get_project_task(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    get_project_or_404(
        db,
        workspace_id,
        project_id,
    )

    task = get_task(
        db,
        str(workspace_id),
        str(project_id),
        str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return serialize_task(task, db)


@router.patch(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}",
    response_model=TaskResponse,
)
def update_project_task(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    get_project_or_404(
        db,
        workspace_id,
        project_id,
    )

    task = get_task(
        db,
        str(workspace_id),
        str(project_id),
        str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    try:
        task = update_task(
            db,
            task,
            data,
            current_user_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return serialize_task(task, db)


@router.delete(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project_task(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin")
    ),
):
    get_project_or_404(
        db,
        workspace_id,
        project_id,
    )

    task = get_task(
        db,
        str(workspace_id),
        str(project_id),
        str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    delete_task(db, task)

    return None