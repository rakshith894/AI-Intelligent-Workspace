from pydantic import BaseModel


class TaskStatusStats(BaseModel):
    todo: int
    in_progress: int
    in_review: int
    done: int
    cancelled: int


class TaskPriorityStats(BaseModel):
    low: int
    medium: int
    high: int
    urgent: int


class WorkspaceAnalytics(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float

    status: TaskStatusStats
    priority: TaskPriorityStats