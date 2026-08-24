
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Notification(Base):

    __tablename__ = "notifications"

    # ========================================================
    # TABLE INDEXES
    # ========================================================

    __table_args__ = (
        # Fast:
        # WHERE user_id = ?
        # ORDER BY created_at DESC
        Index(
            "ix_notifications_user_created",
            "user_id",
            "created_at",
        ),

        # Fast:
        # WHERE user_id = ?
        # AND is_read = false
        Index(
            "ix_notifications_user_read",
            "user_id",
            "is_read",
        ),
    )

    # ========================================================
    # ID
    # ========================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ========================================================
    # USER
    # ========================================================

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # WORKSPACE
    # ========================================================

    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "workspaces.id",
            ondelete="CASCADE",
        ),
        nullable=True,
    )

    # ========================================================
    # TASK
    # ========================================================

    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "tasks.id",
            ondelete="CASCADE",
        ),
        nullable=True,
    )

    # ========================================================
    # TYPE
    # ========================================================

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # ========================================================
    # TITLE
    # ========================================================

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    # ========================================================
    # MESSAGE
    # ========================================================

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # ========================================================
    # READ STATUS
    # ========================================================

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    # ========================================================
    # CREATED AT
    # ========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
    mention: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    comment_added: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
