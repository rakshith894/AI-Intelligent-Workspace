from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.models.workspace import Workspace
from app.models.workspace_invitation import WorkspaceInvitation
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
)
from app.services.invitation import create_invitation


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Invitations"],
)

accept_router = APIRouter(
    prefix="/api/v1/invitations",
    tags=["Invitation Acceptance"],
)


@router.post(
    "/{workspace_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_user(
    workspace_id: UUID,
    invitation_data: InvitationCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    # Check workspace
    workspace = db.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id
        )
    )

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check current user's membership
    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace",
        )

    # Only owner/admin can invite
    if membership.role not in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can invite users",
        )

    try:
        invitation = create_invitation(
            db=db,
            workspace_id=str(workspace_id),
            email_data=invitation_data,
            created_by=current_user_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    return InvitationResponse(
        id=str(invitation.id),
        workspace_id=str(invitation.workspace_id),
        email=invitation.email,
        token=invitation.token,
        expires_at=invitation.expires_at,
    )


from app.schemas.invitation import InvitationAcceptResponse
from app.services.invitation import accept_invitation


@accept_router.post(
    "/{token}/accept",
    response_model=InvitationAcceptResponse,
)
def accept_workspace_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    try:
        membership = accept_invitation(
            db=db,
            token=token,
            user_id=current_user_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return InvitationAcceptResponse(
        message="Invitation accepted successfully",
        workspace_id=str(membership.workspace_id),
        role=membership.role,
    )