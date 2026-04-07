"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Players table
    op.create_table(
        "players",
        sa.Column("user_id", sa.String(64), primary_key=True),
        sa.Column("username", sa.String(255), nullable=False),
        sa.Column("total_currency", sa.Float(), default=0.0),
        sa.Column("total_earned", sa.Float(), default=0.0),
        sa.Column("total_earned_ever", sa.Float(), default=0.0),
        sa.Column("prestige_level", sa.Integer(), default=0),
        sa.Column("prestige_points", sa.Float(), default=0.0),
        sa.Column("last_save_time", sa.Integer(), default=0),
        sa.Column("save_version", sa.String(32), default="1.0"),
        sa.Column("businesses", postgresql.JSON, default=dict),
        sa.Column("upgrades", postgresql.JSON, default=dict),
        sa.Column("pets", postgresql.JSON, default=dict),
        sa.Column("achievements", postgresql.JSON, default=dict),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_players_prestige", "players", ["prestige_level", "total_earned"])
    op.create_index("ix_players_updated", "players", ["updated_at"])

    # Leaderboard entries
    op.create_table(
        "leaderboard_entries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("players.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_earned", sa.Float(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_leaderboard_earned", "leaderboard_entries", ["total_earned", "submitted_at"])
    op.create_unique_constraint("uq_leaderboard_user", "leaderboard_entries", ["user_id"])

    # Economy transactions
    op.create_table(
        "economy_transactions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("transaction_type", sa.String(64), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("balance_after", sa.Float(), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_economy_tx_user", "economy_transactions", ["user_id"])
    op.create_index("ix_economy_tx_created", "economy_transactions", ["created_at"])

    # Items catalog
    op.create_table(
        "items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("item_id", sa.String(128), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("item_type", sa.String(64), nullable=False),
        sa.Column("rarity", sa.String(32), nullable=True),
        sa.Column("base_cost", sa.Float(), default=0.0),
        sa.Column("item_metadata", postgresql.JSON, default=dict),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Player items (inventory)
    op.create_table(
        "player_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("item_id", sa.String(128), sa.ForeignKey("items.item_id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer(), default=1),
        sa.Column("acquired_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_player_items_user", "player_items", ["user_id"])
    op.create_unique_constraint("uq_player_item", "player_items", ["user_id", "item_id"])


def downgrade() -> None:
    op.drop_table("player_items")
    op.drop_table("items")
    op.drop_table("economy_transactions")
    op.drop_table("leaderboard_entries")
    op.drop_table("players")
