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