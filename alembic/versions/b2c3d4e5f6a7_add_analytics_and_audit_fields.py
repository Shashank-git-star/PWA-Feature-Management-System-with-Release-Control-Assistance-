"""add analytics and structured audit fields

Revision ID: b2c3d4e5f6a7
Revises: a1e2f3b4c5d6
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1e2f3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("audit_logs", sa.Column("flag_id", sa.Integer(), nullable=True))
    op.add_column("audit_logs", sa.Column("environment_id", sa.Integer(), nullable=True))
    op.add_column("audit_logs", sa.Column("old_state", sa.String(), nullable=True))
    op.add_column("audit_logs", sa.Column("new_state", sa.String(), nullable=True))
    op.create_foreign_key("fk_audit_user", "audit_logs", "users", ["user_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_audit_flag", "audit_logs", "feature_flags", ["flag_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_audit_environment", "audit_logs", "environments", ["environment_id"], ["id"], ondelete="SET NULL")
    op.create_table(
        "evaluation_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("flag_id", sa.Integer(), nullable=False),
        sa.Column("environment_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["flag_id"], ["feature_flags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["environment_id"], ["environments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["user_groups.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_evaluation_events_id", "evaluation_events", ["id"])
    op.create_index("ix_evaluation_events_flag_id", "evaluation_events", ["flag_id"])
    op.create_index("ix_evaluation_events_environment_id", "evaluation_events", ["environment_id"])
    op.create_index("ix_evaluation_events_evaluated_at", "evaluation_events", ["evaluated_at"])


def downgrade() -> None:
    op.drop_index("ix_evaluation_events_evaluated_at", table_name="evaluation_events")
    op.drop_index("ix_evaluation_events_environment_id", table_name="evaluation_events")
    op.drop_index("ix_evaluation_events_flag_id", table_name="evaluation_events")
    op.drop_index("ix_evaluation_events_id", table_name="evaluation_events")
    op.drop_table("evaluation_events")
    op.drop_constraint("fk_audit_environment", "audit_logs", type_="foreignkey")
    op.drop_constraint("fk_audit_flag", "audit_logs", type_="foreignkey")
    op.drop_constraint("fk_audit_user", "audit_logs", type_="foreignkey")
    op.drop_column("audit_logs", "new_state")
    op.drop_column("audit_logs", "old_state")
    op.drop_column("audit_logs", "environment_id")
    op.drop_column("audit_logs", "flag_id")
