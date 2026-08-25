from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace_membership import WorkspaceMembership


def get_workspace_members(
    db: Session,
    workspace_id: str,
):
    statement = (
        select(
            WorkspaceMembership,
            User,
        )
        .join(
            User,
            User.id == WorkspaceMembership.user_id,
        )
        .where(
            WorkspaceMembership.workspace_id == workspace_id
        )
    )

    return db.execute(statement).all()


def remove_workspace_member(
    db: Session,
    workspace_id: str,
    target_user_id: str,
):
    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == target_user_id,
        )
    )

    if not membership:
        return None

    if membership.role == "owner":
        raise ValueError("Cannot remove the owner of the workspace")

    from app.models.workspace_invitation import WorkspaceInvitation
    from sqlalchemy import delete, func

    user = db.scalar(select(User).where(User.id == target_user_id))
    if user and user.email:
        db.execute(
            delete(WorkspaceInvitation).where(
                WorkspaceInvitation.workspace_id == workspace_id,
                func.lower(WorkspaceInvitation.email) == user.email.lower().strip(),
            )
        )

    db.delete(membership)
    db.commit()
    return True


def update_member_role(
    db: Session,
    workspace_id: str,
    target_user_id: str,
    new_role: str,
):
    if new_role not in {"admin", "member"}:
        raise ValueError("Role must be 'admin' or 'member'")

    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == target_user_id,
        )
    )

    if not membership:
        return None

    if membership.role == "owner":
        raise ValueError("Cannot change role of workspace owner")

    membership.role = new_role
    db.commit()
    db.refresh(membership)
    return membership