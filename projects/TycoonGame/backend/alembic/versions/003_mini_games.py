"""Add mini-games system tables

Revision ID: 003_mini_games
Revises: 002_pet_system
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003_mini_games"
down_revision: Union[str, None] = "002_pet_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Mini-game configs catalog
    op.create_table(
        "mini_game_configs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("game_id", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("game_type", sa.String(32), nullable=False),
        sa.Column("min_players", sa.Integer(), default=1),
        sa.Column("max_players", sa.Integer(), default=1),
        sa.Column("duration_seconds", sa.Integer(), default=60),
        sa.Column("cooldown_seconds", sa.Integer(), default=300),
        sa.Column("reward_table", postgresql.JSON, default=dict),
        sa.Column("entry_cost", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_minigame_type", "mini_game_configs", ["game_type"])

    # Mini-game sessions
    op.create_table(
        "mini_game_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("session_id", sa.String(128), unique=True, nullable=False),
        sa.Column("game_id", sa.String(64), sa.ForeignKey("mini_game_configs.game_id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("score", sa.Float(), default=0.0),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("reward_granted", sa.Float(), default=0.0),
        sa.Column("started_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_sessions_user_game", "mini_game_sessions", ["user_id", "game_id"])
    op.create_index("ix_sessions_status", "mini_game_sessions", ["status"])

    # Mini-game leaderboards
    op.create_table(
        "mini_game_leaderboards",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("game_id", sa.String(64), sa.ForeignKey("mini_game_configs.game_id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("username", sa.String(255), nullable=True),
        sa.Column("high_score", sa.Float(), default=0.0),
        sa.Column("best_rank", sa.Integer(), default=0),
        sa.Column("games_played", sa.Integer(), default=0),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_unique_constraint("uq_leaderboard_game_user", "mini_game_leaderboards", ["game_id", "user_id"])
    op.create_index("ix_leaderboard_game_score", "mini_game_leaderboards", ["game_id", "high_score"])


def downgrade() -> None:
    op.drop_table("mini_game_leaderboards")
    op.drop_table("mini_game_sessions")
    op.drop_table("mini_game_configs")
