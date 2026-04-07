"""Add gift system and daily engagement tables

Revision ID: 006_gifts_engagement
Revises: 005_collections
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "006_gifts_engagement"
down_revision: Union[str, None] = "005_collections"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Player energy
    op.create_table(
        "player_energy",
        sa.Column("user_id", sa.String(64), primary_key=True),
        sa.Column("current_energy", sa.Float(), default=100.0),
        sa.Column("max_energy", sa.Float(), default=100.0),
        sa.Column("regen_rate", sa.Float(), default=1.0),
        sa.Column("last_update", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Push notification records
    op.create_table(
        "push_notification_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("provider", sa.String(32), nullable=False),
        sa.Column("notification_type", sa.String(64), nullable=False),
        sa.Column("payload", postgresql.JSON, default=dict),
        sa.Column("status", sa.String(16), nullable=False, server_default="sent"),
        sa.Column("sent_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_push_user", "push_notification_records", ["user_id"])
    op.create_index("ix_push_sent", "push_notification_records", ["sent_at"])
    # Gift configs
    op.create_table(
        "gift_configs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("gift_type", sa.String(32), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("currency_cost", sa.Float(), default=0.0),
        sa.Column("gem_cost", sa.Float(), default=0.0),
        sa.Column("currency_value", sa.Float(), default=0.0),
        sa.Column("gem_value", sa.Float(), default=0.0),
        sa.Column("item_id", sa.String(128), nullable=True),
        sa.Column("is_free_daily", sa.Boolean(), default=False),
        sa.Column("is_vip_only", sa.Boolean(), default=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Gift transactions
    op.create_table(
        "gift_transactions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("gift_type", sa.String(32), nullable=False),
        sa.Column("sender_id", sa.String(64), nullable=False),
        sa.Column("receiver_id", sa.String(64), nullable=False),
        sa.Column("currency_amount", sa.Float(), default=0.0),
        sa.Column("gem_amount", sa.Float(), default=0.0),
        sa.Column("item_id", sa.String(128), nullable=True),
        sa.Column("was_free", sa.Boolean(), default=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="sent"),
        sa.Column("sent_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("claimed_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_gift_sender", "gift_transactions", ["sender_id"])
    op.create_index("ix_gift_receiver", "gift_transactions", ["receiver_id"])
    op.create_index("ix_gift_status", "gift_transactions", ["status"])

    # Login streaks
    op.create_table(
        "login_streaks",
        sa.Column("user_id", sa.String(64), primary_key=True),
        sa.Column("current_streak", sa.Integer(), default=0),
        sa.Column("longest_streak", sa.Integer(), default=0),
        sa.Column("last_login_date", sa.String(10), nullable=True),
        sa.Column("streak_started_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Daily missions
    op.create_table(
        "daily_missions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("mission_id", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("mission_type", sa.String(32), nullable=False),
        sa.Column("target_value", sa.Float(), default=1.0),
        sa.Column("reward_currency", sa.Float(), default=0.0),
        sa.Column("reward_gems", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
    )

    # Player daily missions
    op.create_table(
        "player_daily_missions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("mission_id", sa.String(64), sa.ForeignKey("daily_missions.mission_id", ondelete="CASCADE"), nullable=False),
        sa.Column("progress", sa.Float(), default=0.0),
        sa.Column("completed", sa.Boolean(), default=False),
        sa.Column("claimed", sa.Boolean(), default=False),
        sa.Column("date_assigned", sa.String(10), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_player_daily_mission", "player_daily_missions", ["user_id", "mission_id", "date_assigned"])
    op.create_index("ix_player_daily_mission_user_date", "player_daily_missions", ["user_id", "date_assigned"])

    # Daily rewards table
    op.create_table(
        "daily_rewards",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("streak_day", sa.Integer(), nullable=False),
        sa.Column("currency_reward", sa.Float(), default=0.0),
        sa.Column("gem_reward", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
    )
    op.create_unique_constraint("uq_daily_reward_day", "daily_rewards", ["streak_day"])


def downgrade() -> None:
    op.drop_table("push_notification_records")
    op.drop_table("player_energy")
    op.drop_table("daily_rewards")
    op.drop_table("player_daily_missions")
    op.drop_table("daily_missions")
    op.drop_table("login_streaks")
    op.drop_table("gift_transactions")
    op.drop_table("gift_configs")
