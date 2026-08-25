from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.models.workspace import Workspace
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.membership import MembershipResponse
from app.services.membership import (
    get_workspace_members,
    remove_workspace_member,
)
from app.api.permission import require_workspace_role


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Workspace Members"],
)


@router.get(
    "/{workspace_id}/members",
    response_model=list[MembershipResponse],
)
def list_workspace_members(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    workspace = db.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id
        )
    )

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace",
        )

    rows = get_workspace_members(
        db,
        str(workspace_id),
    )

    return [
        MembershipResponse(
            id=str(member.id),
            user_id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=member.role,
        )
        for member, user in rows
    ]


@router.delete(
    "/{workspace_id}/members/{target_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member_from_workspace(
    workspace_id: UUID,
    target_user_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    current_membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user_id,
        )
    )

    if not current_membership or current_membership.role not in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can remove members",
        )

    try:
        removed = remove_workspace_member(
            db=db,
            workspace_id=str(workspace_id),
            target_user_id=str(target_user_id),
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in workspace",
        )

    return None


from pydantic import BaseModel

class RoleUpdate(BaseModel):
    role: str

@router.patch(
    "/{workspace_id}/members/{target_user_id}/role",
)
def change_member_role(
    workspace_id: UUID,
    target_user_id: UUID,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    current_membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == current_user_id,
        )
    )

    if not current_membership or current_membership.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the workspace owner can change member roles",
        )

    from app.services.membership import update_member_role
    try:
        updated = update_member_role(
            db=db,
            workspace_id=str(workspace_id),
            target_user_id=str(target_user_id),
            new_role=data.role,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in workspace",
        )

    return {"message": "Role updated successfully", "role": updated.role}


@router.get(
    "/{workspace_id}/owner-test",
)
def owner_only_test(
    workspace_id: UUID,
    membership=Depends(
        require_workspace_role("owner")
    ),
):
    return {
        "message": "Owner permission verified",
        "role": membership.role,
    }