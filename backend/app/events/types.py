from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session


@dataclass
class TaskAssignedEvent:
    db: Session
    task_id: UUID
    workspace_id: UUID
    user_id: UUID
    assigned_by: UUID
    task_title: str


@dataclass
class TaskStatusChangedEvent:
    db: Session
    task_id: UUID
    workspace_id: UUID
    user_id: UUID | None
    old_status: str
    new_status: str
    task_title: str


@dataclass
class CommentAddedEvent:
    db: Session
    task_id: UUID
    workspace_id: UUID
    user_id: UUID
    assignee_id: UUID | None
    task_title: str