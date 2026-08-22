"""add comments

Revision ID: cf6f7e702f80
Revises: d94dc55fc623
Create Date: 2026-08-22 22:36:11.060872

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'cf6f7e702f80'
down_revision: Union[str, Sequence[str], None] = 'd94dc55fc623'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    if inspect(bind).has_table("task_comments"):
        return

    op.create_table(
        "task_comments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("task_id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_task_comments_task_id", "task_comments", ["task_id"])
    op.create_index(
        "ix_task_comments_workspace_id", "task_comments", ["workspace_id"]
    )
    op.create_index("ix_task_comments_user_id", "task_comments", ["user_id"])


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    if not inspect(bind).has_table("task_comments"):
        return

    op.drop_index("ix_task_comments_user_id", table_name="task_comments")
    op.drop_index("ix_task_comments_workspace_id", table_name="task_comments")
    op.drop_index("ix_task_comments_task_id", table_name="task_comments")
    op.drop_table("task_comments")
