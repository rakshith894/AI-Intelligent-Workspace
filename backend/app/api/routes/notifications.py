
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db

from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadNotificationCount,
)

from app.services.notification import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_unread_notification_count,
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
):
    return NotificationResponse(
        id=str(notification.id),

        user_id=str(
            notification.user_id
        ),

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
# LIST NOTIFICATIONS
# ============================================================

@router.get(
    "",
    response_model=NotificationListResponse,
)
def list_notifications(
    page: int = Query(
        default=1,
        ge=1,
    ),

    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),

    notification_filter: str = Query(
        default="all",
        alias="filter",
    ),

    db: Session = Depends(get_db),

    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    try:
        (
            notifications,
            total,
            unread_count,
        ) = get_user_notifications(
            db=db,
            user_id=current_user_id,
            page=page,
            page_size=page_size,
            notification_filter=notification_filter,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    total_pages = (
        (total + page_size - 1)
        // page_size
        if total
        else 0
    )

    return NotificationListResponse(
        items=[
            serialize_notification(
                notification
            )
            for notification in notifications
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        unread_count=unread_count,
    )


# ============================================================
# UNREAD COUNT
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
        db,
        current_user_id,
    )

    return {
        "count": count,
    }


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@router.patch(
    "/read-all",
)
def mark_all_as_read(
    db: Session = Depends(get_db),

    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    updated = mark_all_notifications_as_read(
        db,
        current_user_id,
    )

    return {
        "message": "All notifications marked as read",
        "updated": updated,
    }


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
