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


@router.get(
    "/{workspace_id}/invitations",
    response_model=list[InvitationResponse],
)
def list_workspace_invitations(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    # Verify user is owner or admin
    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user_id,
        )
    )

    if not membership or membership.role not in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can view pending invitations",
        )

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    invitations = db.scalars(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.accepted_at.is_(None),
            WorkspaceInvitation.expires_at > now,
        )
    ).all()

    return [
        InvitationResponse(
            id=str(inv.id),
            workspace_id=str(inv.workspace_id),
            email=inv.email,
            token=inv.token,
            expires_at=inv.expires_at,
        )
        for inv in invitations
    ]


@router.delete(
    "/{workspace_id}/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def revoke_workspace_invitation(
    workspace_id: UUID,
    invitation_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user_id,
        )
    )

    if not membership or membership.role not in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can revoke invitations",
        )

    invitation = db.scalar(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.id == invitation_id,
            WorkspaceInvitation.workspace_id == workspace_id,
        )
    )

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    db.delete(invitation)
    db.commit()
    return None



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