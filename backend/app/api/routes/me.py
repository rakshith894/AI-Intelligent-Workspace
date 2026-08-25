
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.models.workspace import Workspace
from app.models.workspace_membership import WorkspaceMembership


from app.user import User


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from uuid import UUID
    user = db.scalar(select(User).where(User.id == UUID(user_id)))
    return {
        "user_id": user_id,
        "email": user.email if user else "",
        "full_name": user.full_name if user else "",
        "avatar_url": user.avatar_url if user else None,
        "created_at": user.created_at.isoformat() if user and user.created_at else None,
    }


@router.get("/me/workspaces")
def get_my_workspaces(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    rows = db.execute(
        select(
            Workspace,
            WorkspaceMembership.role,
        )
        .join(
            WorkspaceMembership,
            WorkspaceMembership.workspace_id
            == Workspace.id,
        )
        .where(
            WorkspaceMembership.user_id == user_id,
        )
        .order_by(
            Workspace.created_at.asc(),
        )
    ).all()

    return [
        {
            "id": str(workspace.id),
            "name": workspace.name,
            "slug": workspace.slug,
            "owner_id": str(workspace.owner_id),
            "role": role,
        }
        for workspace, role in rows
    ]
