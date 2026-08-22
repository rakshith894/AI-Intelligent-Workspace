from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.comment import (
    CommentCreate,
    CommentResponse,
)
from app.services.comment import (
    create_comment,
    get_task_comments,
)

# Use the same authentication dependency
# that your existing task routes use.
from app.api.dependencies import get_current_user_id

from app.services.task import get_task


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Comments"],
)


@router.post(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/comments",
    response_model=CommentResponse,
)
def add_comment(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    task = get_task(
        db=db,
        workspace_id=str(workspace_id),
        project_id=str(project_id),
        task_id=str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    if not data.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Comment cannot be empty",
        )

    return create_comment(
        db=db,
        task=task,
        user_id=current_user_id,
        content=data.content.strip(),
    )


@router.get(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/comments",
    response_model=list[CommentResponse],
)
def list_comments(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    task = get_task(
        db=db,
        workspace_id=str(workspace_id),
        project_id=str(project_id),
        task_id=str(task_id),
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return get_task_comments(
        db=db,
        task_id=str(task_id),
        workspace_id=str(workspace_id),
    )