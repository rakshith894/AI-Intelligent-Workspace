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

    db.delete(membership)
    db.commit()
    return True