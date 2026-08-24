from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db

from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadNotificationCount,
    MarkAllNotificationsReadResponse,
)

from app.services.notification import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_unread_notification_count,
    delete_notification,
)


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)


# ============================================================
# SERIALIZE NOTIFICATION
# ============================================================

def serialize_notification(
    notification,
) -> NotificationResponse:

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


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get(
    "",
    response_model=NotificationListResponse,
)
def list_notifications(
    notification_filter: str = Query(
        default="all",
        alias="filter",
        pattern="^(all|unread|read)$",
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    notifications, total, unread_count = (
        get_user_notifications(
            db=db,
            user_id=current_user_id,
            page=page,
            page_size=page_size,
            notification_filter=notification_filter,
        )
    )

    total_pages = (
        (total + page_size - 1) // page_size
        if total
        else 0
    )

    return NotificationListResponse(
        items=[
            serialize_notification(notification)
            for notification in notifications
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        unread_count=unread_count,
    )


# ============================================================
# GET UNREAD COUNT
# ============================================================

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
        db=db,
        user_id=current_user_id,
    )

    return {
        "count": count,
    }


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@router.patch(
    "/read-all",
    response_model=MarkAllNotificationsReadResponse,
)
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    updated_count = mark_all_notifications_as_read(
        db=db,
        user_id=current_user_id,
    )

    return MarkAllNotificationsReadResponse(
        updated_count=updated_count
    )


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

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
        db=db,
        notification_id=str(notification_id),
        user_id=current_user_id,
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return serialize_notification(notification)


# ============================================================
# DELETE NOTIFICATION
# ============================================================

@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):

    deleted = delete_notification(
        db=db,
        notification_id=str(notification_id),
        user_id=current_user_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return None