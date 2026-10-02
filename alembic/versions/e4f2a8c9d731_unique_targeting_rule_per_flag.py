"""ensure one targeting rule state per target and flag

Revision ID: e4f2a8c9d731
Revises: c3d4e5f6a7b8
"""

from typing import Sequence, Union

from alembic import op


revision: str = "e4f2a8c9d731"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM targeting_rules
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM targeting_rules
            GROUP BY flag_id, LOWER(target_type), target_identifier
        )
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_targeting_rule_target_per_flag
        ON targeting_rules (flag_id, LOWER(target_type), target_identifier)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX uq_targeting_rule_target_per_flag")
