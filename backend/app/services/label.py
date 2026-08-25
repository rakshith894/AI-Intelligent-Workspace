from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.label import Label
from app.models.task_label import TaskLabel
from app.schemas.label import LabelCreate


# ============================================================
# CREATE LABEL
# ============================================================

def create_label(
    db: Session,
    workspace_id: str,
    data: LabelCreate,
) -> Label:

    workspace_uuid = UUID(workspace_id)

    existing = db.scalar(
        select(Label).where(
            Label.workspace_id == workspace_uuid,
            Label.name == data.name,
        )
    )

    if existing:
        raise ValueError(
            "A label with this name already exists."
        )

    label = Label(
        workspace_id=workspace_uuid,
        name=data.name.strip(),
        color=data.color or "blue",
    )

    db.add(label)

    try:
        db.commit()
        db.refresh(label)

    except IntegrityError:
        db.rollback()

        raise ValueError(
            "A label with this name already exists."
        )

    return label


# ============================================================
# GET LABELS
# ============================================================

def get_labels(
    db: Session,
    workspace_id: str,
) -> list[Label]:

    workspace_uuid = UUID(workspace_id)

    return list(
        db.scalars(
            select(Label)
            .where(
                Label.workspace_id == workspace_uuid
            )
            .order_by(Label.name.asc())
        ).all()
    )


# ============================================================
# DELETE WORKSPACE LABEL
# ============================================================

def delete_label(
    db: Session,
    workspace_id: str,
    label_id: str,
) -> None:

    workspace_uuid = UUID(workspace_id)
    label_uuid = UUID(label_id)

    label = db.scalar(
        select(Label).where(
            Label.id == label_uuid,
            Label.workspace_id == workspace_uuid,
        )
    )

    if label is None:
        raise ValueError(
            "Label not found."
        )

    # Remove task-label relationships first.
    db.query(TaskLabel).filter(
        TaskLabel.label_id == label_uuid
    ).delete(
        synchronize_session=False
    )

    db.delete(label)
    db.commit()


# ============================================================
# ATTACH LABEL
# ============================================================

def attach_label(
    db: Session,
    task_id: str,
    workspace_id: str,
    label_id: str,
) -> TaskLabel:

    task_uuid = UUID(task_id)
    workspace_uuid = UUID(workspace_id)
    label_uuid = UUID(label_id)

    label = db.scalar(
        select(Label).where(
            Label.id == label_uuid,
            Label.workspace_id == workspace_uuid,
        )
    )

    if label is None:
        raise ValueError(
            "Label not found in this workspace."
        )

    existing = db.scalar(
        select(TaskLabel).where(
            TaskLabel.task_id == task_uuid,
            TaskLabel.label_id == label_uuid,
        )
    )

    if existing:
        return existing

    task_label = TaskLabel(
        task_id=task_uuid,
        label_id=label_uuid,
    )

    db.add(task_label)

    try:
        db.commit()
        db.refresh(task_label)

    except IntegrityError:
        db.rollback()

        raise ValueError(
            "Unable to attach label."
        )

    return task_label


# ============================================================
# REMOVE LABEL FROM TASK
# ============================================================

def remove_label(
    db: Session,
    task_id: str,
    label_id: str,
) -> None:

    task_uuid = UUID(task_id)
    label_uuid = UUID(label_id)

    task_label = db.scalar(
        select(TaskLabel).where(
            TaskLabel.task_id == task_uuid,
            TaskLabel.label_id == label_uuid,
        )
    )

    if task_label is None:
        raise ValueError(
            "Label is not attached to this task."
        )

    db.delete(task_label)
    db.commit()