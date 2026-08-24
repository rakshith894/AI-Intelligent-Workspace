
"""create notification preferences table

Revision ID: 2fa1d4f21e57
Revises: 2bc8c45592ec
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "2fa1d4f21e57"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "2bc8c45592ec"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:

    op.create_table(
        "notification_preferences",

        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "task_assigned",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "status_changed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "task_created",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "task_updated",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "mention",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint(
            "user_id",
            name="uq_notification_preferences_user_id",
        ),
    )

    op.create_index(
        "ix_notification_preferences_user_id",
        "notification_preferences",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:

    op.drop_index(
        "ix_notification_preferences_user_id",
        table_name="notification_preferences",
    )

    op.drop_table(
        "notification_preferences",
    )
