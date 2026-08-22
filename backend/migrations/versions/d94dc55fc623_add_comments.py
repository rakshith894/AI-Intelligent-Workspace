"""Keep the existing comments migration revision."""

from typing import Sequence, Union


revision: str = "d94dc55fc623"
down_revision: Union[str, Sequence[str], None] = "35cb7c838744"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass