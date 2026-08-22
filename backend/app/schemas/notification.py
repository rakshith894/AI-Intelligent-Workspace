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