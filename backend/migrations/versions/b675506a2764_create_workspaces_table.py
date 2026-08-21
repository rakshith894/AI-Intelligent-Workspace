"""create workspaces table

Revision ID: b675506a2764
Revises: 4b0111357d5c
Create Date: 2026-08-21 22:24:30.785998

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b675506a2764'
down_revision: Union[str, Sequence[str], None] = '4b0111357d5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'workspaces',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.Index('ix_workspaces_owner_id', 'owner_id'),
        sa.UniqueConstraint('slug', name='uq_workspaces_slug'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('workspaces')
