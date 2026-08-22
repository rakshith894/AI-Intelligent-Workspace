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