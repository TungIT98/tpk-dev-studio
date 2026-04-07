"""Add trade system tables

Revision ID: 009_trades
Revises: 008_auction_house
Create Date: 2026-04-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "009_trades"
down_revision: Union[str, None] = "008_auction_house"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Trade offers
    op.create_table(
        "trade_offers",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("trade_id", sa.String(64), unique=True, nullable=False, index=True),
        sa.Column("initiator_id", sa.String(64), nullable=False, index=True),
        sa.Column("receiver_id", sa.String(64), nullable=False, index=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("initiator_offer", sa.JSON(), nullable=False, default=dict),
        sa.Column("receiver_offer", sa.JSON(), nullable=False, default=dict),
        sa.Column("initiator_confirmed", sa.Boolean(), default=False),
        sa.Column("receiver_confirmed", sa.Boolean(), default=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), index=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_trade_initiator", "trade_offers", ["initiator_id"])
    op.create_index("ix_trade_receiver", "trade_offers", ["receiver_id"])
    op.create_index("ix_trade_status", "trade_offers", ["status"])
    op.create_index("ix_trade_expires", "trade_offers", ["expires_at"])

    # Trade transactions (completed trades audit log)
    op.create_table(
        "trade_transactions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("trade_id", sa.String(64), unique=True, nullable=False, index=True),
        sa.Column("initiator_id", sa.String(64), nullable=False, index=True),
        sa.Column("receiver_id", sa.String(64), nullable=False, index=True),
        sa.Column("initiator_pet_ids", sa.JSON(), nullable=False, default=dict),
        sa.Column("receiver_pet_ids", sa.JSON(), nullable=False, default=dict),
        sa.Column("initiator_item_ids", sa.JSON(), nullable=False, default=dict),
        sa.Column("receiver_item_ids", sa.JSON(), nullable=False, default=dict),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("completed_at", sa.DateTime(), server_default=sa.func.now(), index=True),
    )
    op.create_index("ix_trade_tx_initiator", "trade_transactions", ["initiator_id"])
    op.create_index("ix_trade_tx_receiver", "trade_transactions", ["receiver_id"])


def downgrade() -> None:
    op.drop_table("trade_transactions")
    op.drop_table("trade_offers")
