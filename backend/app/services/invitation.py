import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_invitation import WorkspaceInvitation
from app.models.workspace_membership import (
    WorkspaceMembership,
    WorkspaceRole,
)
from app.schemas.invitation import InvitationCreate

from app.services.notification import create_notification


from app.services.email import send_invitation_email


def create_invitation(
    db: Session,
    workspace_id: str,
    email_data: InvitationCreate,
    created_by: str,
) -> WorkspaceInvitation:
    email = str(email_data.email).lower()

    # Check whether the user is already a member
    user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if user:
        existing_membership = db.scalar(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.user_id == user.id,
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
            WorkspaceInvitation.email == email,
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
        email=email,
        token=token,
        expires_at=expires_at,
        created_by=created_by,
    )

    db.add(invitation)

    workspace = db.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id
        )
    )

    inviter = db.scalar(
        select(User).where(
            User.id == created_by
        )
    )
    inviter_name = inviter.full_name if inviter else "A team member"
    workspace_name = workspace.name if workspace else "Workspace"

    if user and workspace:
        create_notification(
            db=db,
            user_id=str(user.id),
            workspace_id=str(workspace_id),
            notification_type="workspace_invitation",
            title="Workspace invitation",
            message=(
                f"You have been invited to join "
                f"workspace '{workspace_name}'"
            ),
        )

    # Send Invitation Email with Token to Recipient's Gmail
    send_invitation_email(
        to_email=email,
        workspace_name=workspace_name,
        token=token,
        inviter_name=inviter_name,
    )

    db.commit()
    db.refresh(invitation)

    return invitation


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