"""add project_url to projects table

Revision ID: e7a8b9c0d1e2
Revises: dcb50f3619cf
Create Date: 2026-08-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# ============================================================
# REVISION IDENTIFIERS
# ============================================================

revision: str = "e7a8b9c0d1e2"
down_revision: Union[str, Sequence[str], None] = "dcb50f3619cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [col["name"] for col in inspector.get_columns("projects")]
    if "project_url" not in columns:
        op.add_column(
            "projects",
            sa.Column("project_url", sa.String(length=500), nullable=True),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [col["name"] for col in inspector.get_columns("projects")]
    if "project_url" in columns:
        op.drop_column("projects", "project_url")
