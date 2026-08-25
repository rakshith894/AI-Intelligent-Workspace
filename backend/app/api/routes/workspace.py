from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
)
from app.services.workspace import (
    create_workspace,
    update_workspace,
    delete_workspace,
    leave_workspace,
)


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Workspaces"],
)


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_workspace(
    workspace_data: WorkspaceCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    workspace = create_workspace(
        db=db,
        workspace_data=workspace_data,
        owner_id=user_id,
    )

    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        slug=workspace.slug,
        owner_id=str(workspace.owner_id),
    )


@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
)
def rename_workspace(
    workspace_id: UUID,
    data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    try:
        workspace = update_workspace(
            db=db,
            workspace_id=str(workspace_id),
            name=data.name,
            user_id=user_id,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err

    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        slug=workspace.slug,
        owner_id=str(workspace.owner_id),
    )


@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    try:
        delete_workspace(
            db=db,
            workspace_id=str(workspace_id),
            user_id=user_id,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err

    return None


@router.post(
    "/{workspace_id}/leave",
    status_code=status.HTTP_200_OK,
)
def leave_user_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    try:
        leave_workspace(
            db=db,
            workspace_id=str(workspace_id),
            user_id=user_id,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err

    return {"message": "Successfully left workspace"}


@router.get(
    "/{workspace_id}/export",
    status_code=status.HTTP_200_OK,
)
def export_workspace_data(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from app.models.task import Task
    from app.models.project import Project
    from app.models.workspace import Workspace
    from app.models.workspace_membership import WorkspaceMembership
    from app.models.user import User

    # Verify membership
    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user_id,
        )
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a workspace member to export data",
        )

    workspace = db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Fetch members
    members_rows = db.execute(
        select(WorkspaceMembership, User)
        .join(User, User.id == WorkspaceMembership.user_id)
        .where(WorkspaceMembership.workspace_id == workspace_id)
    ).all()

    # Fetch projects
    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_id)
    ).all()

    # Fetch tasks
    tasks = db.scalars(
        select(Task).where(Task.workspace_id == workspace_id)
    ).all()

    # Map project names
    project_map = {str(p.id): p.name for p in projects}
    user_map = {str(u.id): (u.full_name or u.email) for _, u in members_rows}

    return {
        "workspace": {
            "id": str(workspace.id),
            "name": workspace.name,
            "slug": workspace.slug,
            "created_at": str(workspace.created_at) if hasattr(workspace, "created_at") else None,
        },
        "members": [
            {
                "user_id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": m.role,
            }
            for m, u in members_rows
        ],
        "projects": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
            }
            for p in projects
        ],
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "due_date": str(t.due_date) if t.due_date else None,
                "project_name": project_map.get(str(t.project_id), "General") if t.project_id else "General",
                "assignee": user_map.get(str(t.assignee_id), "Unassigned") if t.assignee_id else "Unassigned",
            }
            for t in tasks
        ],
    }
