"""add updated_at to environment overrides

Revision ID: a1e2f3b4c5d6
Revises: 7f788d09c289
Create Date: 2026-09-11 10:15:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1e2f3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "7f788d09c289"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "environment_overrides",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("environment_overrides", "updated_at")
