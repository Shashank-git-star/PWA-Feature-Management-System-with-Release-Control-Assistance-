from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, String, inspect, text
from sqlalchemy.engine import Engine
from app.database import Base

class TargetingRuleModel(Base):
    __tablename__ = "targeting_rules"
    __table_args__ = (
        Index(
            "uq_targeting_rule_target_per_flag",
            "flag_id",
            text("LOWER(target_type)"),
            "target_identifier",
            unique=True,
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(Integer, ForeignKey("feature_flags.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String, nullable=False)
    target_identifier = Column(String, nullable=False)
    value = Column(Boolean, nullable=False)


def ensure_target_uniqueness(bind: Engine) -> None:
    inspector = inspect(bind)
    if "targeting_rules" not in inspector.get_table_names():
        return

    if bind.dialect.name == "sqlite":
        with bind.connect() as connection:
            index_exists = connection.execute(
                text(
                    "SELECT 1 FROM sqlite_master "
                    "WHERE type = 'index' AND name = 'uq_targeting_rule_target_per_flag'"
                )
            ).first() is not None
    else:
        index_exists = any(
            index["name"] == "uq_targeting_rule_target_per_flag"
            for index in inspector.get_indexes("targeting_rules")
        )
    if index_exists:
        return

    with bind.begin() as connection:
        connection.execute(text(
            """
            DELETE FROM targeting_rules
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM targeting_rules
                GROUP BY flag_id, LOWER(target_type), target_identifier
            )
            """
        ))
        connection.execute(text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_targeting_rule_target_per_flag
            ON targeting_rules (flag_id, LOWER(target_type), target_identifier)
            """
        ))