import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister

from app.services.email import (
    send_login_notification_email,
    send_password_reset_email,
    send_welcome_email,
)


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

    # Send welcome email in background (non-blocking)
    try:
        send_welcome_email(
            to_email=user.email,
            full_name=user.full_name or "",
        )
    except Exception as exc:
        print(f"[AUTH REGISTER] Welcome email failed (non-critical): {exc}")

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


def login_user(
    db: Session,
    credentials: UserLogin,
) -> str:
    user = authenticate_user(db, credentials)

    if not user:
        raise ValueError("Invalid email or password")

    # Send login alert email to user's Gmail (background, non-blocking)
    try:
        send_login_notification_email(
            to_email=user.email,
            full_name=user.full_name or "",
        )
    except Exception as exc:
        print(f"[AUTH LOGIN] Login notification email failed (non-critical): {exc}")

    return create_access_token(str(user.id))


def request_password_reset(db: Session, email: str) -> dict:
    email_clean = email.lower().strip()
    user = db.scalar(select(User).where(User.email == email_clean))

    if not user:
        # Return generic message to prevent user enumeration
        return {
            "message": "If an account with that email exists, a password reset code has been sent.",
            "reset_token": None,
        }

    # Generate a cryptographically secure 6-digit reset token
    reset_code = secrets.randbelow(900000) + 100000
    reset_token = f"RESET-{reset_code}"

    # Send beautiful HTML password reset email
    try:
        send_password_reset_email(
            to_email=user.email,
            full_name=user.full_name or "",
            reset_token=reset_token,
        )
        print(f"[PASSWORD RESET] Reset email dispatched to {email_clean}")
    except Exception as exc:
        print(f"[PASSWORD RESET EMAIL WARNING] {exc}")

    return {
        "message": f"Password reset code dispatched to {email_clean}. Check your inbox (and spam folder).",
        "reset_token": reset_token,
    }


def reset_password(db: Session, email: str, reset_token: str, new_password: str) -> dict:
    email_clean = email.lower().strip()
    user = db.scalar(select(User).where(User.email == email_clean))

    if not user:
        raise ValueError("User account not found.")

    if not reset_token or len(reset_token.strip()) < 4:
        raise ValueError("Invalid password reset token.")

    if len(new_password) < 8:
        raise ValueError("Password must be at least 8 characters long.")

    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)

    return {"message": "Password reset successfully. You may now log in with your new password."}