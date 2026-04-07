"""Add auction house tables

Revision ID: 008_auction_house
Revises: 006_gifts_engagement
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "008_auction_house"
down_revision: Union[str, None] = "006_gifts_engagement"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Auction listings
    op.create_table(
        "auction_listings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("item_id", sa.String(128), nullable=False, index=True),
        sa.Column("seller_id", sa.String(64), nullable=False, index=True),
        sa.Column("start_bid", sa.Float(), nullable=False, default=0.0),
        sa.Column("current_bid", sa.Float(), nullable=True),
        sa.Column("current_winner_id", sa.String(64), nullable=True),
        sa.Column("rarity_tier", sa.String(16), nullable=False, server_default="common"),
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),
        sa.Column("ends_at", sa.DateTime(), nullable=False),
        sa.Column("escrow_currency", sa.Float(), default=0.0),
        sa.Column("escrow_gems", sa.Float(), default=0.0),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_auction_status", "auction_listings", ["status"])
    op.create_index("ix_auction_ends", "auction_listings", ["ends_at"])
    op.create_index("ix_auction_rarity", "auction_listings", ["rarity_tier"])

    # Auction bids
    op.create_table(
        "auction_bids",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("auction_id", sa.Integer(), sa.ForeignKey("auction_listings.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("bidder_id", sa.String(64), nullable=False, index=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("is_winning", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_bid_bidder", "auction_bids", ["bidder_id"])


def downgrade() -> None:
    op.drop_table("auction_bids")
    op.drop_table("auction_listings")
