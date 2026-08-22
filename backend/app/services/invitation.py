import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace_invitation import WorkspaceInvitation
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.invitation import InvitationCreate


def create_invitation(
    db: Session,
    workspace_id: str,
    email_data: InvitationCreate,
    created_by: str,
) -> WorkspaceInvitation:

    # Check whether the user is already a member
    existing_user = db.scalar(
        select(User).where(
            User.email == email_data.email
        )
    )

    if existing_user:
        existing_membership = db.scalar(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.user_id == existing_user.id,
            )
        )

        if existing_membership:
            raise ValueError(
                "User is already a member of this workspace"
            )

    # Check for an existing invitation
    existing_invitation = db.scalar(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.email == email_data.email,
            WorkspaceInvitation.accepted_at.is_(None),
        )
    )

    if existing_invitation:
        raise ValueError(
            "An active invitation already exists for this email"
        )

    token = secrets.token_urlsafe(48)

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = WorkspaceInvitation(
        workspace_id=workspace_id,
        email=email_data.email,
        token=token,
        expires_at=expires_at,
        created_by=created_by,
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return invitation
from datetime import datetime, timezone

from app.models.workspace_membership import (
    WorkspaceMembership,
    WorkspaceRole,
)


def accept_invitation(
    db: Session,
    token: str,
    user_id: str,
) -> WorkspaceMembership:

    invitation = db.scalar(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.token == token
        )
    )

    if not invitation:
        raise ValueError("Invalid invitation")

    if invitation.accepted_at is not None:
        raise ValueError("Invitation has already been accepted")

    now = datetime.now(timezone.utc)

    if invitation.expires_at <= now:
        raise ValueError("Invitation has expired")

    user = db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if not user:
        raise ValueError("User not found")

    if user.email.lower() != invitation.email.lower():
        raise ValueError(
            "This invitation was sent to a different email address"
        )

    existing_membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == invitation.workspace_id,
            WorkspaceMembership.user_id == user.id,
        )
    )

    if existing_membership:
        raise ValueError(
            "You are already a member of this workspace"
        )

    membership = WorkspaceMembership(
        user_id=user.id,
        workspace_id=invitation.workspace_id,
        role=WorkspaceRole.MEMBER.value,
    )

    db.add(membership)

    invitation.accepted_at = now

    db.commit()
    db.refresh(membership)

    return membership