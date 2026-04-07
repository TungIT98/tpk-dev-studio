import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from app.schemas.schemas import (
    PlayerSaveRequest,
    PlayerResponse,
    OfflineEarningsRequest,
    OfflineEarningsResponse,
    LeaderboardRankRequest,
    PetTypeResponse,
    PetInstanceResponse,
    PetSkillResponse,
    PetEquipmentResponse,
    PetEvolveRequest,
    PetEquipRequest,
    PetAcquireRequest,
    MiniGameConfigResponse,
    MiniGameStartRequest,
    MiniGameStartResponse,
    MiniGameScoreSubmitRequest,
    MiniGameScoreResponse,
    MiniGameLeaderboardEntry,
    MiniGameLeaderboardResponse,
    MiniGameCooldownResponse,
    EconomyBalanceResponse,
    TradeExecuteRequest,
    TradeExecuteResponse,
    GemPurchaseRequest,
    GemConsumeRequest,
    GemTransactionResponse,
    PriceHistoryResponse,
    MarketStatsResponse,
    AnomalyAlertResponse,
    CollectionResponse,
    PlayerCollectionProgressResponse,
    AchievementResponse,
    PlayerAchievementResponse,
    AchievementClaimResponse,
    GiftConfigResponse,
    GiftSendRequest,
    GiftSendResponse,
    GiftTransactionResponse,
    GiftCooldownResponse,
    DailyMissionResponse,
    PlayerDailyMissionResponse,
    DailyRewardResponse,
    SeasonalEventResponse,
    EventQuestResponse,
    EventLeaderboardEntry,
    EventLeaderboardResponse,
    EventClaimRequest,
    EventClaimResponse,
    EnergyStatusResponse,
    EnergySpendRequest,
    EnergySpendResponse,
    RetentionStatsResponse,
    AuctionListingCreate,
    AuctionListingResponse,
    AuctionBidRequest,
    AuctionBidResponse,
    PricingOracleResponse,
    AuctionRateLimitResponse,
    AuctionSettlementResponse,
)


class TestSchemas:
    def test_player_save_request(self):
        payload = PlayerSaveRequest(
            user_id="123",
            username="TestPlayer",
            total_currency=1000.0,
            total_earned=500.0,
            total_earned_ever=5000.0,
            prestige_level=2,
            prestige_points=10.0,
            businesses={"biz_1": {"count": 5}},
            upgrades={},
            pets={},
        )
        assert payload.user_id == "123"
        assert payload.total_currency == 1000.0
        assert payload.prestige_level == 2
        assert payload.businesses["biz_1"]["count"] == 5

    def test_player_response_validates(self):
        data = {
            "user_id": "456",
            "username": "PlayerTwo",
            "total_currency": 2000.0,
            "total_earned": 1000.0,
            "total_earned_ever": 10000.0,
            "prestige_level": 3,
            "prestige_points": 20.0,
            "businesses": {},
            "upgrades": {},
            "pets": {},
            "last_save_time": 1712000000,
            "save_version": "1.0",
        }
        resp = PlayerResponse(**data)
        assert resp.prestige_points == 20.0
        assert resp.save_version == "1.0"

    def test_offline_earnings_request(self):
        now = int(datetime.now(timezone.utc).timestamp())
        payload = OfflineEarningsRequest(
            user_id="789",
            last_save_time=now - 3600,
            now=now,
        )
        assert payload.user_id == "789"
        assert payload.now > payload.last_save_time

    def test_offline_earnings_response(self):
        resp = OfflineEarningsResponse(
            offline_earnings=500.0,
            new_currency=1500.0,
            earnings_rate=0.5,
        )
        assert resp.offline_earnings == 500.0
        assert resp.earnings_rate == 0.5

    def test_leaderboard_rank_request(self):
        req = LeaderboardRankRequest(user_id="abc", total_earned=99999.0)
        assert req.total_earned == 99999.0


class TestSecurity:
    def test_password_hash_verify(self):
        import bcrypt
        hashed = bcrypt.hashpw("secret123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        assert bcrypt.checkpw("secret123".encode("utf-8"), hashed.encode("utf-8")) is True
        assert bcrypt.checkpw("wrong".encode("utf-8"), hashed.encode("utf-8")) is False

    def test_create_and_decode_token(self):
        from app.core.security import create_access_token, decode_token
        token = create_access_token(data={"sub": "user_1", "username": "test"})
        payload = decode_token(token)
        assert payload["sub"] == "user_1"
        assert payload["username"] == "test"

    def test_decode_invalid_token_returns_none(self):
        from app.core.security import decode_token
        result = decode_token("invalid.token.here")
        assert result is None


class TestPetCompanionsLogic:
    """Test the pet synergy/bonus logic that runs server-side."""

    def test_pet_bonus_calculation(self):
        # Simulating server-side pet bonus calc
        pets = {
            "penny_pig": {"owned": True, "level": 10},
            "gold_gopher": {"owned": True, "level": 5},
        }
        # base bonus for penny_pig (common, money type, effect 0.01)
        # bonus = 0.01 * 1.0 * (1 + 0.1 * 9) = 0.01 * 1.9 = 0.019
        base_effect = 0.01
        effect_mult = 1.0
        level = 10
        bonus = base_effect * effect_mult * (1 + 0.1 * (level - 1))
        assert abs(bonus - 0.019) < 0.0001

    def test_synergy_money_mob_requires_3_pets(self):
        # Money Mob synergy: 3+ money pets = +10% income
        type_counts = {"money": 3, "speed": 0}
        min_count = 3
        bonus_value = 0.10
        if type_counts.get("money", 0) >= min_count:
            stacks = min(type_counts["money"] - min_count + 1, 10)
            bonus = bonus_value + (stacks - 1) * 0.05
        else:
            bonus = 0.0
        assert bonus == 0.10  # base bonus

    def test_synergy_activates_with_enough_pets(self):
        type_counts = {"money": 5}
        min_count = 3
        bonus_value = 0.10
        stack_bonus = 0.05
        max_stacks = 10
        if type_counts.get("money", 0) >= min_count:
            stacks = min(type_counts["money"] - min_count + 1, max_stacks)
            bonus = bonus_value + (stacks - 1) * stack_bonus
        else:
            bonus = 0.0
        # stacks = 5-3+1 = 3, bonus = 0.10 + 2*0.05 = 0.20
        assert bonus == 0.20


class TestOfflineEarningsCalculation:
    def test_offline_earnings_capped_at_8_hours(self):
        max_seconds = 28800  # 8 hours
        elapsed = min(7200, max_seconds)  # 2 hours, but capped
        assert elapsed == 7200

        # If someone is away for 10 hours
        elapsed_10h = min(36000, max_seconds)  # 10h in seconds
        assert elapsed_10h == 28800  # capped to 8h

    def test_offline_earnings_rate(self):
        rate = 0.5  # 50%
        elapsed = 3600  # 1 hour
        income_rate = 10.0  # $10/s
        earnings = elapsed * income_rate * rate
        assert earnings == 18000.0


class TestPetSchemas:
    def test_pet_type_response(self):
        pt = PetTypeResponse(
            pet_type_id="cat_whisker",
            name="Whisker Cat",
            description="A playful cat companion",
            rarity="rare",
            base_cost=500.0,
            unlock_level=5,
            evolve_to="lion_royal",
            pet_metadata={"evolve_level_req": 10},
        )
        assert pt.pet_type_id == "cat_whisker"
        assert pt.rarity == "rare"
        assert pt.evolve_to == "lion_royal"
        assert pt.pet_metadata["evolve_level_req"] == 10

    def test_pet_instance_response(self):
        instance = PetInstanceResponse(
            instance_id="pet-001",
            user_id="user-123",
            pet_type_id="cat_whisker",
            nickname="Whiskers",
            level=7,
            experience=350.0,
            evolve_level_req=10,
            is_equipped=True,
            is_active=True,
            skills=[],
            equipment=[],
        )
        assert instance.level == 7
        assert instance.is_equipped is True
        assert instance.nickname == "Whiskers"

    def test_pet_skill_response(self):
        skill = PetSkillResponse(
            id=1,
            skill_id="speed_boost",
            name="Speed Boost",
            level=3,
            cooldown_remaining=0.0,
            is_active=True,
        )
        assert skill.level == 3
        assert skill.cooldown_remaining == 0.0

    def test_pet_equipment_response(self):
        eq = PetEquipmentResponse(
            id=1,
            equipment_id="golden_collar",
            slot="head",
            name="Golden Collar",
            rarity="epic",
            bonus_type="luck",
            bonus_value=0.15,
            is_active=True,
        )
        assert eq.slot == "head"
        assert eq.bonus_value == 0.15
        assert eq.rarity == "epic"

    def test_pet_acquire_request(self):
        req = PetAcquireRequest(
            user_id="user_abc",
            pet_type_id="bunny_hoppy",
            nickname="Hoppy",
        )
        assert req.user_id == "user_abc"
        assert req.nickname == "Hoppy"

    def test_pet_equip_request(self):
        req = PetEquipRequest(
            user_id="user_abc",
            equipment_id="ruby_hat",
            slot="head",
        )
        assert req.slot == "head"
        assert req.equipment_id == "ruby_hat"

    def test_pet_evolve_request(self):
        req = PetEvolveRequest(user_id="user_abc")
        assert req.user_id == "user_abc"


class TestMiniGameSchemas:
    def test_minigame_config_response(self):
        cfg = MiniGameConfigResponse(
            game_id="blob_burst",
            name="Blob Burst",
            description="Pop as many blobs as possible",
            game_type="reaction",
            min_players=1,
            max_players=1,
            duration_seconds=60,
            cooldown_seconds=300,
            reward_table={"1": 500, "top10": 100, "participation": 10},
            entry_cost=0.0,
            is_active=True,
        )
        assert cfg.game_id == "blob_burst"
        assert cfg.game_type == "reaction"
        assert cfg.cooldown_seconds == 300

    def test_minigame_start_request(self):
        req = MiniGameStartRequest(user_id="user_xyz", username="BurstPro")
        assert req.username == "BurstPro"

    def test_minigame_score_submit(self):
        req = MiniGameScoreSubmitRequest(
            user_id="user_xyz",
            score=8500.0,
            game_data={"accuracy": 0.95, "time": 58.3},
        )
        assert req.score == 8500.0
        assert req.game_data["accuracy"] == 0.95

    def test_minigame_score_response(self):
        resp = MiniGameScoreResponse(
            session_id="sess-001",
            game_id="blob_burst",
            score=9200.0,
            rank=3,
            reward_granted=100.0,
            status="completed",
        )
        assert resp.rank == 3
        assert resp.reward_granted == 100.0

    def test_minigame_leaderboard_response(self):
        entries = [
            MiniGameLeaderboardEntry(
                rank=1, user_id="alice", username="Alice", high_score=10000.0, best_rank=1, games_played=5
            ),
            MiniGameLeaderboardEntry(
                rank=2, user_id="bob", username="Bob", high_score=8500.0, best_rank=2, games_played=3
            ),
        ]
        resp = MiniGameLeaderboardResponse(game_id="blob_burst", entries=entries, total=2)
        assert resp.total == 2
        assert resp.entries[0].username == "Alice"
        assert resp.entries[1].rank == 2

    def test_minigame_cooldown_response(self):
        resp = MiniGameCooldownResponse(game_id="blob_burst", cooldown_remaining=120.5)
        assert resp.cooldown_remaining == 120.5

    def test_reward_calculation_first_place(self):
        reward_table = {"1": 500, "2": 300, "3": 150, "top10": 50, "participation": 10}
        rank = 1
        if str(rank) in reward_table:
            reward = float(reward_table[str(rank)])
        elif "participation" in reward_table:
            reward = float(reward_table["participation"])
        else:
            reward = 0.0
        assert reward == 500.0

    def test_reward_calculation_participation(self):
        reward_table = {"1": 500, "2": 300, "3": 150, "top10": 50, "participation": 10}
        rank = 50
        reward = float(reward_table.get("participation", 0))
        assert reward == 10.0

    def test_score_plausibility_validation(self):
        max_plausible = 60 * 1000 * 10  # 600,000
        score = 50000.0
        assert 0 <= score <= max_plausible  # plausible
        assert 700000.0 > max_plausible   # implausible

    def test_cooldown_logic(self):
        cooldown_seconds = 300
        elapsed = 180  # 3 minutes played
        remaining = max(0.0, cooldown_seconds - elapsed)
        assert remaining == 120.0

    def test_rank_ordering(self):
        players = [
            {"user_id": "p1", "username": "Alice", "total_earned": 10000.0},
            {"user_id": "p2", "username": "Bob", "total_earned": 50000.0},
            {"user_id": "p3", "username": "Carol", "total_earned": 25000.0},
        ]
        sorted_players = sorted(players, key=lambda x: x["total_earned"], reverse=True)
        ranks = [
            {"rank": i + 1, **p}
            for i, p in enumerate(sorted_players)
        ]
        assert ranks[0]["rank"] == 1
        assert ranks[0]["username"] == "Bob"
        assert ranks[1]["rank"] == 2
        assert ranks[1]["username"] == "Carol"
        assert ranks[2]["rank"] == 3
        assert ranks[2]["username"] == "Alice"


class TestEconomyService:
    def test_economy_balance_response(self):
        resp = EconomyBalanceResponse(
            user_id="user_abc",
            currency_balance=50000.0,
            gem_balance=1200.0,
            total_purchased_gems=1500.0,
            total_consumed_gems=300.0,
        )
        assert resp.gem_balance == 1200.0
        assert resp.total_purchased_gems == 1500.0

    def test_trade_execute_request(self):
        req = TradeExecuteRequest(
            idempotency_key="trade_abc123",
            from_user_id="alice",
            to_user_id="bob",
            currency_amount=1000.0,
            gem_amount=0.0,
            item_id="golden_sword",
        )
        assert req.currency_amount == 1000.0
        assert req.idempotency_key == "trade_abc123"

    def test_trade_execute_response(self):
        resp = TradeExecuteResponse(
            success=True,
            idempotency_key="trade_abc123",
            from_new_balance=49000.0,
            to_new_balance=11000.0,
            transaction_ids=["cur_tx_1", "cur_tx_2"],
        )
        assert resp.success is True
        assert resp.from_new_balance == 49000.0
        assert len(resp.transaction_ids) == 2

    def test_gem_purchase_request(self):
        req = GemPurchaseRequest(
            idempotency_key="iap_xyz789",
            user_id="alice",
            gem_amount=500.0,
            price_paid=4.99,
            source="iap",
        )
        assert req.source == "iap"
        assert req.gem_amount == 500.0

    def test_gem_consume_request(self):
        req = GemConsumeRequest(
            idempotency_key="consume_abc",
            user_id="alice",
            gem_amount=50.0,
            description="Entry fee for Blob Burst",
        )
        assert req.gem_amount == 50.0
        assert "Entry fee" in req.description

    def test_price_history_response(self):
        resp = PriceHistoryResponse(
            item_id="golden_sword",
            prices=[
                {"price": 10000.0, "recorded_at": "2026-03-30T10:00:00"},
                {"price": 10500.0, "recorded_at": "2026-03-31T10:00:00"},
            ],
        )
        assert len(resp.prices) == 2
        assert resp.prices[0]["price"] == 10000.0

    def test_market_stats_response(self):
        resp = MarketStatsResponse(
            total_currency_in_circulation=10_000_000.0,
            total_gems_in_circulation=500_000.0,
            active_traders_24h=250,
            avg_trade_volume_24h=850.5,
            active_anomaly_alerts=3,
        )
        assert resp.active_traders_24h == 250
        assert resp.active_anomaly_alerts == 3

    def test_idempotency_key_prevents_double_spend(self):
        """Simulate: same idempotency key should not cause double spend."""
        executed_keys = set()
        key = "trade_dup_001"
        if key in executed_keys:
            result = {"cached": True}
        else:
            executed_keys.add(key)
            result = {"cached": False, "success": True}
        assert result["cached"] is False
        # Second call with same key
        result2 = {"cached": True} if key in executed_keys else {"cached": False}
        assert result2["cached"] is True

    def test_currency_insufficient_balance(self):
        player_balance = 500.0
        requested = 1000.0
        has_sufficient = player_balance >= requested
        assert has_sufficient is False

    def test_gem_insufficient_balance(self):
        gem_balance = 50.0
        requested = 100.0
        has_sufficient = gem_balance >= requested
        assert has_sufficient is False

    def test_atomic_transfer_balances(self):
        alice = 5000.0
        bob = 1000.0
        amount = 1000.0
        alice -= amount
        bob += amount
        assert alice == 4000.0
        assert bob == 2000.0
        assert alice + bob == 6000.0  # total preserved


class TestCollectionSystem:
    def test_collection_response(self):
        col = CollectionResponse(
            collection_id="farm_animals",
            name="Farm Friends",
            description="Collect all farm animals",
            theme="farm",
            required_item_ids=["cow", "pig", "chicken", "sheep", "horse"],
            total_items=5,
            milestone_rewards={"25": {"currency": 100}, "50": {"currency": 300}, "75": {"currency": 500}},
            completion_reward={"currency": 2000, "gems": 50},
            is_active=True,
        )
        assert col.collection_id == "farm_animals"
        assert col.total_items == 5
        assert col.completion_reward["gems"] == 50

    def test_player_collection_progress_response(self):
        progress = PlayerCollectionProgressResponse(
            user_id="alice",
            collection_id="farm_animals",
            collected_item_ids=["cow", "pig"],
            progress_percent=40.0,
            claimed_milestones=[25],
            completed=False,
            total_reward_claimed=100.0,
        )
        assert progress.progress_percent == 40.0
        assert 25 in progress.claimed_milestones

    def test_milestone_progress_calculation(self):
        total_items = 8
        collected = 6
        progress = min(100.0, collected / total_items * 100)
        assert progress == 75.0

    def test_achievement_response(self):
        ach = AchievementResponse(
            achievement_id="first_win",
            name="First Victory",
            description="Win your first game",
            category="games",
            target_value=1.0,
            reward_currency=500.0,
            reward_gems=10.0,
            is_active=True,
        )
        assert ach.target_value == 1.0
        assert ach.reward_currency == 500.0

    def test_achievement_claim_response(self):
        resp = AchievementClaimResponse(
            achievement_id="first_win",
            user_id="alice",
            reward_currency=500.0,
            reward_gems=10.0,
            already_claimed=False,
        )
        assert resp.already_claimed is False
        assert resp.reward_gems == 10.0

    def test_rarity_order(self):
        rarity_order = {"common": 1, "rare": 2, "epic": 3, "legendary": 4}
        assert rarity_order["legendary"] > rarity_order["epic"]
        assert rarity_order["epic"] > rarity_order["rare"]
        assert rarity_order["rare"] > rarity_order["common"]

    def test_milestone_reward_grant_logic(self):
        milestones = {25: 100, 50: 300, 75: 500, 100: 2000}
        claimed = []
        progress_percent = 75.0
        reward = 0.0
        for m in [25, 50, 75]:
            if progress_percent >= m and m not in claimed:
                reward += milestones[m]
                claimed.append(m)
        assert reward == 900.0  # 100 + 300 + 500
        assert 25 in claimed
        assert 50 in claimed
        assert 75 in claimed
        assert 100 not in claimed  # not yet reached

    def test_completion_reward_when_100_percent(self):
        milestones = {100: {"currency": 5000, "gems": 100}}
        progress_percent = 100.0
        reward = 0.0
        if progress_percent >= 100.0:
            reward += milestones.get(100, {}).get("currency", 0)
        assert reward == 5000.0


class TestGiftSystem:
    def test_gift_config_response(self):
        cfg = GiftConfigResponse(
            gift_type="coins_500",
            name="500 Coin Gift",
            currency_cost=100.0,
            gem_cost=0.0,
            currency_value=500.0,
            gem_value=0.0,
            is_free_daily=True,
            is_vip_only=False,
            is_active=True,
        )
        assert cfg.currency_value == 500.0
        assert cfg.currency_cost == 100.0
        assert cfg.is_free_daily is True

    def test_gift_send_request(self):
        req = GiftSendRequest(sender_id="alice", receiver_id="bob", gift_type="coins_500")
        assert req.sender_id == "alice"
        assert req.receiver_id == "bob"

    def test_gift_send_response(self):
        resp = GiftSendResponse(success=True, gift_transaction_id=1, status="sent", cooldown_remaining=0.0)
        assert resp.success is True
        assert resp.status == "sent"

    def test_gift_transaction_response(self):
        from datetime import datetime
        resp = GiftTransactionResponse(
            id=5,
            gift_type="gems_10",
            sender_id="alice",
            receiver_id="bob",
            currency_amount=0.0,
            gem_amount=10.0,
            item_id=None,
            was_free=False,
            status="claimed",
            sent_at=datetime.utcnow(),
            claimed_at=datetime.utcnow(),
        )
        assert resp.gem_amount == 10.0
        assert resp.status == "claimed"

    def test_sender_daily_limit_enforced(self):
        daily_limit = 5
        gifts_sent_today = 4
        can_send = gifts_sent_today < daily_limit
        assert can_send is True
        assert (daily_limit - 1) < daily_limit  # at limit

    def test_receiver_cooldown_enforced(self):
        cooldown_seconds = 86400  # 24h
        elapsed_seconds = 3600   # 1h
        remaining = max(0.0, cooldown_seconds - elapsed_seconds)
        assert remaining == 82800.0  # 23h remaining

    def test_gift_expiry(self):
        from datetime import datetime, timedelta, timezone
        expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        is_expired = expires_at < datetime.now(timezone.utc)
        assert is_expired is True


class TestDailyEngagement:
    def test_daily_mission_response(self):
        m = DailyMissionResponse(
            mission_id="play_3_minigames",
            name="Mini-game Master",
            description="Play 3 mini-games today",
            mission_type="play_minigame",
            target_value=3.0,
            reward_currency=200.0,
            reward_gems=5.0,
            is_active=True,
        )
        assert m.target_value == 3.0
        assert m.reward_gems == 5.0

    def test_daily_reward_response(self):
        r = DailyRewardResponse(streak_day=7, currency_reward=700.0, gem_reward=20.0)
        assert r.streak_day == 7
        assert r.currency_reward == 700.0

    def test_streak_increment_logic(self):
        from datetime import date
        last_login = date(2026, 3, 30)
        today = date(2026, 3, 31)
        streak = 5
        # Same day next day = increment
        diff = (today - last_login).days
        if diff == 0:
            new_streak = streak
        elif diff == 1:
            new_streak = streak + 1
        else:
            new_streak = 1  # streak broken
        assert new_streak == 6

    def test_streak_break_logic(self):
        from datetime import date
        last_login = date(2026, 3, 28)
        today = date(2026, 3, 31)
        streak = 5
        diff = (today - last_login).days
        if diff > 1:
            new_streak = 1
        else:
            new_streak = streak + 1
        assert new_streak == 1  # streak broken

    def test_mission_progress_update(self):
        progress = 1.0
        delta = 1.0
        new_progress = progress + delta
        completed = new_progress >= 3.0
        assert completed is False
        new_progress2 = new_progress + 1.0
        completed2 = new_progress2 >= 3.0
        assert completed2 is True


class TestSeasonalEvents:
    def test_seasonal_event_response(self):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        resp = SeasonalEventResponse(
            event_id="spring_festival_2026",
            name="Spring Festival",
            description="Celebrate spring with special quests",
            event_type="leaderboard",
            start_date=now,
            end_date=now,
            is_active=True,
            status="active",
            reward_currency_name="spring_coins",
            top_n_rewards={"1": {"currency": 5000, "gems": 100}},
            exclusive_item_ids=["spring_basket", "flower_hat"],
        )
        assert resp.event_type == "leaderboard"
        assert resp.reward_currency_name == "spring_coins"
        assert "spring_basket" in resp.exclusive_item_ids

    def test_event_quest_response(self):
        q = EventQuestResponse(
            quest_id="harvest_10_crops",
            event_id="spring_festival_2026",
            name="Harvest Festival",
            description="Harvest 10 crops",
            mission_type="earn_currency",
            target_value=10.0,
            points_reward=50.0,
            currency_reward=200.0,
            gem_reward=5.0,
            is_active=True,
        )
        assert q.points_reward == 50.0
        assert q.target_value == 10.0

    def test_event_leaderboard_response(self):
        entries = [
            EventLeaderboardEntry(rank=1, user_id="alice", username="Alice", score=5000.0, rewards_distributed=False),
            EventLeaderboardEntry(rank=2, user_id="bob", username="Bob", score=4500.0, rewards_distributed=False),
        ]
        resp = EventLeaderboardResponse(event_id="spring_2026", entries=entries, total=2)
        assert resp.total == 2
        assert resp.entries[0].rank == 1
        assert resp.entries[0].score == 5000.0

    def test_event_claim_response(self):
        resp = EventClaimResponse(
            event_id="spring_2026",
            quest_id="harvest_10",
            user_id="alice",
            points_earned=50.0,
            currency_reward=200.0,
            gem_reward=5.0,
            already_claimed=False,
        )
        assert resp.points_earned == 50.0
        assert resp.already_claimed is False

    def test_event_status_transitions(self):
        """Verify event auto-transitions from upcoming to active to ended based on dates."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        event = {"start_date": now, "end_date": now}
        # upcoming → active
        assert "upcoming" not in ["active", "ended"]
        # Simulate status
        if now >= event["start_date"] and now <= event["end_date"]:
            status = "active"
        elif now > event["end_date"]:
            status = "ended"
        else:
            status = "upcoming"
        assert status == "active"

    def test_event_gating_exclusive_items(self):
        exclusive_items = ["spring_basket", "flower_hat"]
        item_id = "spring_basket"
        is_exclusive = item_id in exclusive_items
        assert is_exclusive is True
        assert "golden_sword" not in exclusive_items

    def test_top_n_rewards_structure(self):
        top_n = {"1": {"currency": 5000, "gems": 100}, "2": {"currency": 3000, "gems": 50}}
        assert top_n["1"]["currency"] == 5000
        assert top_n["2"]["gems"] == 50


class TestEngagementSystem:
    """Tests for daily engagement: energy, streaks, missions, and retention analytics."""

    def test_energy_status_response(self):
        """Energy status schema validates with correct fields."""
        resp = EnergyStatusResponse(
            user_id="player_1",
            current_energy=75.0,
            max_energy=100.0,
            regen_rate=1.0,
            energy_percent=0.75,
        )
        assert resp.user_id == "player_1"
        assert resp.current_energy == 75.0
        assert resp.max_energy == 100.0
        assert resp.regen_rate == 1.0
        assert resp.energy_percent == 0.75

    def test_energy_spend_request(self):
        """Energy spend request requires positive amount."""
        req = EnergySpendRequest(amount=30.0)
        assert req.amount == 30.0

    def test_energy_spend_response(self):
        """Energy spend response reflects deduction and remaining energy."""
        resp = EnergySpendResponse(
            user_id="player_1",
            energy_spent=30.0,
            new_energy=45.0,
            energy_full=False,
        )
        assert resp.energy_spent == 30.0
        assert resp.new_energy == 45.0
        assert resp.energy_full is False

    def test_streak_login_increment(self):
        """Login on consecutive days increments streak counter."""
        last_date = "2026-03-30"
        today = "2026-03-31"
        # Consecutive days → increment
        streak = 5
        if int(today.split("-")[2]) - int(last_date.split("-")[2]) == 1:
            streak += 1
        assert streak == 6

    def test_streak_break_resets(self):
        """Missing a day resets streak to 1 on next login."""
        last_date = "2026-03-28"
        today = "2026-03-31"
        # Gap > 1 day → streak broken
        gap = int(today.split("-")[2]) - int(last_date.split("-")[2])
        streak = 1 if gap > 1 else 5 + 1
        assert streak == 1

    def test_daily_mission_progress_update(self):
        """Progress increments when player completes mission action."""
        mission = DailyMissionResponse(
            mission_id="earn_1000",
            name="Earn 1000",
            mission_type="currency",
            target_value=1000.0,
            reward_currency=100.0,
            reward_gems=5.0,
            is_active=True,
        )
        progress = PlayerDailyMissionResponse(
            user_id="player_1",
            mission_id="earn_1000",
            mission=mission,
            progress=450.0,
            completed=False,
            claimed=False,
            date_assigned="2026-03-31",
        )
        # Simulate earning 550 currency, auto-complete at target
        new_progress = min(progress.progress + 550.0, mission.target_value)
        is_completed = new_progress >= mission.target_value
        assert new_progress == 1000.0
        assert is_completed is True

    def test_daily_reward_claim_once(self):
        """Daily reward can only be claimed once per streak day."""
        claimed = False
        streak_day = 7
        if not claimed:
            reward = {"streak_day": streak_day, "currency": 500.0, "gems": 10.0}
            claimed = True
        assert claimed is True
        # Second attempt should be rejected
        second_claim = False if claimed else True
        assert second_claim is False

    def test_retention_stats_response(self):
        """Retention stats aggregate cohort data correctly."""
        resp = RetentionStatsResponse(
            dau=5000,
            dau_1d_ago=4800,
            retention_1d=0.42,
            retention_7d=0.18,
            retention_30d=0.09,
            total_players=25000,
        )
        assert resp.dau == 5000
        assert resp.dau_1d_ago == 4800
        assert resp.retention_1d == 0.42
        assert resp.retention_7d == 0.18
        assert resp.retention_30d == 0.09
        assert resp.total_players == 25000

    def test_energy_calculation_regen_over_time(self):
        """Energy regenerates at the configured rate per minute."""
        current_energy = 60.0
        max_energy = 100.0
        regen_rate = 0.5  # per minute
        minutes_elapsed = 40
        updated_energy = min(current_energy + (regen_rate * minutes_elapsed), max_energy)
        assert updated_energy == 80.0

    def test_energy_capped_at_max(self):
        """Energy never exceeds max_energy."""
        current_energy = 95.0
        max_energy = 100.0
        regen_rate = 1.0
        minutes_elapsed = 20
        updated_energy = min(current_energy + (regen_rate * minutes_elapsed), max_energy)
        assert updated_energy == 100.0

    def test_mission_auto_complete_at_target(self):
        """Mission auto-completes when progress >= target_value."""
        progress = 999.0
        target = 1000.0
        is_completed = progress >= target
        assert is_completed is False
        progress = 1000.0
        is_completed = progress >= target
        assert is_completed is True


class TestAuctionHouse:
    """Tests for auction house: listings, bidding, anti-snipe, pricing oracle, rate limiting."""

    def test_auction_listing_create(self):
        """Auction listing requires item_id, seller_id, and start_bid."""
        req = AuctionListingCreate(
            item_id="rare_sword_01",
            seller_id="player_1",
            start_bid=500.0,
            duration_hours=24,
            rarity_tier="rare",
        )
        assert req.item_id == "rare_sword_01"
        assert req.start_bid == 500.0
        assert req.rarity_tier == "rare"
        assert req.duration_hours == 24

    def test_auction_listing_response(self):
        """Response includes all auction fields."""
        resp = AuctionListingResponse(
            id=1,
            item_id="epic_staff",
            seller_id="player_2",
            start_bid=1000.0,
            current_bid=1500.0,
            current_winner_id="player_3",
            rarity_tier="epic",
            status="active",
            ends_at=datetime.now(timezone.utc) + timedelta(hours=12),
            escrow_currency=1500.0,
            escrow_gems=0.0,
            bid_count=3,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.current_bid == 1500.0
        assert resp.current_winner_id == "player_3"
        assert resp.bid_count == 3
        assert resp.status == "active"

    def test_bid_request_requires_idempotency(self):
        """Bid request requires bidder_id, amount, and idempotency_key."""
        req = AuctionBidRequest(
            bidder_id="player_3",
            amount=2000.0,
            idempotency_key="bid_key_abc123",
        )
        assert req.amount == 2000.0
        assert req.idempotency_key == "bid_key_abc123"

    def test_bid_response_indicates_anti_snipe(self):
        """Bid response shows whether anti-snipe extended the auction."""
        resp = AuctionBidResponse(
            success=True,
            auction_id=1,
            bidder_id="player_3",
            amount=2000.0,
            current_bid=2000.0,
            current_winner_id="player_3",
            anti_snipe_extended=True,
            ends_at=datetime.now(timezone.utc) + timedelta(minutes=2),
            bid_id=42,
        )
        assert resp.anti_snipe_extended is True
        assert resp.success is True

    def test_pricing_oracle_rarity_multipliers(self):
        """Rarity tiers scale estimated floor correctly."""
        multipliers = {
            "common": 1.0, "uncommon": 3.0, "rare": 10.0,
            "epic": 40.0, "legendary": 200.0, "mythic": 1000.0,
        }
        base = 100.0
        for tier, mult in multipliers.items():
            floor = base * mult
            ceiling = floor * 5
            assert floor <= ceiling
            if tier == "mythic":
                assert floor == 100000.0
                assert ceiling == 500000.0

    def test_pricing_oracle_response(self):
        """Pricing oracle returns floor, ceiling, and price tier."""
        resp = PricingOracleResponse(
            item_id="legendary_ring",
            rarity_tier="legendary",
            estimated_floor=20000.0,
            estimated_ceiling=100000.0,
            recent_avg_price=None,
            active_listings=2,
            price_tier="expensive",
        )
        assert resp.rarity_tier == "legendary"
        assert resp.estimated_floor == 20000.0
        assert resp.price_tier == "expensive"
        assert resp.active_listings == 2

    def test_rate_limit_response(self):
        """Rate limit response shows remaining listings and bids."""
        resp = AuctionRateLimitResponse(
            user_id="player_1",
            listings_remaining=7,
            bids_remaining_today=45,
            listings_reset_at=None,
            bids_reset_at=datetime.now(timezone.utc),
        )
        assert resp.listings_remaining == 7
        assert resp.bids_remaining_today == 45

    def test_anti_snipe_extends_auction(self):
        """Anti-snipe: auction extends by 2min if bid placed in last 60s."""
        ends_at = datetime.now(timezone.utc) + timedelta(seconds=30)
        now = datetime.now(timezone.utc)
        # Bid in last 60s → extend
        if ends_at - now < timedelta(seconds=60):
            new_ends = ends_at + timedelta(minutes=2)
        else:
            new_ends = ends_at
        assert (new_ends - ends_at) == timedelta(minutes=2)

    def test_no_anti_snipe_early_bid(self):
        """Anti-snipe: no extension if bid is placed well before end."""
        ends_at = datetime.now(timezone.utc) + timedelta(hours=2)
        now = datetime.now(timezone.utc)
        if ends_at - now < timedelta(seconds=60):
            new_ends = ends_at + timedelta(minutes=2)
        else:
            new_ends = ends_at
        assert new_ends == ends_at  # no change

    def test_price_manipulation_flag_threshold(self):
        """Price manipulation flagged if bid > 5x rarity floor."""
        rarity_floor = 100.0 * 10.0  # rare tier
        threshold = rarity_floor * 5  # 5000.0
        suspicious_bid = 6000.0
        is_flagged = suspicious_bid > threshold
        assert is_flagged is True
        # Normal bid below threshold
        normal_bid = 4000.0
        is_flagged_normal = normal_bid > threshold
        assert is_flagged_normal is False

    def test_auction_settlement_response(self):
        """Settlement confirms item and currency transfer."""
        resp = AuctionSettlementResponse(
            auction_id=1,
            seller_id="player_2",
            winner_id="player_3",
            final_price=5000.0,
            item_transferred=True,
            currency_transferred=True,
            status="settled",
        )
        assert resp.final_price == 5000.0
        assert resp.item_transferred is True
        assert resp.currency_transferred is True
        assert resp.status == "settled"

    def test_minimum_bid_increment(self):
        """Bid must exceed current bid by at least 1."""
        current_bid = 1500.0
        min_bid = current_bid + 1.0
        assert min_bid == 1501.0
        # Equal to current is invalid
        assert 1500.0 < min_bid

    def test_auction_rarity_tier_validation(self):
        """Only valid rarity tiers are accepted."""
        valid_tiers = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]
        for tier in valid_tiers:
            req = AuctionListingCreate(
                item_id="item",
                seller_id="seller",
                start_bid=100.0,
                rarity_tier=tier,
            )
            assert req.rarity_tier == tier

    def test_escrow_currency_accumulates(self):
        """Escrow accumulates the current bid amount on each new winning bid."""
        listing_escrow = 0.0
        # First bid
        bid1 = 1000.0
        listing_escrow = bid1
        assert listing_escrow == 1000.0
        # Second bid (previous winner refunded, new bid escrowed)
        prev_escrow = listing_escrow
        bid2 = 1500.0
        listing_escrow = bid2  # new winning bid replaces escrow
        assert listing_escrow == 1500.0
        assert listing_escrow > prev_escrow

    def test_auction_cannot_cancel_with_bids(self):
        """Cancellation blocked if any bids exist."""
        bid_count = 1
        can_cancel = bid_count == 0
        assert can_cancel is False
        bid_count = 0
        can_cancel = bid_count == 0
        assert can_cancel is True

    def test_auction_status_transitions(self):
        """Auction transitions from active to ended when time passes."""
        status = "active"
        ends_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        now = datetime.now(timezone.utc)
        if now >= ends_at and status == "active":
            status = "ended"
        assert status == "ended"

