from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    status: str = "todo"
    priority: str = "medium"
    assignee_id: UUID | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: UUID | None = None
    due_date: datetime | None = None

class TaskLabelInfo(BaseModel):
    id: str
    name: str
    color: str

class TaskResponse(BaseModel):
    id: str
    project_id: str
    workspace_id: str
    title: str
    description: str | None
    status: str
    priority: str
    assignee_id: str | None
    due_date: datetime | None
    created_by: str
    created_at: datetime
    updated_at: datetime
    labels: list[TaskLabelInfo] = []


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    