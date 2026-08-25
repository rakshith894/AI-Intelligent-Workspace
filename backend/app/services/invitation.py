import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update
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
    email = str(email_data.email).lower().strip()

    # Check whether the user is already a member
    user = db.scalar(
        select(User).where(
            func.lower(User.email) == email
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

    token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    # Check for ANY existing invitation (pending or previously accepted)
    existing_invitation = db.scalar(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace_id,
            func.lower(WorkspaceInvitation.email) == email,
        )
    )

    if existing_invitation:
        # Refresh the existing invitation with a new token, new expiration, reset accepted_at, and update inviter
        existing_invitation.token = token
        existing_invitation.expires_at = expires_at
        existing_invitation.created_by = created_by
        existing_invitation.accepted_at = None
        existing_invitation.created_at = datetime.now(timezone.utc)
        invitation = existing_invitation
    else:
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
            title=f"Invitation to join '{workspace_name}'",
            message=(
                f"{inviter_name} has invited you to join "
                f"workspace '{workspace_name}'. Open Workspace Members to accept."
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

    # Make expires_at timezone-aware for comparison
    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        from datetime import timezone as tz
        expires_at = expires_at.replace(tzinfo=tz.utc)

    if expires_at <= now:
        raise ValueError("Invitation has expired")

    user = db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if not user:
        raise ValueError("User not found")

    if user.email.lower().strip() != invitation.email.lower().strip():
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
        # Already a member — mark invitation accepted and return gracefully
        invitation.accepted_at = now
        db.commit()
        db.refresh(existing_membership)
        return existing_membership

    membership = WorkspaceMembership(
        user_id=user.id,
        workspace_id=invitation.workspace_id,
        role=WorkspaceRole.MEMBER.value,
    )

    db.add(membership)
    invitation.accepted_at = now

    # Get workspace name
    workspace = db.scalar(
        select(Workspace).where(Workspace.id == invitation.workspace_id)
    )
    workspace_name = workspace.name if workspace else "Workspace"
    joiner_name = user.full_name or user.email

    # 1. Notify the inviter / workspace owner
    create_notification(
        db=db,
        user_id=str(invitation.created_by),
        workspace_id=str(invitation.workspace_id),
        notification_type="member_joined",
        title="New member joined",
        message=f"{joiner_name} has accepted your invitation and joined '{workspace_name}'",
    )

    # 2. Notify the newly joined member
    create_notification(
        db=db,
        user_id=str(user.id),
        workspace_id=str(invitation.workspace_id),
        notification_type="member_joined",
        title=f"Joined {workspace_name}",
        message=f"You are now a member of '{workspace_name}'. You can collaborate on projects and tasks.",
    )

    # 3. Mark any existing workspace_invitation notifications for this user/workspace as read
    from app.models.notification import Notification
    from uuid import UUID
    db.execute(
        update(Notification)
        .where(
            Notification.user_id == UUID(user_id),
            Notification.type == "workspace_invitation",
        )
        .values(is_read=True)
    )

    db.commit()
    db.refresh(membership)

    return membership