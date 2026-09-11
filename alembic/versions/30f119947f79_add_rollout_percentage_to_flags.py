"""add_rollout_percentage_to_flags

Revision ID: 30f119947f79
Revises: 1341523c8f6e
Create Date: 2026-09-02 17:37:50.093427

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30f119947f79'
down_revision: Union[str, Sequence[str], None] = '1341523c8f6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
