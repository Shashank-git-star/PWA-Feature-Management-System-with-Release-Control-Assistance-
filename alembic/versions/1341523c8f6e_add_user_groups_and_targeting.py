"""add_user_groups_and_targeting

Revision ID: 1341523c8f6e
Revises: 4bdc6272492a
Create Date: 2026-09-02 17:19:28.749058

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1341523c8f6e'
down_revision: Union[str, Sequence[str], None] = '4bdc6272492a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # 1. Create User Groups Table
    op.create_table(
        'user_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 2. Add group_id to Users Table
    op.add_column('users', sa.Column('group_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_user_group', 'users', 'user_groups', ['group_id'], ['id'])

    # 3. Create Targeting Rules Table
    op.create_table(
        'targeting_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('flag_id', sa.Integer(), nullable=False),
        sa.Column('target_type', sa.String(), nullable=False), # 'USER' or 'GROUP'
        sa.Column('target_identifier', sa.String(), nullable=False), # User ID or Group ID
        sa.Column('value', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['flag_id'], ['feature_flags.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('targeting_rules')
    op.drop_constraint('fk_user_group', 'users', type_='foreignkey')
    op.drop_column('users', 'group_id')
    op.drop_table('user_groups')