"""Add economy system tables

Revision ID: 004_economy_service
Revises: 003_mini_games
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "004_economy_service"
down_revision: Union[str, None] = "003_mini_games"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Player gem balances
    op.create_table(
        "player_gems",
        sa.Column("user_id", sa.String(64), primary_key=True),
        sa.Column("gem_balance", sa.Float(), default=0.0),
        sa.Column("total_purchased", sa.Float(), default=0.0),
        sa.Column("total_consumed", sa.Float(), default=0.0),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Gem transactions
    op.create_table(
        "gem_transactions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("transaction_type", sa.String(32), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("balance_after", sa.Float(), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("source", sa.String(64), nullable=True),
        sa.Column("idempotency_key", sa.String(128), nullable=True, unique=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_gem_tx_user", "gem_transactions", ["user_id"])
    op.create_index("ix_gem_tx_created", "gem_transactions", ["created_at"])

    # Price history
    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("item_id", sa.String(128), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_price_history_item", "price_history", ["item_id"])
    op.create_index("ix_price_history_item_time", "price_history", ["item_id", "recorded_at"])

    # Idempotency records
    op.create_table(
        "idempotency_records",
        sa.Column("idempotency_key", sa.String(128), primary_key=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("result", postgresql.JSON, default=dict),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_idempotency_expires", "idempotency_records", ["expires_at"])

    # Anomaly alerts
    op.create_table(
        "anomaly_alerts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("alert_type", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("metadata", postgresql.JSON, default=dict),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_anomaly_user", "anomaly_alerts", ["user_id"])
    op.create_index("ix_anomaly_created", "anomaly_alerts", ["created_at"])


def downgrade() -> None:
    op.drop_table("anomaly_alerts")
    op.drop_table("idempotency_records")
    op.drop_table("price_history")
    op.drop_table("gem_transactions")
    op.drop_table("player_gems")
