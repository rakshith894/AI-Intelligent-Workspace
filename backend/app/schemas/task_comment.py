from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=5000,
    )


class CommentResponse(BaseModel):
    id: str
    task_id: str
    workspace_id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: datetime