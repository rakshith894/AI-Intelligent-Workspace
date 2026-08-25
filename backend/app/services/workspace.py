from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.workspace import Workspace
from app.models.workspace_membership import (
    WorkspaceMembership,
    WorkspaceRole,
)
from app.models.workspace_invitation import WorkspaceInvitation
from app.models.project import Project
from app.models.task import Task
from app.models.task_comment import TaskComment
from app.models.task_activity import TaskActivity
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.label import Label
from app.models.notification import Notification
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate
from app.services.notification import create_notification
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


def update_workspace(
    db: Session,
    workspace_id: str,
    name: str,
    user_id: str,
) -> Workspace:
    ws_uuid = UUID(workspace_id) if not isinstance(workspace_id, UUID) else workspace_id
    user_uuid = UUID(user_id) if not isinstance(user_id, UUID) else user_id

    workspace = db.scalar(select(Workspace).where(Workspace.id == ws_uuid))
    if not workspace:
        raise ValueError("Workspace not found")

    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == ws_uuid,
            WorkspaceMembership.user_id == user_uuid,
        )
    )
    if not membership or membership.role not in {"owner", "admin"}:
        raise ValueError("Only workspace owners and admins can rename the workspace")

    clean_name = name.strip()
    if len(clean_name) < 2:
        raise ValueError("Workspace name must be at least 2 characters long")

    workspace.name = clean_name
    db.commit()
    db.refresh(workspace)
    return workspace


def delete_workspace(
    db: Session,
    workspace_id: str,
    user_id: str,
) -> bool:
    ws_uuid = UUID(workspace_id) if not isinstance(workspace_id, UUID) else workspace_id
    user_uuid = UUID(user_id) if not isinstance(user_id, UUID) else user_id

    workspace = db.scalar(select(Workspace).where(Workspace.id == ws_uuid))
    if not workspace:
        raise ValueError("Workspace not found")

    if str(workspace.owner_id) != str(user_uuid):
        raise ValueError("Only the workspace owner can delete this workspace")

    # 1. Clean up task comments & activities & attachments
    task_ids = db.scalars(select(Task.id).where(Task.workspace_id == ws_uuid)).all()
    if task_ids:
        db.execute(delete(TaskComment).where(TaskComment.task_id.in_(task_ids)))
        db.execute(delete(TaskActivity).where(TaskActivity.task_id.in_(task_ids)))
        db.execute(delete(Attachment).where(Attachment.task_id.in_(task_ids)))
        db.execute(delete(Comment).where(Comment.task_id.in_(task_ids)))

    # 2. Clean up tasks, labels, projects
    db.execute(delete(Task).where(Task.workspace_id == ws_uuid))
    db.execute(delete(Label).where(Label.workspace_id == ws_uuid))
    db.execute(delete(Project).where(Project.workspace_id == ws_uuid))

    # 3. Clean up invitations, memberships, notifications
    db.execute(delete(WorkspaceInvitation).where(WorkspaceInvitation.workspace_id == ws_uuid))
    db.execute(delete(WorkspaceMembership).where(WorkspaceMembership.workspace_id == ws_uuid))
    db.execute(delete(Notification).where(Notification.workspace_id == ws_uuid))

    # 4. Delete the workspace record itself
    db.delete(workspace)
    db.commit()
    return True


def leave_workspace(
    db: Session,
    workspace_id: str,
    user_id: str,
) -> bool:
    ws_uuid = UUID(workspace_id) if not isinstance(workspace_id, UUID) else workspace_id
    user_uuid = UUID(user_id) if not isinstance(user_id, UUID) else user_id

    workspace = db.scalar(select(Workspace).where(Workspace.id == ws_uuid))
    if not workspace:
        raise ValueError("Workspace not found")

    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == ws_uuid,
            WorkspaceMembership.user_id == user_uuid,
        )
    )
    if not membership:
        raise ValueError("You are not a member of this workspace")

    if membership.role == "owner":
        raise ValueError("Workspace owner cannot leave. You can delete the workspace instead.")

    user = db.scalar(select(User).where(User.id == user_uuid))
    member_name = user.full_name or user.email if user else "A member"

    # Delete membership
    db.delete(membership)

    # Clean up any past invitation records for this user in this workspace
    if user and user.email:
        from sqlalchemy import func
        db.execute(
            delete(WorkspaceInvitation).where(
                WorkspaceInvitation.workspace_id == ws_uuid,
                func.lower(WorkspaceInvitation.email) == user.email.lower().strip(),
            )
        )

    # Notify owner
    create_notification(
        db=db,
        user_id=str(workspace.owner_id),
        workspace_id=str(workspace.id),
        notification_type="member_left",
        title="Member left workspace",
        message=f"{member_name} has left workspace '{workspace.name}'",
    )

    db.commit()
    return True