"""add comment notification preference

Revision ID: dcb50f3619cf
Revises: 2fa1d4f21e57
Create Date: 2026-08-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# ============================================================
# REVISION IDENTIFIERS
# ============================================================

revision: str = "dcb50f3619cf"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "2fa1d4f21e57"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


# ============================================================
# UPGRADE
# ============================================================

def upgrade() -> None:

    # Add comment notification preference
    # to notification_preferences table.

    op.add_column(
        "notification_preferences",
        sa.Column(
            "comment_added",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


# ============================================================
# DOWNGRADE
# ============================================================

def downgrade() -> None:

    op.drop_column(
        "notification_preferences",
        "comment_added",
    )