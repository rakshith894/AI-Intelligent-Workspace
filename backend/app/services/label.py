from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.label import Label
from app.models.task_label import TaskLabel
from app.schemas.label import LabelCreate


def create_label(
    db: Session,
    workspace_id: str,
    data: LabelCreate,
):
    existing = db.scalar(
        select(Label).where(
            Label.workspace_id == workspace_id,
            Label.name == data.name,
        )
    )

    if existing:
        raise ValueError(
            "A label with this name already exists"
        )

    label = Label(
        workspace_id=workspace_id,
        name=data.name,
        color=data.color,
    )

    db.add(label)
    db.commit()
    db.refresh(label)

    return label


def get_labels(
    db: Session,
    workspace_id: str,
):
    return db.scalars(
        select(Label)
        .where(
            Label.workspace_id == workspace_id
        )
        .order_by(Label.name.asc())
    ).all()


def attach_label(
    db: Session,
    task_id: str,
    workspace_id: str,
    label_id: str,
):
    label = db.scalar(
        select(Label).where(
            Label.id == label_id,
            Label.workspace_id == workspace_id,
        )
    )

    if not label:
        raise ValueError(
            "Label not found in this workspace"
        )

    existing = db.scalar(
        select(TaskLabel).where(
            TaskLabel.task_id == task_id,
            TaskLabel.label_id == label_id,
        )
    )

    if existing:
        raise ValueError(
            "Label is already attached to this task"
        )

    task_label = TaskLabel(
        task_id=task_id,
        label_id=label_id,
    )

    db.add(task_label)
    db.commit()
    db.refresh(task_label)

    return task_label


def remove_label(
    db: Session,
    task_id: str,
    label_id: str,
):
    task_label = db.scalar(
        select(TaskLabel).where(
            TaskLabel.task_id == task_id,
            TaskLabel.label_id == label_id,
        )
    )

    if not task_label:
        raise ValueError(
            "Label is not attached to this task"
        )

    db.delete(task_label)
    db.commit()