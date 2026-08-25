from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister


def create_user(db: Session, user_data: UserRegister) -> User:
    email = user_data.email.lower().strip()
    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise ValueError("Email is already registered")

    user = User(
        email=email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Check for any pending invitations for this new user's email and create in-app notifications
    try:
        from datetime import datetime, timezone
        from sqlalchemy import func
        from app.models.workspace import Workspace
        from app.models.workspace_invitation import WorkspaceInvitation
        from app.services.notification import create_notification

        now = datetime.now(timezone.utc)
        pending_invites = db.scalars(
            select(WorkspaceInvitation).where(
                func.lower(WorkspaceInvitation.email) == email,
                WorkspaceInvitation.accepted_at.is_(None),
                WorkspaceInvitation.expires_at > now,
            )
        ).all()

        for inv in pending_invites:
            ws = db.scalar(select(Workspace).where(Workspace.id == inv.workspace_id))
            ws_name = ws.name if ws else "Workspace"
            inviter = db.scalar(select(User).where(User.id == inv.created_by))
            inviter_name = inviter.full_name if inviter else "A team member"

            create_notification(
                db=db,
                user_id=str(user.id),
                workspace_id=str(inv.workspace_id),
                notification_type="workspace_invitation",
                title=f"Invitation to join '{ws_name}'",
                message=f"{inviter_name} has invited you to join workspace '{ws_name}'. Open Workspace Members to accept.",
            )
        db.commit()
    except Exception as exc:
        print(f"[AUTH REGISTER] Failed to create pending invite notification: {exc}")

    return user


def authenticate_user(
    db: Session,
    credentials: UserLogin,
) -> User | None:
    email = credentials.email.lower().strip()
    user = db.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        return None

    if not verify_password(
        credentials.password,
        user.password_hash,
    ):
        return None

    if not user.is_active:
        return None

    return user


from app.services.email import send_login_notification_email


def login_user(
    db: Session,
    credentials: UserLogin,
) -> str:
    user = authenticate_user(db, credentials)

    if not user:
        raise ValueError("Invalid email or password")

    # Send login alert email to user's Gmail
    send_login_notification_email(
        to_email=user.email,
        full_name=user.full_name,
    )

    return create_access_token(str(user.id))