from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification

def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    workspace_id: str | None = None,
    task_id: str | None = None,
):
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


def get_user_notifications(
    db: Session,
    user_id: str,
):
    return db.scalars(
        select(Notification)
        .where(
            Notification.user_id == UUID(user_id)
        )
        .order_by(
            Notification.created_at.desc()
        )
    ).all()


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