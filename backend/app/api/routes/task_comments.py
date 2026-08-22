from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.task_comment import TaskComment
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.task_comment import CommentCreate, CommentResponse
from app.services.task import get_task
from app.services.task_comment import create_comment, get_comments
from app.models.task_activity import TaskActivity
from app.schemas.task_activity import ActivityResponse
from app.services.task_activity import get_activities


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Task Comments"],
)


def serialize_comment(comment: TaskComment) -> CommentResponse:
    return CommentResponse(
        id=str(comment.id),
        task_id=str(comment.task_id),
        workspace_id=str(comment.workspace_id),
        user_id=str(comment.user_id),
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.post(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_task_comment(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    comment = create_comment(
        db=db,
        task_id=str(task.id),
        workspace_id=str(workspace_id),
        user_id=current_user_id,
        data=data,
    )

    return serialize_comment(comment)


@router.get(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/comments",
    response_model=list[CommentResponse],
)
def list_task_comments(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    comments = get_comments(
        db,
        str(task.id),
        str(workspace_id),
    )

    return [
        serialize_comment(comment)
        for comment in comments
    ]
def serialize_activity(
    activity: TaskActivity,
) -> ActivityResponse:
    return ActivityResponse(
        id=str(activity.id),
        task_id=str(activity.task_id),
        workspace_id=str(activity.workspace_id),
        user_id=str(activity.user_id),
        action=activity.action,
        details=activity.details,
        created_at=activity.created_at,
    )
@router.get(
    "/{workspace_id}/projects/{project_id}/tasks/{task_id}/activity",
    response_model=list[ActivityResponse],
)
def list_task_activity(
    workspace_id: UUID,
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    activities = get_activities(
        db,
        str(task.id),
        str(workspace_id),
    )

    return [
        serialize_activity(activity)
        for activity in activities
    ]