from uuid import UUID
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.notification import (
    NotificationResponse,
    UnreadNotificationCount,
    MarkAllNotificationsReadResponse,
    CleanupNotificationsResponse,
)
from app.services.notification import (
    cleanup_old_notifications,
    get_user_notifications,
    mark_all_notifications_as_read,
    mark_notification_as_read,
    get_unread_notification_count,
)


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)


def serialize_notification(notification):
    return NotificationResponse(
        id=str(notification.id),
        user_id=str(notification.user_id),
        workspace_id=(
            str(notification.workspace_id)
            if notification.workspace_id
            else None
        ),
        task_id=(
            str(notification.task_id)
            if notification.task_id
            else None
        ),
        type=notification.type,
        title=notification.title,
        message=notification.message,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def list_notifications(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
    notification_type: str | None = Query(
        default=None,
        alias="type",
    ),
    filter: Literal["unread", "read"] | None = Query(
        default=None,
    ),
    is_read: bool | None = Query(default=None),
    workspace_id: UUID | None = Query(default=None),
    task_id: UUID | None = Query(default=None),
):
    if filter is not None:
        is_read = filter == "read"

    notifications = get_user_notifications(
        db,
        current_user_id,
        notification_type=notification_type,
        is_read=is_read,
        workspace_id=(
            str(workspace_id)
            if workspace_id
            else None
        ),
        task_id=(
            str(task_id)
            if task_id
            else None
        ),
    )

    return [
        serialize_notification(notification)
        for notification in notifications
    ]


@router.get(
    "/unread-count",
    response_model=UnreadNotificationCount,
)
def unread_notification_count(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    count = get_unread_notification_count(
        db,
        current_user_id,
    )

    return {
        "count": count,
    }


@router.delete(
    "/cleanup",
    response_model=CleanupNotificationsResponse,
)
def cleanup_notifications(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    older_than_days: int = Query(default=30, ge=1),
):
    return {
        "deleted_count": cleanup_old_notifications(
            db,
            older_than_days=older_than_days,
        ),
    }


@router.patch(
    "/read-all",
    response_model=MarkAllNotificationsReadResponse,
)
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    return {
        "updated_count": mark_all_notifications_as_read(
            db,
            current_user_id,
        ),
    }


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def read_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    notification = mark_notification_as_read(
        db,
        str(notification_id),
        current_user_id,
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    return serialize_notification(
        notification
    )
