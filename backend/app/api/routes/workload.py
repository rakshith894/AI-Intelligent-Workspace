from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.workload import MemberWorkload
from app.services.workload import get_member_workload


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Analytics"],
)


@router.get(
    "/{workspace_id}/workload",
    response_model=list[MemberWorkload],
)
def workspace_workload(
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
    return get_member_workload(
        db,
        str(workspace_id),
    )