from app.events.instance import event_dispatcher
from app.events.types import TaskAssignedEvent
from app.core.database import SessionLocal
from app.models.task import Task
from sqlalchemy import select
from uuid import uuid4


db = SessionLocal()
task = db.scalar(select(Task).where(Task.assignee_id.is_not(None)))

if task:
    event = TaskAssignedEvent(
        db=db,
        task_id=task.id,
        workspace_id=task.workspace_id,
        user_id=task.assignee_id,
        assigned_by=task.created_by,
        task_title=task.title,
    )

    event_dispatcher.dispatch(event)

    print("Event dispatched successfully")
else:
    print("No assigned task available for event test")

db.close()