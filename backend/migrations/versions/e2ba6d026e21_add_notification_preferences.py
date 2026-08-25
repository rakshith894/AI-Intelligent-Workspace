"""add notification preferences

Revision ID: e2ba6d026e21
Revises: 8ee17cde2c13
Create Date: 2026-08-23 12:08:49.690886

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2ba6d026e21'
down_revision: Union[str, Sequence[str], None] = '8ee17cde2c13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
