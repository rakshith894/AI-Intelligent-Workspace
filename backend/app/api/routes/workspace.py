from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
)
from app.services.workspace import create_workspace


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