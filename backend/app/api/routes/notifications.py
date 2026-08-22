from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.notification import (
    NotificationResponse,
    UnreadNotificationCount,
)
from app.services.notification import (
    get_user_notifications,
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
):
    notifications = get_user_notifications(
        db,
        current_user_id,
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