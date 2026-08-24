
from datetime import datetime

from pydantic import BaseModel


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


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    unread_count: int


class UnreadNotificationCount(BaseModel):
    count: int


class MarkAllNotificationsReadResponse(BaseModel):
    updated_count: int
