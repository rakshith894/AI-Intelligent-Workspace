"""add notification indexes

Revision ID: 8ee17cde2c13
Revises: f1a2b3c4d5e6
Create Date: 2026-08-23 10:53:01.976983

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '8ee17cde2c13'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes used by notification list and unread-count queries."""
    op.create_index(
        "ix_notifications_user_created",
        "notifications",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_notifications_user_read",
        "notifications",
        ["user_id", "is_read"],
    )


def downgrade() -> None:
    """Remove notification query indexes."""
    op.drop_index("ix_notifications_user_read", table_name="notifications")
    op.drop_index("ix_notifications_user_created", table_name="notifications")
