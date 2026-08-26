from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.services.notification_preference import (
    is_notification_enabled,
)


# ============================================================
# CREATE NOTIFICATION
# ============================================================

def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    workspace_id: str | None = None,
    task_id: str | None = None,
):
    # --------------------------------------------------------
    # CHECK USER NOTIFICATION PREFERENCE
    # --------------------------------------------------------

    if not is_notification_enabled(
        db=db,
        user_id=user_id,
        notification_type=notification_type,
    ):
        return None

    # --------------------------------------------------------
    # CREATE NOTIFICATION
    # --------------------------------------------------------

    notification = Notification(
        user_id=UUID(user_id),

        workspace_id=(
            UUID(workspace_id)
            if workspace_id
            else None
        ),

        task_id=(
            UUID(task_id)
            if task_id
            else None
        ),

        type=notification_type,

        title=title,

        message=message,
    )

    db.add(notification)
    db.flush()

    return notification


# ============================================================
# GET PAGINATED USER NOTIFICATIONS
# ============================================================

def get_user_notifications(
    db: Session,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    notification_filter: str = "all",
):
    user_uuid = UUID(user_id)

    valid_filters = {
        "all",
        "unread",
        "read",
    }

    if notification_filter not in valid_filters:
        raise ValueError(
            "Invalid notification filter. "
            "Use: all, unread, or read"
        )

    conditions = [
        Notification.user_id == user_uuid
    ]

    if notification_filter == "unread":
        conditions.append(
            Notification.is_read.is_(False)
        )

    elif notification_filter == "read":
        conditions.append(
            Notification.is_read.is_(True)
        )

    total = db.scalar(
        select(func.count(Notification.id))
        .where(*conditions)
    ) or 0

    unread_count = db.scalar(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == user_uuid,
            Notification.is_read.is_(False),
        )
    ) or 0

    offset = (page - 1) * page_size

    notifications = db.scalars(
        select(Notification)
        .where(*conditions)
        .order_by(
            Notification.created_at.desc()
        )
        .offset(offset)
        .limit(page_size)
    ).all()

    return (
        notifications,
        total,
        unread_count,
    )


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

def mark_notification_as_read(
    db: Session,
    notification_id: str,
    user_id: str,
):
    notification = db.scalar(
        select(Notification).where(
            Notification.id == UUID(notification_id),
            Notification.user_id == UUID(user_id),
        )
    )

    if not notification:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

def mark_all_notifications_as_read(
    db: Session,
    user_id: str,
):
    user_uuid = UUID(user_id)

    result = db.execute(
        update(Notification)
        .where(
            Notification.user_id == user_uuid,
            Notification.is_read.is_(False),
        )
        .values(
            is_read=True
        )
    )

    db.commit()

    return result.rowcount


# ============================================================
# GET UNREAD NOTIFICATION COUNT
# ============================================================

def get_unread_notification_count(
    db: Session,
    user_id: str,
):
    count = db.scalar(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == UUID(user_id),
            Notification.is_read.is_(False),
        )
    )

    return count or 0


# ============================================================
# DELETE OLD NOTIFICATIONS
# ============================================================

def cleanup_old_notifications(
    db: Session,
    days: int = 90,
):
    """
    Delete notifications older than `days`.
    """

    if days <= 0:
        raise ValueError(
            "days must be greater than 0"
        )

    cutoff_date = datetime.now(timezone.utc) - timedelta(
        days=days
    )

    result = db.execute(
        delete(Notification).where(
            Notification.created_at < cutoff_date
        )
    )

    db.commit()

    return result.rowcount


# ============================================================
# DELETE NOTIFICATION
# ============================================================

def delete_notification(
    db: Session,
    notification_id: str,
    user_id: str,
):
    notification = db.scalar(
        select(Notification).where(
            Notification.id == UUID(notification_id),
            Notification.user_id == UUID(user_id),
        )
    )

    if not notification:
        return None

    db.delete(notification)
    db.commit()

    return True