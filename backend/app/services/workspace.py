from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workspace import Workspace
from app.models.workspace_membership import (
    WorkspaceMembership,
    WorkspaceRole,
)
from app.schemas.workspace import WorkspaceCreate
from app.utils.slug import create_slug


def create_workspace(
    db: Session,
    workspace_data: WorkspaceCreate,
    owner_id: str,
) -> Workspace:

    base_slug = create_slug(workspace_data.name)
    slug = base_slug

    counter = 2

    while db.scalar(
        select(Workspace).where(
            Workspace.slug == slug
        )
    ):
        slug = f"{base_slug}-{counter}"
        counter += 1

    workspace = Workspace(
        name=workspace_data.name,
        slug=slug,
        owner_id=owner_id,
    )

    db.add(workspace)
    db.flush()

    membership = WorkspaceMembership(
        user_id=owner_id,
        workspace_id=workspace.id,
        role=WorkspaceRole.OWNER.value,
    )

    db.add(membership)

    db.commit()
    db.refresh(workspace)

    return workspace