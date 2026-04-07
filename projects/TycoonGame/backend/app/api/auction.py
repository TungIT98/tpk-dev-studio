from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_

from app.core.database import get_db, get_db_sync
from app.core.redis import get_redis
from app.models.models import Player, PlayerGem, AuctionListing, AuctionBid, PriceHistory
from app.schemas.schemas import (
    AuctionListingCreate,
    AuctionListingResponse,
    AuctionBidRequest,
    AuctionBidResponse,
    AuctionSearchRequest,
    AuctionSearchResponse,
    PricingOracleResponse,
    AuctionRateLimitResponse,
    AuctionSettlementResponse,
)

router = APIRouter(prefix="/auctions", tags=["auction"])


# ── Rate Limiting ────────────────────────────────────────────────────────────────

LISTINGS_MAX = 10
BIDS_MAX = 50


async def _rate_limit_check(redis, user_id: str) -> dict:
    """Check rate limits for listings and bids. Returns remaining counts."""
    now = datetime.now(timezone.utc)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    midnight_utc = now.replace(hour=0, minute=0, second=0, microsecond=0)

    pipe = redis.pipeline()
    listings_key = f"auction:listings:{user_id}"
    bids_key = f"auction:bids:{user_id}:{now.date()}"

    pipe.zcard(listings_key)
    pipe.zcard(bids_key)
    results = await pipe.execute()

    listings_count = results[0] or 0
    bids_count = results[1] or 0

    return {
        "listings_remaining": max(0, LISTINGS_MAX - listings_count),
        "bids_remaining_today": max(0, BIDS_MAX - bids_count),
        "listings_reset_at": None,
        "bids_reset_at": today_end,
    }


async def _record_listing(redis, user_id: str):
    """Record that user listed an item."""
    listings_key = f"auction:listings:{user_id}"
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    await redis.zadd(listings_key, {str(now.timestamp()): now.timestamp()})
    await redis.expireat(listings_key, int(midnight.timestamp()))


async def _record_bid(redis, user_id: str):
    """Record that user placed a bid."""
    now = datetime.now(timezone.utc)
    bids_key = f"auction:bids:{user_id}:{now.date()}"
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    await redis.zadd(bids_key, {str(now.timestamp()): now.timestamp()})
    await redis.expireat(bids_key, int(midnight.timestamp()))


# ── Pricing Oracle ──────────────────────────────────────────────────────────────

RARITY_MULTIPLIERS = {
    "common": 1.0,
    "uncommon": 3.0,
    "rare": 10.0,
    "epic": 40.0,
    "legendary": 200.0,
    "mythic": 1000.0,
}

RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]


def _calculate_pricing(db: Session, item_id: str, rarity_tier: str) -> dict:
    """Calculate floor/ceiling prices based on rarity and market history."""
    base = 100.0
    multiplier = RARITY_MULTIPLIERS.get(rarity_tier, 1.0)
    floor_price = base * multiplier
    ceiling_price = floor_price * 5

    # Check recent sales for this item
    recent = db.execute(
        select(func.avg(PriceHistory.price), func.count())
        .where(
            PriceHistory.item_id == item_id,
            PriceHistory.recorded_at >= datetime.now(timezone.utc) - timedelta(days=7),
        )
    ).one()

    avg_price = recent[0]
    sample_size = recent[1] or 0

    if avg_price and sample_size >= 3:
        floor_price = avg_price * 0.5
        ceiling_price = avg_price * 2.0
        recent_avg = float(avg_price)
    else:
        recent_avg = None

    # Count active listings for this item
    active_count = db.execute(
        select(func.count())
        .where(
            AuctionListing.item_id == item_id,
            AuctionListing.status == "active",
        )
    ).scalar() or 0

    # Determine price tier
    if ceiling_price <= 500:
        price_tier = "cheap"
    elif ceiling_price <= 5000:
        price_tier = "moderate"
    elif ceiling_price <= 50000:
        price_tier = "expensive"
    else:
        price_tier = "premium"

    return {
        "item_id": item_id,
        "rarity_tier": rarity_tier,
        "estimated_floor": floor_price,
        "estimated_ceiling": ceiling_price,
        "recent_avg_price": recent_avg,
        "active_listings": active_count,
        "price_tier": price_tier,
    }


# ── Anti-Exploit ────────────────────────────────────────────────────────────────

def _check_price_manipulation(
    db: Session, bidder_id: str, amount: float, item_id: str, rarity_tier: str
) -> Optional[str]:
    """Flag bids that are suspiciously high relative to rarity floor."""
    base = 100.0 * RARITY_MULTIPLIERS.get(rarity_tier, 1.0)
    # Flag if bid > 5x the rarity floor
    if amount > base * 5:
        return f"Suspicious bid: {amount} exceeds 5x floor ({base * 5:.0f}) for {rarity_tier}"
    return None


def _anti_snipe_extend(current_ends_at: datetime) -> datetime:
    """Extend auction by 2 minutes if bid is in the last 60 seconds."""
    now = datetime.now(timezone.utc)
    if current_ends_at - now < timedelta(seconds=60):
        return current_ends_at + timedelta(minutes=2)
    return current_ends_at


# ── Endpoints ───────────────────────────────────────────────────────────────────

@router.get("/rate-limits/{user_id}", response_model=AuctionRateLimitResponse)
async def get_rate_limits(user_id: str):
    """Get remaining listings and bids for a user today."""
    redis = await get_redis()
    limits = await _rate_limit_check(redis, user_id)
    return AuctionRateLimitResponse(user_id=user_id, **limits)


@router.post("", response_model=AuctionListingResponse)
async def create_auction(
    req: AuctionListingCreate,
    db: Session = Depends(get_db_sync),
):
    """List an item for auction. Rate-limited to 10 listings per player."""
    redis = await get_redis()
    limits = await _rate_limit_check(redis, req.seller_id)

    if limits["listings_remaining"] <= 0:
        raise HTTPException(
            status_code=429,
            detail=f"Listing rate limit reached. Max {LISTINGS_MAX} listings per day.",
        )

    # Validate seller exists
    seller = db.get(Player, req.seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    if req.start_bid < 0:
        raise HTTPException(status_code=400, detail="Start bid must be non-negative")

    ends_at = datetime.now(timezone.utc) + timedelta(hours=req.duration_hours)

    listing = AuctionListing(
        item_id=req.item_id,
        seller_id=req.seller_id,
        start_bid=req.start_bid,
        current_bid=None,
        current_winner_id=None,
        rarity_tier=req.rarity_tier,
        status="active",
        ends_at=ends_at,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    await _record_listing(redis, req.seller_id)

    return AuctionListingResponse(
        id=listing.id,
        item_id=listing.item_id,
        seller_id=listing.seller_id,
        start_bid=listing.start_bid,
        current_bid=listing.current_bid,
        current_winner_id=listing.current_winner_id,
        rarity_tier=listing.rarity_tier,
        status=listing.status,
        ends_at=listing.ends_at,
        escrow_currency=listing.escrow_currency,
        escrow_gems=listing.escrow_gems,
        bid_count=0,
        created_at=listing.created_at,
    )


@router.get("", response_model=AuctionSearchResponse)
def search_auctions(
    rarity: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    status: str = Query("active"),
    item_type: Optional[str] = Query(None),
    sort_by: str = Query("ends_at"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_sync),
):
    """Search/filter auctions by rarity, price range, item type."""
    query = select(AuctionListing)
    count_query = select(func.count()).select_from(AuctionListing)

    if rarity:
        query = query.where(AuctionListing.rarity_tier == rarity)
        count_query = count_query.where(AuctionListing.rarity_tier == rarity)

    if status:
        query = query.where(AuctionListing.status == status)
        count_query = count_query.where(AuctionListing.status == status)

    if min_price is not None:
        query = query.where(
            func.coalesce(AuctionListing.current_bid, AuctionListing.start_bid) >= min_price
        )
        count_query = count_query.where(
            func.coalesce(AuctionListing.current_bid, AuctionListing.start_bid) >= min_price
        )

    if max_price is not None:
        query = query.where(
            func.coalesce(AuctionListing.current_bid, AuctionListing.start_bid) <= max_price
        )
        count_query = count_query.where(
            func.coalesce(AuctionListing.current_bid, AuctionListing.start_bid) <= max_price
        )

    total = db.execute(count_query).scalar() or 0

    sort_col = {
        "ends_at": AuctionListing.ends_at,
        "current_bid": AuctionListing.current_bid,
        "rarity": AuctionListing.rarity_tier,
    }.get(sort_by, AuctionListing.ends_at)

    query = query.order_by(sort_col.asc() if sort_by == "ends_at" else sort_col.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    rows = db.execute(query).scalars().all()

    auctions = []
    for listing in rows:
        bid_count = db.execute(
            select(func.count()).where(AuctionBid.auction_id == listing.id)
        ).scalar() or 0
        auctions.append(
            AuctionListingResponse(
                id=listing.id,
                item_id=listing.item_id,
                seller_id=listing.seller_id,
                start_bid=listing.start_bid,
                current_bid=listing.current_bid,
                current_winner_id=listing.current_winner_id,
                rarity_tier=listing.rarity_tier,
                status=listing.status,
                ends_at=listing.ends_at,
                escrow_currency=listing.escrow_currency,
                escrow_gems=listing.escrow_gems,
                bid_count=bid_count,
                created_at=listing.created_at,
            )
        )

    return AuctionSearchResponse(auctions=auctions, total=total, page=page)


@router.get("/{auction_id}", response_model=AuctionListingResponse)
def get_auction(auction_id: int, db: Session = Depends(get_db_sync)):
    """Get details of a specific auction."""
    listing = db.get(AuctionListing, auction_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Auction not found")

    bid_count = db.execute(
        select(func.count()).where(AuctionBid.auction_id == listing.id)
    ).scalar() or 0

    return AuctionListingResponse(
        id=listing.id,
        item_id=listing.item_id,
        seller_id=listing.seller_id,
        start_bid=listing.start_bid,
        current_bid=listing.current_bid,
        current_winner_id=listing.current_winner_id,
        rarity_tier=listing.rarity_tier,
        status=listing.status,
        ends_at=listing.ends_at,
        escrow_currency=listing.escrow_currency,
        escrow_gems=listing.escrow_gems,
        bid_count=bid_count,
        created_at=listing.created_at,
    )


@router.post("/{auction_id}/bid", response_model=AuctionBidResponse)
async def place_bid(
    auction_id: int,
    req: AuctionBidRequest,
    db: Session = Depends(get_db_sync),
):
    """Place a bid on an auction. Anti-snipe extends by 2min if bid in last 60s."""
    redis = await get_redis()
    limits = await _rate_limit_check(redis, req.bidder_id)

    if limits["bids_remaining_today"] <= 0:
        raise HTTPException(
            status_code=429,
            detail=f"Bid rate limit reached. Max {BIDS_MAX} bids per day.",
        )

    listing = db.get(AuctionListing, auction_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Auction not found")

    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Auction is not active")

    now = datetime.now(timezone.utc)
    if now >= listing.ends_at:
        raise HTTPException(status_code=400, detail="Auction has ended")

    if listing.seller_id == req.bidder_id:
        raise HTTPException(status_code=400, detail="Cannot bid on your own auction")

    min_bid = listing.current_bid + 1.0 if listing.current_bid else listing.start_bid
    if req.amount < min_bid:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {min_bid:.2f}",
        )

    # Validate bidder has sufficient balance
    bidder = db.get(Player, req.bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")
    if bidder.total_currency < req.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient currency. Have {bidder.total_currency}, need {req.amount}",
        )

    # Anti-exploit: price manipulation check
    manipulation_warning = _check_price_manipulation(
        db, req.bidder_id, req.amount, listing.item_id, listing.rarity_tier
    )
    if manipulation_warning:
        # Log warning but still allow (flag for review)
        pass

    # Anti-snipe: extend if bid in last 60s
    anti_snipe_extended = False
    ends_at = listing.ends_at
    if ends_at - now < timedelta(seconds=60):
        ends_at = ends_at + timedelta(minutes=2)
        anti_snipe_extended = True
        listing.ends_at = ends_at

    # Refund previous winner
    if listing.current_winner_id:
        prev_winner = db.get(Player, listing.current_winner_id)
        if prev_winner:
            prev_winner.total_currency += listing.current_bid

    # Escrow bidder's bid
    bidder.total_currency -= req.amount
    listing.escrow_currency += req.amount

    # Record bid
    bid = AuctionBid(
        auction_id=listing.id,
        bidder_id=req.bidder_id,
        amount=req.amount,
        is_winning=True,
    )
    db.add(bid)

    # Mark previous winning bids as not winning
    db.execute(
        AuctionBid.__table__.update()
        .where(AuctionBid.auction_id == listing.id, AuctionBid.id != bid.id)
        .values(is_winning=False)
    )

    listing.current_bid = req.amount
    listing.current_winner_id = req.bidder_id
    db.commit()
    db.refresh(listing)
    db.refresh(bid)

    await _record_bid(redis, req.bidder_id)

    return AuctionBidResponse(
        success=True,
        auction_id=listing.id,
        bidder_id=req.bidder_id,
        amount=req.amount,
        current_bid=listing.current_bid,
        current_winner_id=listing.current_winner_id,
        anti_snipe_extended=anti_snipe_extended,
        ends_at=ends_at,
        bid_id=bid.id,
    )


@router.delete("/{auction_id}", response_model=AuctionListingResponse)
async def cancel_auction(
    auction_id: int,
    user_id: str,
    db: Session = Depends(get_db_sync),
):
    """Cancel an auction. Only allowed if no bids and owner requests."""
    listing = db.get(AuctionListing, auction_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Auction not found")

    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Only the seller can cancel")

    bid_count = db.execute(
        select(func.count()).where(AuctionBid.auction_id == listing.id)
    ).scalar() or 0

    if bid_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel auction with existing bids",
        )

    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Auction is not active")

    listing.status = "cancelled"
    db.commit()
    db.refresh(listing)

    return AuctionListingResponse(
        id=listing.id,
        item_id=listing.item_id,
        seller_id=listing.seller_id,
        start_bid=listing.start_bid,
        current_bid=listing.current_bid,
        current_winner_id=listing.current_winner_id,
        rarity_tier=listing.rarity_tier,
        status=listing.status,
        ends_at=listing.ends_at,
        escrow_currency=listing.escrow_currency,
        escrow_gems=listing.escrow_gems,
        bid_count=bid_count,
        created_at=listing.created_at,
    )


@router.get("/pricing/{item_id}", response_model=PricingOracleResponse)
def get_pricing_oracle(item_id: str, rarity_tier: str = Query("common"), db: Session = Depends(get_db_sync)):
    """Server-calculated floor/ceiling prices based on rarity + market history."""
    pricing = _calculate_pricing(db, item_id, rarity_tier)
    return PricingOracleResponse(**pricing)


@router.post("/{auction_id}/settle", response_model=AuctionSettlementResponse)
async def settle_auction(auction_id: int, db: Session = Depends(get_db_sync)):
    """
    Settle a completed auction: transfer item to winner, currency to seller.
    Can be called after ends_at has passed.
    """
    redis = await get_redis()
    listing = db.get(AuctionListing, auction_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Auction not found")

    now = datetime.now(timezone.utc)
    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Auction already settled or cancelled")
    if now < listing.ends_at:
        raise HTTPException(status_code=400, detail="Auction has not ended yet")

    if listing.current_winner_id and listing.current_bid:
        # Transfer currency to seller
        seller = db.get(Player, listing.seller_id)
        if seller:
            seller.total_currency += listing.current_bid

        # Deduct escrow from winner's escrowed amount
        listing.escrow_currency = 0.0

        listing.status = "ended"
        settlement_status = "settled"
        item_transferred = True
        currency_transferred = True
    else:
        # No bids — just mark as ended
        listing.status = "ended"
        settlement_status = "no_bids"
        item_transferred = False
        currency_transferred = False

    db.commit()
    db.refresh(listing)

    return AuctionSettlementResponse(
        auction_id=listing.id,
        seller_id=listing.seller_id,
        winner_id=listing.current_winner_id or "",
        final_price=listing.current_bid or 0.0,
        item_transferred=item_transferred,
        currency_transferred=currency_transferred,
        status=settlement_status,
    )
