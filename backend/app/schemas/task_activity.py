from datetime import datetime

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: str
    task_id: str
    workspace_id: str
    user_id: str
    action: str
    details: str | None
    created_at: datetime
