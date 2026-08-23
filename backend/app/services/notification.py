from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import delete, func, select, update
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
    notification_type: str | None = None,
    is_read: bool | None = None,
    workspace_id: str | None = None,
    task_id: str | None = None,
):
    conditions = [
        Notification.user_id == UUID(user_id),
    ]

    if notification_type is not None:
        conditions.append(Notification.type == notification_type)

    if is_read is not None:
        conditions.append(Notification.is_read == is_read)

    if workspace_id is not None:
        conditions.append(Notification.workspace_id == UUID(workspace_id))

    if task_id is not None:
        conditions.append(Notification.task_id == UUID(task_id))

    return db.scalars(
        select(Notification)
        .where(*conditions)
        .order_by(Notification.created_at.desc())
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


def mark_all_notifications_as_read(
    db: Session,
    user_id: str,
) -> int:
    result = db.execute(
        update(Notification)
        .where(
            Notification.user_id == UUID(user_id),
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    db.commit()

    return result.rowcount


def cleanup_old_notifications(
    db: Session,
    older_than_days: int = 30,
) -> int:
    if older_than_days < 1:
        raise ValueError("older_than_days must be at least 1")

    cutoff = datetime.now(timezone.utc) - timedelta(
        days=older_than_days
    )

    result = db.execute(
        delete(Notification).where(
            Notification.is_read.is_(True),
            Notification.created_at < cutoff,
        )
    )
    db.commit()

    return result.rowcount


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
def dispatch(
    self,
    event,
):
    event_type = type(event)

    print("🔥 DISPATCHING EVENT:", event_type.__name__)
    print("🔥 REGISTERED HANDLERS:", self._handlers[event_type])

    for handler in self._handlers[event_type]:
        print("🔥 CALLING HANDLER:", handler.__name__)
        handler(event)
