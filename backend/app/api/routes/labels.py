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
    delete_label,
    get_labels,
    remove_label,
)
from app.services.task import get_task


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Labels"],
)


# ============================================================
# SERIALIZE LABEL
# ============================================================

def serialize_label(label) -> LabelResponse:
    return LabelResponse(
        id=str(label.id),
        workspace_id=str(label.workspace_id),
        name=label.name,
        color=label.color,
    )


# ============================================================
# CREATE LABEL
# ============================================================

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
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
    ),
):
    try:
        label = create_label(
            db=db,
            workspace_id=str(workspace_id),
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return serialize_label(label)


# ============================================================
# GET WORKSPACE LABELS
# ============================================================

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
        db=db,
        workspace_id=str(workspace_id),
    )

    return [
        serialize_label(label)
        for label in labels
    ]


# ============================================================
# DELETE WORKSPACE LABEL
# ============================================================

@router.delete(
    "/{workspace_id}/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_workspace_label(
    workspace_id: UUID,
    label_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
    ),
):
    try:
        delete_label(
            db=db,
            workspace_id=str(workspace_id),
            label_id=str(label_id),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return None


# ============================================================
# ATTACH LABEL TO TASK
# ============================================================

@router.post(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/labels/{label_id}",
    response_model=TaskLabelResponse,
    status_code=status.HTTP_200_OK,
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

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    try:
        task_label = attach_label(
            db=db,
            task_id=str(task.id),
            workspace_id=str(workspace_id),
            label_id=str(label_id),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return TaskLabelResponse(
        task_id=str(task_label.task_id),
        label_id=str(task_label.label_id),
    )


# ============================================================
# REMOVE LABEL FROM TASK
# ============================================================

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

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    try:
        remove_label(
            db=db,
            task_id=str(task.id),
            label_id=str(label_id),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return None