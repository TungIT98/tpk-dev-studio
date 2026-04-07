"""Add pet system tables

Revision ID: 002_pet_system
Revises: 001_initial
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_pet_system"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Pet types catalog
    op.create_table(
        "pet_types",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("pet_type_id", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column("rarity", sa.String(32), nullable=False, server_default="common"),
        sa.Column("base_cost", sa.Float(), default=0.0),
        sa.Column("unlock_level", sa.Integer(), default=1),
        sa.Column("evolve_to", sa.String(64), nullable=True),
        sa.Column("pet_metadata", postgresql.JSON, default=dict),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_pet_types_rarity", "pet_types", ["rarity"])

    # Pet instances
    op.create_table(
        "pet_instances",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("instance_id", sa.String(128), unique=True, nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("pet_type_id", sa.String(64), sa.ForeignKey("pet_types.pet_type_id", ondelete="CASCADE"), nullable=False),
        sa.Column("nickname", sa.String(255), nullable=True),
        sa.Column("level", sa.Integer(), default=1),
        sa.Column("experience", sa.Float(), default=0.0),
        sa.Column("evolve_level_req", sa.Integer(), default=10),
        sa.Column("is_equipped", sa.Boolean(), default=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("acquired_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_pet_instances_user", "pet_instances", ["user_id"])
    op.create_index("ix_pet_instances_type", "pet_instances", ["pet_type_id"])

    # Pet skills
    op.create_table(
        "pet_skills",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("instance_id", sa.Integer(), sa.ForeignKey("pet_instances.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("level", sa.Integer(), default=1),
        sa.Column("cooldown_remaining", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("acquired_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_pet_skills_instance", "pet_skills", ["instance_id"])
    op.create_unique_constraint("uq_pet_skill", "pet_skills", ["instance_id", "skill_id"])

    # Pet equipment
    op.create_table(
        "pet_equipment",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("instance_id", sa.Integer(), sa.ForeignKey("pet_instances.id", ondelete="CASCADE"), nullable=False),
        sa.Column("equipment_id", sa.String(64), nullable=False),
        sa.Column("slot", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("rarity", sa.String(32), nullable=True),
        sa.Column("bonus_type", sa.String(64), nullable=True),
        sa.Column("bonus_value", sa.Float(), default=0.0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("equipped_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_pet_equipment_instance", "pet_equipment", ["instance_id"])
    op.create_unique_constraint("uq_pet_equipment_slot", "pet_equipment", ["instance_id", "slot"])


def downgrade() -> None:
    op.drop_table("pet_equipment")
    op.drop_table("pet_skills")
    op.drop_table("pet_instances")
    op.drop_table("pet_types")
