"""Add seasonal events system tables

Revision ID: 007_seasonal_events
Revises: 006_gifts_engagement
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "007_seasonal_events"
down_revision: Union[str, None] = "006_gifts_engagement"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Seasonal events
    op.create_table(
        "seasonal_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("event_type", sa.String(32), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="upcoming"),
        sa.Column("reward_currency_name", sa.String(64), nullable=True),
        sa.Column("top_n_rewards", postgresql.JSON, default=dict),
        sa.Column("exclusive_item_ids", postgresql.JSON, default=list),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_event_status", "seasonal_events", ["status"])
    op.create_index("ix_event_dates", "seasonal_events", ["start_date", "end_date"])

    # Event quests
    op.create_table(
        "event_quests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id", sa.String(64), sa.ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False),
        sa.Column("quest_id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("mission_type", sa.String(32), nullable=False),
        sa.Column("target_value", sa.Float(), default=1.0),
        sa.Column("points_reward", sa.Float(), default=1.0),
        sa.Column("currency_reward", sa.Float(), default=0.0),
        sa.Column("gem_reward", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_event_quest", "event_quests", ["event_id", "quest_id"])
    op.create_index("ix_event_quest_event", "event_quests", ["event_id"])

    # Player event progress
    op.create_table(
        "player_event_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("event_id", sa.String(64), sa.ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False),
        sa.Column("quest_id", sa.String(64), nullable=False),
        sa.Column("progress", sa.Float(), default=0.0),
        sa.Column("completed", sa.Boolean(), default=False),
        sa.Column("reward_claimed", sa.Boolean(), default=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_player_event_quest", "player_event_progress", ["user_id", "event_id", "quest_id"])
    op.create_index("ix_player_event_user_event", "player_event_progress", ["user_id", "event_id"])

    # Player event currency
    op.create_table(
        "player_event_currency",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("event_id", sa.String(64), sa.ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False),
        sa.Column("currency_name", sa.String(64), nullable=False),
        sa.Column("balance", sa.Float(), default=0.0),
        sa.Column("total_earned", sa.Float(), default=0.0),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_player_event_currency", "player_event_currency", ["user_id", "event_id"])
    op.create_index("ix_player_event_currency_user_event", "player_event_currency", ["user_id", "event_id"])

    # Event leaderboards
    op.create_table(
        "event_leaderboards",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id", sa.String(64), sa.ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("username", sa.String(255), nullable=True),
        sa.Column("score", sa.Float(), default=0.0),
        sa.Column("rank", sa.Integer(), default=0),
        sa.Column("rewards_distributed", sa.Boolean(), default=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_event_leaderboard_user", "event_leaderboards", ["event_id", "user_id"])
    op.create_index("ix_event_leaderboard_event_score", "event_leaderboards", ["event_id", "score"])


def downgrade() -> None:
    op.drop_table("event_leaderboards")
    op.drop_table("player_event_currency")
    op.drop_table("player_event_progress")
    op.drop_table("event_quests")
    op.drop_table("seasonal_events")
