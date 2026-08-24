
from pydantic import BaseModel


class NotificationPreferenceResponse(BaseModel):
    task_assigned: bool
    status_changed: bool
    task_created: bool
    task_updated: bool
    mention: bool


class NotificationPreferenceUpdate(BaseModel):
    task_assigned: bool | None = None
    status_changed: bool | None = None
    task_created: bool | None = None
    task_updated: bool | None = None
    mention: bool | None = None
