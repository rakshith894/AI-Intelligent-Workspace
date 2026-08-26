from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.permission import require_workspace_role
from app.core.database import get_db

from app.models.label import Label
from app.models.project import Project
from app.models.task import Task
from app.models.task_label import TaskLabel
from app.models.workspace_membership import WorkspaceMembership

from app.schemas.task import (
    TaskCreate,
    TaskLabelInfo,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
)

from app.services.task import (
    create_task,
    delete_task,
    get_task,
    search_tasks,
    update_task,
)


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Tasks"],
)


# ============================================================
# SERIALIZE SINGLE TASK
# ============================================================

def serialize_task(
    task: Task,
    db: Session,
) -> TaskResponse:

    label_rows = (
        db.execute(
            select(Label)
            .join(
                TaskLabel,
                TaskLabel.label_id == Label.id,
            )
            .where(
                TaskLabel.task_id == task.id,
            )
            .order_by(
                Label.name.asc(),
            )
        )
        .scalars()
        .all()
    )

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
            if task.assignee_id is not None
            else None
        ),
        due_date=task.due_date,
        created_by=str(task.created_by),
        created_at=task.created_at,
        updated_at=task.updated_at,
        labels=labels,
    )


# ============================================================
# SERIALIZE MULTIPLE TASKS
# Avoid N+1 label queries
# ============================================================

def serialize_tasks(
    tasks: list[Task],
    db: Session,
) -> list[TaskResponse]:

    if not tasks:
        return []

    task_ids = [
        task.id
        for task in tasks
    ]

    rows = (
        db.execute(
            select(TaskLabel, Label)
            .join(
                Label,
                TaskLabel.label_id == Label.id,
            )
            .where(
                TaskLabel.task_id.in_(task_ids),
            )
            .order_by(
                Label.name.asc(),
            )
        )
        .all()
    )

    labels_by_task: dict[
        UUID,
        list[TaskLabelInfo],
    ] = {}

    for task_label, label in rows:

        labels_by_task.setdefault(
            task_label.task_id,
            [],
        ).append(
            TaskLabelInfo(
                id=str(label.id),
                name=label.name,
                color=label.color,
            )
        )

    return [
        TaskResponse(
            id=str(task.id),
            project_id=str(task.project_id),
            workspace_id=str(task.workspace_id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            assignee_id=(
                str(task.assignee_id)
                if task.assignee_id is not None
                else None
            ),
            due_date=task.due_date,
            created_by=str(task.created_by),
            created_at=task.created_at,
            updated_at=task.updated_at,
            labels=labels_by_task.get(
                task.id,
                [],
            ),
        )
        for task in tasks
    ]


# ============================================================
# PROJECT VALIDATION
# ============================================================

def get_project_or_404(
    db: Session,
    workspace_id: UUID,
    project_id: UUID,
) -> Project:

    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.workspace_id == workspace_id,
        )
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


# ============================================================
# CREATE TASK
# ============================================================

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
    current_user_id: str = Depends(
        __import__(
            "app.api.dependencies",
            fromlist=["get_current_user_id"],
        ).get_current_user_id
    ),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
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

    return serialize_task(
        task,
        db,
    )


# ============================================================
# LIST / SEARCH WORKSPACE TASKS (ALL PROJECTS)
# ============================================================

@router.get(
    "/{workspace_id}/tasks",
    response_model=TaskListResponse,
)
def search_workspace_tasks(
    workspace_id: UUID,
    project_id: UUID | None = Query(
        default=None,
    ),
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    priority: str | None = Query(
        default=None,
    ),
    assignee_id: UUID | None = Query(
        default=None,
    ),
    label_id: UUID | None = Query(
        default=None,
    ),
    sort_by: str = Query(
        default="created_at",
    ),
    sort_order: str = Query(
        default="desc",
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
            "viewer",
        )
    ),
):
    tasks, total = search_tasks(
        db=db,
        workspace_id=str(workspace_id),
        project_id=str(project_id) if project_id else None,
        search=search,
        status=status_filter,
        priority=priority,
        assignee_id=(
            str(assignee_id)
            if assignee_id is not None
            else None
        ),
        label_id=(
            str(label_id)
            if label_id is not None
            else None
        ),
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return TaskListResponse(
        items=serialize_tasks(
            tasks,
            db,
        ),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ============================================================
# LIST / SEARCH TASKS BY PROJECT
# ============================================================

@router.get(
    "/{workspace_id}/projects/{project_id}/tasks",
    response_model=TaskListResponse,
)
def search_project_tasks(
    workspace_id: UUID,
    project_id: UUID,
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    priority: str | None = Query(
        default=None,
    ),
    assignee_id: UUID | None = Query(
        default=None,
    ),
    label_id: UUID | None = Query(
        default=None,
    ),
    sort_by: str = Query(
        default="created_at",
    ),
    sort_order: str = Query(
        default="desc",
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
            "viewer",
        )
    ),
):

    get_project_or_404(
        db,
        workspace_id,
        project_id,
    )

    tasks, total = search_tasks(
        db=db,
        workspace_id=str(workspace_id),
        project_id=str(project_id),
        search=search,
        status=status_filter,
        priority=priority,
        assignee_id=(
            str(assignee_id)
            if assignee_id is not None
            else None
        ),
        label_id=(
            str(label_id)
            if label_id is not None
            else None
        ),
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return TaskListResponse(
        items=serialize_tasks(
            tasks,
            db,
        ),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ============================================================
# GET SINGLE TASK
# ============================================================

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
        require_workspace_role(
            "owner",
            "admin",
            "member",
            "viewer",
        )
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

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return serialize_task(
        task,
        db,
    )


# ============================================================
# UPDATE TASK
# ============================================================

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
    current_user_id: str = Depends(
        __import__(
            "app.api.dependencies",
            fromlist=["get_current_user_id"],
        ).get_current_user_id
    ),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
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

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    try:
        task = update_task(
            db=db,
            task=task,
            data=data,
            user_id=current_user_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return serialize_task(
        task,
        db,
    )


# ============================================================
# DELETE TASK
# ============================================================

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
        require_workspace_role(
            "owner",
            "admin",
        )
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

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    delete_task(
        db,
        task,
    )

    return None