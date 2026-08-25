"""add github fields to users

Revision ID: a1b2c3d4e5f6
Revises: e7a8b9c0d1e2
Create Date: 2026-08-25 19:19:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add GitHub integration columns to users table (safe — skips if already exists)."""
    conn = op.get_bind()

    existing = [
        row[0]
        for row in conn.execute(
            sa.text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users'"
            )
        )
    ]

    if 'github_username' not in existing:
        op.add_column('users', sa.Column('github_username', sa.String(length=255), nullable=True))
    if 'github_access_token' not in existing:
        op.add_column('users', sa.Column('github_access_token', sa.Text(), nullable=True))
    if 'github_connected_at' not in existing:
        op.add_column('users', sa.Column('github_connected_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove GitHub integration columns from users table."""
    op.drop_column('users', 'github_connected_at')
    op.drop_column('users', 'github_access_token')
    op.drop_column('users', 'github_username')
