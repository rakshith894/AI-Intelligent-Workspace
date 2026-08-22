from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.label import (
    LabelCreate,
    LabelResponse,
    TaskLabelResponse,
)
from app.services.label import (
    attach_label,
    create_label,
    get_labels,
    remove_label,
)
from app.services.task import get_task


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Labels"],
)


def serialize_label(label):
    return LabelResponse(
        id=str(label.id),
        workspace_id=str(label.workspace_id),
        name=label.name,
        color=label.color,
    )


@router.post(
    "/{workspace_id}/labels",
    response_model=LabelResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workspace_label(
    workspace_id: UUID,
    data: LabelCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin")
    ),
):
    try:
        label = create_label(
            db,
            str(workspace_id),
            data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    return serialize_label(label)


@router.get(
    "/{workspace_id}/labels",
    response_model=list[LabelResponse],
)
def list_workspace_labels(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
    ),
):
    labels = get_labels(
        db,
        str(workspace_id),
    )

    return [
        serialize_label(label)
        for label in labels
    ]


@router.post(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/labels/{label_id}",
    response_model=TaskLabelResponse,
)
def add_label_to_task(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    label_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
    ),
):
    task = get_task(
        db,
        str(workspace_id),
        str(project_id),
        str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    try:
        task_label = attach_label(
            db,
            str(task.id),
            str(workspace_id),
            str(label_id),
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    return TaskLabelResponse(
        task_id=str(task_label.task_id),
        label_id=str(task_label.label_id),
    )


@router.delete(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_label_from_task(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    label_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
    ),
):
    task = get_task(
        db,
        str(workspace_id),
        str(project_id),
        str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    try:
        remove_label(
            db,
            str(task.id),
            str(label_id),
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    return None