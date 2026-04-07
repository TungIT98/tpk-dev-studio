from datetime import datetime
from typing import List
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean,
    JSON, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Player(Base):
    __tablename__ = "players"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    total_currency: Mapped[float] = mapped_column(Float, default=0.0)
    total_earned: Mapped[float] = mapped_column(Float, default=0.0)
    total_earned_ever: Mapped[float] = mapped_column(Float, default=0.0)
    prestige_level: Mapped[int] = mapped_column(Integer, default=0)
    prestige_points: Mapped[float] = mapped_column(Float, default=0.0)
    last_save_time: Mapped[int] = mapped_column(Integer, default=0)
    save_version: Mapped[str] = mapped_column(String(32), default="1.0")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)  # bcrypt hash; null = legacy account (must reset)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Raw JSON snapshots from game client
    businesses: Mapped[dict] = mapped_column(JSON, default=dict)
    upgrades: Mapped[dict] = mapped_column(JSON, default=dict)
    pets: Mapped[dict] = mapped_column(JSON, default=dict)
    achievements: Mapped[dict] = mapped_column(JSON, default=dict)

    leaderboard_entries: Mapped[List["LeaderboardEntry"]] = relationship(back_populates="player", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_players_prestige", "prestige_level", "total_earned"),
        Index("ix_players_updated", "updated_at"),
    )


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.user_id", ondelete="CASCADE"), nullable=False)
    total_earned: Mapped[float] = mapped_column(Float, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    player: Mapped["Player"] = relationship(back_populates="leaderboard_entries")

    __table_args__ = (
        Index("ix_leaderboard_earned", "total_earned", "submitted_at"),
        UniqueConstraint("user_id", name="uq_leaderboard_user"),
    )


class EconomyTransaction(Base):
    __tablename__ = "economy_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(String(64), nullable=False)  # income, purchase, prestige, offline
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_type: Mapped[str] = mapped_column(String(64), nullable=False)  # pet, cosmetic, boost
    rarity: Mapped[str] = mapped_column(String(32), nullable=True)  # common, rare, epic, legendary
    base_cost: Mapped[float] = mapped_column(Float, default=0.0)
    item_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PlayerItem(Base):
    __tablename__ = "player_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    item_id: Mapped[str] = mapped_column(String(128), ForeignKey("items.item_id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    acquired_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_player_item"),
        Index("ix_player_items_user", "user_id"),
    )


# ── Pet System ─────────────────────────────────────────────────────────────────

class PetType(Base):
    __tablename__ = "pet_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pet_type_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    rarity: Mapped[str] = mapped_column(String(32), nullable=False, default="common")  # common, rare, epic, legendary
    base_cost: Mapped[float] = mapped_column(Float, default=0.0)
    unlock_level: Mapped[int] = mapped_column(Integer, default=1)
    evolve_to: Mapped[str] = mapped_column(String(64), nullable=True)  # pet_type_id of evolved form
    pet_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_pet_types_rarity", "rarity"),)

    instances: Mapped[List["PetInstance"]] = relationship(back_populates="pet_type")


class PetInstance(Base):
    __tablename__ = "pet_instances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instance_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    pet_type_id: Mapped[str] = mapped_column(String(64), ForeignKey("pet_types.pet_type_id", ondelete="CASCADE"), nullable=False)
    nickname: Mapped[str] = mapped_column(String(255), nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    experience: Mapped[float] = mapped_column(Float, default=0.0)
    evolve_level_req: Mapped[int] = mapped_column(Integer, default=10)
    is_equipped: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    acquired_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pet_type: Mapped["PetType"] = relationship(back_populates="instances")
    skills: Mapped[List["PetSkill"]] = relationship(back_populates="pet_instance", cascade="all, delete-orphan")
    equipment: Mapped[List["PetEquipment"]] = relationship(back_populates="pet_instance", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pet_instances_user", "user_id"),
        Index("ix_pet_instances_type", "pet_type_id"),
    )


class PetSkill(Base):
    __tablename__ = "pet_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instance_id: Mapped[int] = mapped_column(Integer, ForeignKey("pet_instances.id", ondelete="CASCADE"), nullable=False)
    skill_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1)
    cooldown_remaining: Mapped[float] = mapped_column(Float, default=0.0)  # seconds
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    acquired_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pet_instance: Mapped["PetInstance"] = relationship(back_populates="skills")

    __table_args__ = (
        UniqueConstraint("instance_id", "skill_id", name="uq_pet_skill"),
        Index("ix_pet_skills_instance", "instance_id"),
    )


class PetEquipment(Base):
    __tablename__ = "pet_equipment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instance_id: Mapped[int] = mapped_column(Integer, ForeignKey("pet_instances.id", ondelete="CASCADE"), nullable=False)
    equipment_id: Mapped[str] = mapped_column(String(64), nullable=False)
    slot: Mapped[str] = mapped_column(String(32), nullable=False)  # head, body, accessory
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rarity: Mapped[str] = mapped_column(String(32), nullable=True)
    bonus_type: Mapped[str] = mapped_column(String(64), nullable=True)  # speed, earnings, luck
    bonus_value: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    equipped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pet_instance: Mapped["PetInstance"] = relationship(back_populates="equipment")

    __table_args__ = (
        UniqueConstraint("instance_id", "slot", name="uq_pet_equipment_slot"),
        Index("ix_pet_equipment_instance", "instance_id"),
    )


# ── Mini-games System ───────────────────────────────────────────────────────────

class MiniGameConfig(Base):
    __tablename__ = "mini_game_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    game_type: Mapped[str] = mapped_column(String(32), nullable=False)  # puzzle, reaction, trivia, endless
    min_players: Mapped[int] = mapped_column(Integer, default=1)
    max_players: Mapped[int] = mapped_column(Integer, default=1)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=60)  # max play time
    cooldown_seconds: Mapped[int] = mapped_column(Integer, default=300)  # 5 min cooldown
    reward_table: Mapped[dict] = mapped_column(JSON, default=dict)  # {rank: reward}
    entry_cost: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_minigame_type", "game_type"),)


class MiniGameSession(Base):
    __tablename__ = "mini_game_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    game_id: Mapped[str] = mapped_column(String(64), ForeignKey("mini_game_configs.game_id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")  # active, completed, abandoned
    score: Mapped[float] = mapped_column(Float, default=0.0)
    rank: Mapped[int] = mapped_column(Integer, nullable=True)
    reward_granted: Mapped[float] = mapped_column(Float, default=0.0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    game_config: Mapped["MiniGameConfig"] = relationship(foreign_keys=[game_id])

    __table_args__ = (
        Index("ix_sessions_user_game", "user_id", "game_id"),
        Index("ix_sessions_status", "status"),
    )




class MiniGameLeaderboard(Base):
    __tablename__ = "mini_game_leaderboards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[str] = mapped_column(String(64), ForeignKey("mini_game_configs.game_id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=True)
    high_score: Mapped[float] = mapped_column(Float, default=0.0)
    best_rank: Mapped[int] = mapped_column(Integer, default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("game_id", "user_id", name="uq_leaderboard_game_user"),
        Index("ix_leaderboard_game_score", "game_id", "high_score"),
    )


# ── Seasonal Events ─────────────────────────────────────────────────────────────

class SeasonalEvent(Base):
    __tablename__ = "seasonal_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)  # limited_quest, leaderboard, minigame
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # admin toggle
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="upcoming")  # upcoming, active, ended
    reward_currency_name: Mapped[str] = mapped_column(String(64), nullable=True)  # e.g. "spring_coins"
    top_n_rewards: Mapped[dict] = mapped_column(JSON, default=dict)  # {1: {currency: 5000, gems: 100}}
    exclusive_item_ids: Mapped[list] = mapped_column(JSON, default=list)  # items locked to this event
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_event_status", "status"), Index("ix_event_dates", "start_date", "end_date"))


class EventQuest(Base):
    __tablename__ = "event_quests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(64), ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False)
    quest_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    mission_type: Mapped[str] = mapped_column(String(32), nullable=False)  # play_minigame, earn_currency, visit_friends
    target_value: Mapped[float] = mapped_column(Float, default=1.0)
    points_reward: Mapped[float] = mapped_column(Float, default=1.0)  # event points
    currency_reward: Mapped[float] = mapped_column(Float, default=0.0)
    gem_reward: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("event_id", "quest_id", name="uq_event_quest"),
        Index("ix_event_quest_event", "event_id"),
    )


class PlayerEventProgress(Base):
    __tablename__ = "player_event_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(String(64), ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False)
    quest_id: Mapped[str] = mapped_column(String(64), nullable=False)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    reward_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", "quest_id", name="uq_player_event_quest"),
        Index("ix_player_event_user_event", "user_id", "event_id"),
    )


class PlayerEventCurrency(Base):
    __tablename__ = "player_event_currency"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(String(64), ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False)
    currency_name: Mapped[str] = mapped_column(String(64), nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    total_earned: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_player_event_currency"),
        Index("ix_player_event_currency_user_event", "user_id", "event_id"),
    )


class EventLeaderboard(Base):
    __tablename__ = "event_leaderboards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(64), ForeignKey("seasonal_events.event_id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)  # event points
    rank: Mapped[int] = mapped_column(Integer, default=0)
    rewards_distributed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_leaderboard_user"),
        Index("ix_event_leaderboard_event_score", "event_id", "score"),
    )


# ── Gift System ─────────────────────────────────────────────────────────────────

class GiftConfig(Base):
    __tablename__ = "gift_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    gift_type: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)  # coins_100, gems_5, golden_sword
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    currency_cost: Mapped[float] = mapped_column(Float, default=0.0)
    gem_cost: Mapped[float] = mapped_column(Float, default=0.0)
    currency_value: Mapped[float] = mapped_column(Float, default=0.0)  # how much recipient gets
    gem_value: Mapped[float] = mapped_column(Float, default=0.0)
    item_id: Mapped[str] = mapped_column(String(128), nullable=True)  # if it's an item gift
    is_free_daily: Mapped[bool] = mapped_column(Boolean, default=False)  # free once per day per friend
    is_vip_only: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GiftTransaction(Base):
    __tablename__ = "gift_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    gift_type: Mapped[str] = mapped_column(String(32), nullable=False)
    sender_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    receiver_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    currency_amount: Mapped[float] = mapped_column(Float, default=0.0)
    gem_amount: Mapped[float] = mapped_column(Float, default=0.0)
    item_id: Mapped[str] = mapped_column(String(128), nullable=True)
    was_free: Mapped[bool] = mapped_column(Boolean, default=False)  # free daily gift
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="sent")  # sent, claimed, expired
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    claimed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    __table_args__ = (
        Index("ix_gift_sender", "sender_id"),
        Index("ix_gift_receiver", "receiver_id"),
        Index("ix_gift_status", "status"),
    )


# ── Daily Engagement ─────────────────────────────────────────────────────────────

class LoginStreak(Base):
    __tablename__ = "login_streaks"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_login_date: Mapped[str] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    streak_started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DailyMission(Base):
    __tablename__ = "daily_missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mission_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    mission_type: Mapped[str] = mapped_column(String(32), nullable=False)  # play_minigame, visit_friends, earn_currency
    target_value: Mapped[float] = mapped_column(Float, default=1.0)
    reward_currency: Mapped[float] = mapped_column(Float, default=0.0)
    reward_gems: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class PlayerDailyMission(Base):
    __tablename__ = "player_daily_missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    mission_id: Mapped[str] = mapped_column(String(64), ForeignKey("daily_missions.mission_id", ondelete="CASCADE"), nullable=False)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    date_assigned: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "mission_id", "date_assigned", name="uq_player_daily_mission"),
        Index("ix_player_daily_mission_user_date", "user_id", "date_assigned"),
    )

    mission: Mapped["DailyMission"] = relationship(foreign_keys=[mission_id])


class DailyReward(Base):
    __tablename__ = "daily_rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    streak_day: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-30
    currency_reward: Mapped[float] = mapped_column(Float, default=0.0)
    gem_reward: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (UniqueConstraint("streak_day", name="uq_daily_reward_day"),)


# ── Collection System ───────────────────────────────────────────────────────────

RARITY_ORDER = {"common": 1, "rare": 2, "epic": 3, "legendary": 4}


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    theme: Mapped[str] = mapped_column(String(64), nullable=True)  # farm, ocean, space, etc.
    required_item_ids: Mapped[list] = mapped_column(JSON, default=list)  # list of item_ids needed
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    milestone_rewards: Mapped[dict] = mapped_column(JSON, default=dict)  # {25: {currency: 100}, 50: {...}}
    completion_reward: Mapped[dict] = mapped_column(JSON, default=dict)  # reward on 100%
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_collection_theme", "theme"),)


class PlayerCollectionProgress(Base):
    __tablename__ = "player_collection_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    collection_id: Mapped[str] = mapped_column(String(64), ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)
    collected_item_ids: Mapped[list] = mapped_column(JSON, default=list)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)
    claimed_milestones: Mapped[list] = mapped_column(JSON, default=list)  # [25, 50, 75]
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    total_reward_claimed: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "collection_id", name="uq_player_collection"),
        Index("ix_player_collection_user", "user_id"),
    )


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    achievement_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)  # games, collection, social, time
    target_value: Mapped[float] = mapped_column(Float, default=1.0)  # e.g. 10 games, 100 items
    current_value_field: Mapped[str] = mapped_column(String(64), nullable=True)  # e.g. "games_won"
    reward_currency: Mapped[float] = mapped_column(Float, default=0.0)
    reward_gems: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_achievement_category", "category"),)


class PlayerAchievement(Base):
    __tablename__ = "player_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    achievement_id: Mapped[str] = mapped_column(String(64), ForeignKey("achievements.achievement_id", ondelete="CASCADE"), nullable=False)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    reward_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    achievement: Mapped["Achievement"] = relationship(foreign_keys=[achievement_id])

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_player_achievement"),
        Index("ix_player_achievement_user", "user_id"),
    )


# ── Economy System ───────────────────────────────────────────────────────────────

class PlayerGem(Base):
    __tablename__ = "player_gems"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    gem_balance: Mapped[float] = mapped_column(Float, default=0.0)
    total_purchased: Mapped[float] = mapped_column(Float, default=0.0)
    total_consumed: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GemTransaction(Base):
    __tablename__ = "gem_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(String(32), nullable=False)  # purchase, consume, reward, refund
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    source: Mapped[str] = mapped_column(String(64), nullable=True)  # iap, grind, gift, event
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_gem_tx_user", "user_id"),
        Index("ix_gem_tx_created", "created_at"),
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (Index("ix_price_history_item_time", "item_id", "recorded_at"),)


class IdempotencyRecord(Base):
    """Stores idempotency keys for trade transactions to prevent double-spend."""
    __tablename__ = "idempotency_records"

    idempotency_key: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    result: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    __table_args__ = (Index("ix_idempotency_expires", "expires_at"),)


class AnomalyAlert(Base):
    """Tracks detected economy anomalies."""
    __tablename__ = "anomaly_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    alert_type: Mapped[str] = mapped_column(String(64), nullable=False)  # inflation, velocity, wash_trade
    severity: Mapped[str] = mapped_column(String(16), nullable=False)  # low, medium, high
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    anomaly_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_anomaly_user", "user_id"),
        Index("ix_anomaly_created", "created_at"),
    )


# Force all relationship mappers to resolve (handles forward references)


# --- Player Energy ---

class PlayerEnergy(Base):
    __tablename__ = "player_energy"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    current_energy: Mapped[float] = mapped_column(Float, default=100.0)
    max_energy: Mapped[float] = mapped_column(Float, default=100.0)
    regen_rate: Mapped[float] = mapped_column(Float, default=1.0)
    last_update: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PushNotificationRecord(Base):
    __tablename__ = "push_notification_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    notification_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="sent")
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_push_user", "user_id"), Index("ix_push_sent", "sent_at"))


# ── Auction House ─────────────────────────────────────────────────────────────────

class AuctionListing(Base):
    __tablename__ = "auction_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    seller_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    start_bid: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    current_bid: Mapped[float] = mapped_column(Float, nullable=True)
    current_winner_id: Mapped[str] = mapped_column(String(64), nullable=True)
    rarity_tier: Mapped[str] = mapped_column(String(16), nullable=False, default="common")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    ends_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    escrow_currency: Mapped[float] = mapped_column(Float, default=0.0)
    escrow_gems: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bids: Mapped[List["AuctionBid"]] = relationship(back_populates="listing", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_auction_status", "status"),
        Index("ix_auction_ends", "ends_at"),
        Index("ix_auction_rarity", "rarity_tier"),
    )


class AuctionBid(Base):
    __tablename__ = "auction_bids"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    auction_id: Mapped[int] = mapped_column(Integer, ForeignKey("auction_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    is_winning: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    listing: Mapped["AuctionListing"] = relationship(back_populates="bids")

    __table_args__ = (Index("ix_bid_bidder", "bidder_id"),)


# ── Trading System ──────────────────────────────────────────────────────────────

class TradeOffer(Base):
    """A two-party trade offer between players."""
    __tablename__ = "trade_offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trade_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    initiator_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)   # player who created the offer
    receiver_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)    # player who can accept/decline
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")  # pending, accepted, declined, cancelled, expired
    # Offered items (pet instance IDs or item instance IDs)
    initiator_offer: Mapped[dict] = mapped_column(JSON, default=dict)   # {"pet_instance_ids": [...], "item_ids": [...], "currency": 0}
    receiver_offer: Mapped[dict] = mapped_column(JSON, default=dict)    # same structure
    initiator_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    receiver_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_trade_initiator", "initiator_id"),
        Index("ix_trade_receiver", "receiver_id"),
        Index("ix_trade_status", "status"),
        Index("ix_trade_expires", "expires_at"),
    )


class TradeTransaction(Base):
    """Record of a completed trade for audit and history."""
    __tablename__ = "trade_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trade_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    initiator_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    receiver_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    initiator_pet_ids: Mapped[dict] = mapped_column(JSON, default=dict)
    receiver_pet_ids: Mapped[dict] = mapped_column(JSON, default=dict)
    initiator_item_ids: Mapped[dict] = mapped_column(JSON, default=dict)
    receiver_item_ids: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(16), nullable=False)   # completed, reversed
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_trade_tx_initiator", "initiator_id"),
        Index("ix_trade_tx_receiver", "receiver_id"),
    )
