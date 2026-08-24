
import uuid

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # --------------------------------------------------------
    # USER
    # --------------------------------------------------------

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    # --------------------------------------------------------
    # NOTIFICATION TYPES
    # --------------------------------------------------------

    task_assigned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    status_changed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    task_created: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    task_updated: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    mention: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
