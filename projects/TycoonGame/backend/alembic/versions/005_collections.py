"""Add collection system tables

Revision ID: 005_collections
Revises: 004_economy_service
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "005_collections"
down_revision: Union[str, None] = "004_economy_service"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Collections (albums)
    op.create_table(
        "collections",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("collection_id", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("theme", sa.String(64), nullable=True),
        sa.Column("required_item_ids", postgresql.JSON, default=list),
        sa.Column("total_items", sa.Integer(), default=0),
        sa.Column("milestone_rewards", postgresql.JSON, default=dict),
        sa.Column("completion_reward", postgresql.JSON, default=dict),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_collection_theme", "collections", ["theme"])

    # Player collection progress
    op.create_table(
        "player_collection_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("collection_id", sa.String(64), sa.ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False),
        sa.Column("collected_item_ids", postgresql.JSON, default=list),
        sa.Column("progress_percent", sa.Float(), default=0.0),
        sa.Column("claimed_milestones", postgresql.JSON, default=list),
        sa.Column("completed", sa.Boolean(), default=False),
        sa.Column("total_reward_claimed", sa.Float(), default=0.0),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_player_collection", "player_collection_progress", ["user_id", "collection_id"])
    op.create_index("ix_player_collection_user", "player_collection_progress", ["user_id"])

    # Achievements
    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("achievement_id", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("target_value", sa.Float(), default=1.0),
        sa.Column("current_value_field", sa.String(64), nullable=True),
        sa.Column("reward_currency", sa.Float(), default=0.0),
        sa.Column("reward_gems", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_achievement_category", "achievements", ["category"])

    # Player achievements
    op.create_table(
        "player_achievements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("achievement_id", sa.String(64), sa.ForeignKey("achievements.achievement_id", ondelete="CASCADE"), nullable=False),
        sa.Column("progress", sa.Float(), default=0.0),
        sa.Column("completed", sa.Boolean(), default=False),
        sa.Column("reward_claimed", sa.Boolean(), default=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_player_achievement", "player_achievements", ["user_id", "achievement_id"])
    op.create_index("ix_player_achievement_user", "player_achievements", ["user_id"])


def downgrade() -> None:
    op.drop_table("player_achievements")
    op.drop_table("achievements")
    op.drop_table("player_collection_progress")
    op.drop_table("collections")
