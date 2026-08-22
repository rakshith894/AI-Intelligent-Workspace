from pydantic import BaseModel


class MemberWorkload(BaseModel):
    user_id: str
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    completion_rate: float