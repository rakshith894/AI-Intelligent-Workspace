from datetime import datetime
from pydantic import BaseModel


class AttachmentResponse(BaseModel):
    id: str
    workspace_id: str
    project_id: str
    task_id: str | None = None
    filename: str
    file_size: int
    content_type: str
    uploaded_by: str
    created_at: datetime


class AttachmentListResponse(BaseModel):
    items: list[AttachmentResponse]
    total: int


class ProjectImportResponse(BaseModel):
    project_id: str
    name: str
    project_url: str | None = None
    imported_tasks_count: int
    imported_files_count: int
    message: str
