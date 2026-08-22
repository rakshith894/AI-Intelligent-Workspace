from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.analytics import WorkspaceAnalytics
from app.services.analytics import get_workspace_analytics


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Analytics"],
)


@router.get(
    "/{workspace_id}/analytics",
    response_model=WorkspaceAnalytics,
)
def workspace_analytics(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    membership: WorkspaceMembership = Depends(
        require_workspace_role(
            "owner",
            "admin",
            "member",
        )
    ),
):
    return get_workspace_analytics(
        db,
        str(workspace_id),
    )