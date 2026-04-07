from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


# ── Player ────────────────────────────────────────────────────────────────────


class PlayerSaveRequest(BaseModel):
    user_id: str
    username: str
    total_currency: float = 0.0
    total_earned: float = 0.0
    total_earned_ever: float = 0.0
    prestige_level: int = 0
    prestige_points: float = 0.0
    businesses: Dict[str, Any] = Field(default_factory=dict)
    upgrades: Dict[str, Any] = Field(default_factory=dict)
    pets: Dict[str, Any] = Field(default_factory=dict)
    save_version: str = "1.0"
    saved_at: int = Field(default_factory=int)


class PlayerResponse(BaseModel):
    user_id: str
    username: str
    total_currency: float
    total_earned: float
    total_earned_ever: float
    prestige_level: int
    prestige_points: float
    businesses: Dict[str, Any]
    upgrades: Dict[str, Any]
    pets: Dict[str, Any]
    last_save_time: int
    save_version: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OfflineEarningsRequest(BaseModel):
    user_id: str
    last_save_time: int
    now: int


class OfflineEarningsResponse(BaseModel):
    offline_earnings: float
    new_currency: float
    earnings_rate: float = 0.5


# ── Leaderboard ───────────────────────────────────────────────────────────────


class LeaderboardRankRequest(BaseModel):
    user_id: str
    total_earned: float


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    username: str
    total_earned: float
    submitted_at: datetime


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntryResponse]
    total: int


# ── Auth ──────────────────────────────────────────────────────────────────────


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: str
    username: str


# ── Pets ───────────────────────────────────────────────────────────────────────

class PetTypeResponse(BaseModel):
    pet_type_id: str
    name: str
    description: Optional[str] = None
    rarity: str
    base_cost: float
    unlock_level: int
    evolve_to: Optional[str] = None
    pet_metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True

    model_config = {"from_attributes": True}


class PetSkillResponse(BaseModel):
    id: int
    skill_id: str
    name: str
    level: int
    cooldown_remaining: float
    is_active: bool

    model_config = {"from_attributes": True}


class PetEquipmentResponse(BaseModel):
    id: int
    equipment_id: str
    slot: str
    name: str
    rarity: Optional[str] = None
    bonus_type: Optional[str] = None
    bonus_value: float
    is_active: bool

    model_config = {"from_attributes": True}


class PetInstanceResponse(BaseModel):
    instance_id: str
    user_id: str
    pet_type_id: str
    pet_type: Optional[PetTypeResponse] = None
    nickname: Optional[str] = None
    level: int
    experience: float
    evolve_level_req: int
    is_equipped: bool
    is_active: bool
    acquired_at: Optional[datetime] = None
    skills: List[PetSkillResponse] = Field(default_factory=list)
    equipment: List[PetEquipmentResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PetEvolveRequest(BaseModel):
    user_id: str


class PetEquipRequest(BaseModel):
    user_id: str
    equipment_id: str
    slot: str  # head, body, accessory


class PetEquipResponse(BaseModel):
    instance_id: str
    slot: str
    equipment: PetEquipmentResponse


class PetAcquireRequest(BaseModel):
    user_id: str
    pet_type_id: str
    nickname: Optional[str] = None


# ── Mini-games ─────────────────────────────────────────────────────────────────

class MiniGameConfigResponse(BaseModel):
    game_id: str
    name: str
    description: Optional[str] = None
    game_type: str
    min_players: int
    max_players: int
    duration_seconds: int
    cooldown_seconds: int
    reward_table: Dict[str, Any] = Field(default_factory=dict)
    entry_cost: float
    is_active: bool

    model_config = {"from_attributes": True}


class MiniGameStartRequest(BaseModel):
    user_id: str
    username: str


class MiniGameStartResponse(BaseModel):
    session_id: str
    game_id: str
    status: str
    cooldown_remaining: float = 0.0  # seconds until next play allowed


class MiniGameScoreSubmitRequest(BaseModel):
    user_id: str
    score: float
    game_data: Optional[Dict[str, Any]] = None  # extra metadata (time, accuracy, etc.)


class MiniGameScoreResponse(BaseModel):
    session_id: str
    game_id: str
    score: float
    rank: int
    reward_granted: float
    status: str


class MiniGameLeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: Optional[str] = None
    high_score: float
    best_rank: int
    games_played: int

    model_config = {"from_attributes": True}


class MiniGameLeaderboardResponse(BaseModel):
    game_id: str
    entries: List[MiniGameLeaderboardEntry]
    total: int


class MiniGameCooldownResponse(BaseModel):
    game_id: str
    cooldown_remaining: float  # seconds, 0 if not in cooldown


# ── Daily Engagement ────────────────────────────────────────────────────────────

class EnergyStatusResponse(BaseModel):
    user_id: str
    current_energy: float
    max_energy: float
    regen_rate: float
    energy_percent: float


class EnergySpendRequest(BaseModel):
    amount: float


class EnergySpendResponse(BaseModel):
    user_id: str
    energy_spent: float
    new_energy: float
    energy_full: bool


class RetentionStatsResponse(BaseModel):
    dau: int
    dau_1d_ago: int
    retention_1d: float
    retention_7d: float
    retention_30d: float
    total_players: int


# ── Seasonal Events ─────────────────────────────────────────────────────────────

class SeasonalEventResponse(BaseModel):
    event_id: str
    name: str
    description: Optional[str] = None
    event_type: str
    start_date: datetime
    end_date: datetime
    is_active: bool
    status: str
    reward_currency_name: Optional[str] = None
    top_n_rewards: Dict[str, Any] = Field(default_factory=dict)
    exclusive_item_ids: List[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class EventQuestResponse(BaseModel):
    quest_id: str
    event_id: str
    name: str
    description: Optional[str] = None
    mission_type: str
    target_value: float
    points_reward: float
    currency_reward: float
    gem_reward: float
    is_active: bool

    model_config = {"from_attributes": True}


class PlayerEventProgressResponse(BaseModel):
    user_id: str
    event_id: str
    quest_id: str
    progress: float
    completed: bool
    reward_claimed: bool

    model_config = {"from_attributes": True}


class EventLeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: Optional[str] = None
    score: float
    rewards_distributed: bool

    model_config = {"from_attributes": True}


class EventLeaderboardResponse(BaseModel):
    event_id: str
    entries: List[EventLeaderboardEntry]
    total: int


class EventClaimRequest(BaseModel):
    user_id: str
    quest_id: str


class EventClaimResponse(BaseModel):
    event_id: str
    quest_id: str
    user_id: str
    points_earned: float
    currency_reward: float
    gem_reward: float
    already_claimed: bool


class EventJoinRequest(BaseModel):
    user_id: str
    username: str


class EventPointsEarnRequest(BaseModel):
    user_id: str
    quest_id: str
    delta: float


# ── Gift System ─────────────────────────────────────────────────────────────────

class GiftConfigResponse(BaseModel):
    gift_type: str
    name: str
    currency_cost: float
    gem_cost: float
    currency_value: float
    gem_value: float
    item_id: Optional[str] = None
    is_free_daily: bool
    is_vip_only: bool
    is_active: bool

    model_config = {"from_attributes": True}


class GiftSendRequest(BaseModel):
    sender_id: str
    receiver_id: str
    gift_type: str


class GiftSendResponse(BaseModel):
    success: bool
    gift_transaction_id: int
    status: str
    cooldown_remaining: float = 0.0


class GiftClaimRequest(BaseModel):
    receiver_id: str


class GiftTransactionResponse(BaseModel):
    id: int
    gift_type: str
    sender_id: str
    receiver_id: str
    currency_amount: float
    gem_amount: float
    item_id: Optional[str] = None
    was_free: bool
    status: str
    sent_at: datetime
    claimed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GiftCooldownResponse(BaseModel):
    receiver_id: str
    gift_type: str
    can_send: bool
    cooldown_remaining: float  # seconds until cooldown expires


# ── Daily Engagement ────────────────────────────────────────────────────────────

class LoginStreakResponse(BaseModel):
    user_id: str
    current_streak: int
    longest_streak: int
    last_login_date: Optional[str] = None
    streak_day_eligible: bool  # True if they can claim today's reward

    model_config = {"from_attributes": True}


class DailyMissionResponse(BaseModel):
    mission_id: str
    name: str
    description: Optional[str] = None
    mission_type: str
    target_value: float
    reward_currency: float
    reward_gems: float
    is_active: bool

    model_config = {"from_attributes": True}


class PlayerDailyMissionResponse(BaseModel):
    user_id: str
    mission_id: str
    mission: Optional[DailyMissionResponse] = None
    progress: float
    completed: bool
    claimed: bool
    date_assigned: str

    model_config = {"from_attributes": True}


class MissionProgressUpdateRequest(BaseModel):
    user_id: str
    delta: float


class DailyRewardResponse(BaseModel):
    streak_day: int
    currency_reward: float
    gem_reward: float

    model_config = {"from_attributes": True}


# ── Collections ─────────────────────────────────────────────────────────────────

class CollectionResponse(BaseModel):
    collection_id: str
    name: str
    description: Optional[str] = None
    theme: Optional[str] = None
    required_item_ids: List[str] = Field(default_factory=list)
    total_items: int
    milestone_rewards: Dict[str, Any] = Field(default_factory=dict)
    completion_reward: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool

    model_config = {"from_attributes": True}


class PlayerCollectionProgressResponse(BaseModel):
    user_id: str
    collection_id: str
    collected_item_ids: List[str] = Field(default_factory=list)
    progress_percent: float
    claimed_milestones: List[int] = Field(default_factory=list)
    completed: bool
    total_reward_claimed: float

    model_config = {"from_attributes": True}


class CollectionItemCollectRequest(BaseModel):
    user_id: str
    item_id: str


class CollectionProgressUpdateRequest(BaseModel):
    user_id: str
    collected_item_ids: List[str]


class AchievementResponse(BaseModel):
    achievement_id: str
    name: str
    description: Optional[str] = None
    category: str
    target_value: float
    reward_currency: float
    reward_gems: float
    is_active: bool

    model_config = {"from_attributes": True}


class PlayerAchievementResponse(BaseModel):
    user_id: str
    achievement_id: str
    achievement: Optional[AchievementResponse] = None
    progress: float
    completed: bool
    reward_claimed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AchievementProgressUpdateRequest(BaseModel):
    user_id: str
    delta: float  # amount to add to progress


class AchievementClaimResponse(BaseModel):
    achievement_id: str
    user_id: str
    reward_currency: float
    reward_gems: float
    already_claimed: bool


# ── Economy ─────────────────────────────────────────────────────────────────────

class EconomyBalanceResponse(BaseModel):
    user_id: str
    currency_balance: float
    gem_balance: float
    total_purchased_gems: float
    total_consumed_gems: float


class TradeExecuteRequest(BaseModel):
    idempotency_key: str
    from_user_id: str
    to_user_id: str
    currency_amount: float = 0.0
    gem_amount: float = 0.0
    item_id: Optional[str] = None


class TradeExecuteResponse(BaseModel):
    success: bool
    idempotency_key: str
    from_new_balance: float
    to_new_balance: float
    gem_from_new: float = 0.0
    gem_to_new: float = 0.0
    transaction_ids: List[str] = Field(default_factory=list)


class GemPurchaseRequest(BaseModel):
    idempotency_key: str
    user_id: str
    gem_amount: float
    price_paid: float
    source: str = "iap"  # iap, grind, gift, event


class GemConsumeRequest(BaseModel):
    idempotency_key: str
    user_id: str
    gem_amount: float
    description: Optional[str] = None


class GemTransactionResponse(BaseModel):
    id: int
    user_id: str
    transaction_type: str
    amount: float
    balance_after: float
    description: Optional[str] = None
    source: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceHistoryResponse(BaseModel):
    item_id: str
    prices: List[Dict[str, Any]]  # [{price, recorded_at}]


class MarketStatsResponse(BaseModel):
    total_currency_in_circulation: float
    total_gems_in_circulation: float
    active_traders_24h: int
    avg_trade_volume_24h: float
    active_anomaly_alerts: int


class AnomalyAlertResponse(BaseModel):
    id: int
    user_id: str
    alert_type: str
    severity: str
    description: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Auction House ─────────────────────────────────────────────────────────────────

class AuctionListingCreate(BaseModel):
    item_id: str
    seller_id: str
    start_bid: float = 0.0
    duration_hours: int = Field(24, ge=1, le=168)
    rarity_tier: str = Field("common", pattern="^(common|uncommon|rare|epic|legendary|mythic)$")


class AuctionListingResponse(BaseModel):
    id: int
    item_id: str
    seller_id: str
    start_bid: float
    current_bid: Optional[float] = None
    current_winner_id: Optional[str] = None
    rarity_tier: str
    status: str
    ends_at: datetime
    escrow_currency: float = 0.0
    escrow_gems: float = 0.0
    bid_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class AuctionBidRequest(BaseModel):
    bidder_id: str
    amount: float
    idempotency_key: str


class AuctionBidResponse(BaseModel):
    success: bool
    auction_id: int
    bidder_id: str
    amount: float
    current_bid: float
    current_winner_id: str
    anti_snipe_extended: bool
    ends_at: datetime
    bid_id: int


class AuctionSearchRequest(BaseModel):
    rarity: Optional[str] = Field(None, pattern="^(common|uncommon|rare|epic|legendary|mythic)$")
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field("active", pattern="^(active|ended|cancelled)$")
    item_type: Optional[str] = None
    sort_by: str = Field("ends_at", pattern="^(ends_at|current_bid|rarity)$")
    limit: int = Field(20, ge=1, le=100)


class AuctionSearchResponse(BaseModel):
    auctions: List[AuctionListingResponse]
    total: int
    page: int


class PricingOracleResponse(BaseModel):
    item_id: str
    rarity_tier: str
    estimated_floor: float
    estimated_ceiling: float
    recent_avg_price: Optional[float] = None
    active_listings: int
    price_tier: str  # cheap, moderate, expensive, premium


class AuctionRateLimitResponse(BaseModel):
    user_id: str
    listings_remaining: int
    bids_remaining_today: int
    listings_reset_at: Optional[datetime] = None
    bids_reset_at: Optional[datetime] = None


class AuctionSettlementResponse(BaseModel):
    auction_id: int
    seller_id: str
    winner_id: str
    final_price: float
    item_transferred: bool
    currency_transferred: bool
    status: str


# ── Trading ──────────────────────────────────────────────────────────────────────


class TradeOfferItemSpec(BaseModel):
    """Items offered in a trade."""
    pet_instance_ids: List[str] = Field(default_factory=list)
    item_ids: List[str] = Field(default_factory=list)
    currency: float = Field(default=0.0, ge=0)


class TradeCreateRequest(BaseModel):
    initiator_id: str
    receiver_id: str
    initiator_offer: TradeOfferItemSpec
    receiver_offer: TradeOfferItemSpec
    expires_in_hours: int = Field(default=24, ge=1, le=168)


class TradeOfferResponse(BaseModel):
    trade_id: str
    initiator_id: str
    receiver_id: str
    status: str
    initiator_offer: TradeOfferItemSpec
    receiver_offer: TradeOfferItemSpec
    initiator_confirmed: bool
    receiver_confirmed: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TradeTransactionResponse(BaseModel):
    trade_id: str
    initiator_id: str
    receiver_id: str
    initiator_pet_ids: dict
    receiver_pet_ids: dict
    initiator_item_ids: dict
    receiver_item_ids: dict
    status: str
    completed_at: datetime

    model_config = {"from_attributes": True}


class TradeConfirmRequest(BaseModel):
    user_id: str


class TradeCancelRequest(BaseModel):
    user_id: str


class TradeListResponse(BaseModel):
    trades: List[TradeOfferResponse]
    total: int
    page: int
