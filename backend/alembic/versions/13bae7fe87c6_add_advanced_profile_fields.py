"""add advanced profile fields

Revision ID: 13bae7fe87c6
Revises: 5f50a9d2d284
Create Date: 2025-10-05 18:42:14.600090

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '13bae7fe87c6'
down_revision: Union[str, Sequence[str], None] = '5f50a9d2d284'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('user_profiles', sa.Column('target_race', sa.String(200), nullable=True))
    op.add_column('user_profiles', sa.Column('preferred_run_days', postgresql.JSONB, nullable=True))
    op.add_column('user_profiles', sa.Column('avoid_run_days', postgresql.JSONB, nullable=True))
    op.add_column('user_profiles', sa.Column('morning_person', sa.Boolean, nullable=True))
    op.add_column('user_profiles', sa.Column('sleep_average', sa.Float, nullable=True))
    op.add_column('user_profiles', sa.Column('other_commitments', sa.Text, nullable=True))
    op.add_column('user_profiles', sa.Column('badminton_sessions', postgresql.JSONB, nullable=True))


def downgrade():
    op.drop_column('user_profiles', 'target_race')
    op.drop_column('user_profiles', 'preferred_run_days')
    op.drop_column('user_profiles', 'avoid_run_days')
    op.drop_column('user_profiles', 'morning_person')
    op.drop_column('user_profiles', 'sleep_average')
    op.drop_column('user_profiles', 'other_commitments')
    op.drop_column('user_profiles', 'badminton_sessions')