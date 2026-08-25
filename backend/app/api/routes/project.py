from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project import (
    create_project,
    delete_project,
    get_project,
    get_projects,
    update_project,
)


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Projects"],
)


def serialize_project(project):
    return ProjectResponse(
        id=str(project.id),
        workspace_id=str(project.workspace_id),
        name=project.name,
        slug=project.slug,
        description=project.description,
        project_url=getattr(project, "project_url", None),
        created_by=str(project.created_by),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post(
    "/{workspace_id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workspace_project(
    workspace_id: UUID,
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    project = create_project(
        db=db,
        workspace_id=str(workspace_id),
        user_id=current_user_id,
        data=data,
    )

    return serialize_project(project)


@router.get(
    "/{workspace_id}/projects",
    response_model=list[ProjectResponse],
)
def list_workspace_projects(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    projects = get_projects(
        db,
        str(workspace_id),
    )

    return [
        serialize_project(project)
        for project in projects
    ]


@router.get(
    "/{workspace_id}/projects/{project_id}",
    response_model=ProjectResponse,
)
def get_workspace_project(
    workspace_id: UUID,
    project_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    project = get_project(
        db,
        str(workspace_id),
        str(project_id),
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return serialize_project(project)


@router.patch(
    "/{workspace_id}/projects/{project_id}",
    response_model=ProjectResponse,
)
def update_workspace_project(
    workspace_id: UUID,
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    project = get_project(
        db,
        str(workspace_id),
        str(project_id),
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    project = update_project(
        db,
        project,
        data,
    )

    return serialize_project(project)


@router.delete(
    "/{workspace_id}/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_workspace_project(
    workspace_id: UUID,
    project_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner")
    ),
):
    project = get_project(
        db,
        str(workspace_id),
        str(project_id),
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    delete_project(db, project)

    return None