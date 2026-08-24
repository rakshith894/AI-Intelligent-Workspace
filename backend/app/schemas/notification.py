
from datetime import datetime

from pydantic import BaseModel


# ============================================================
# NOTIFICATION RESPONSE
# ============================================================

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    workspace_id: str | None
    task_id: str | None
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


# ============================================================
# NOTIFICATION LIST RESPONSE
# ============================================================

class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]

    total: int

    page: int

    page_size: int

    total_pages: int

    unread_count: int


# ============================================================
# UNREAD COUNT RESPONSE
# ============================================================

class UnreadNotificationCount(BaseModel):
    count: int


# ============================================================
# MARK ALL AS READ RESPONSE
# ============================================================

class MarkAllNotificationsReadResponse(BaseModel):
    updated_count: int
