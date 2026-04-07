# Colyseus schema exports
# These TypeScript schema definitions are used by the Colyseus game server
# to sync state with Roblox clients in real-time.

# MiniGameSession schema — synced to Roblox client during active gameplay
MINIGAME_SESSION_SCHEMA = """
// MiniGameSession.ts — Colyseus Schema for active mini-game state
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class MiniGameSessionState extends Schema {
  @type("string") sessionId: string = "";
  @type("string") gameId: string = "";
  @type("string") status: string = "waiting"; // waiting | active | completed
  @type("number") durationSeconds: number = 60;
  @type("number") elapsedMs: number = 0;         // server-side timer
  @type("number") maxPlayers: number = 1;
  @type({ map: "number" }) playerScores = new MapSchema<number>();
  @type("string") winnerId: string = "";
}

export class MiniGamePlayerState extends Schema {
  @type("string") odUserId: string = "";
  @type("string") username: string = "";
  @type("number") score: number = 0;
  @type("number") rank: number = 0;
  @type("boolean") isConnected: boolean = false;
}

// Room: MiniGameRoom
// State: MiniGameSessionState
// Lifecycle hooks:
//   onCreate(options) — load MiniGameConfig from DB, init state
//   onJoin(client, options) — add client to playerScores map
//   onMessage("submit_score", client, message) — validate & record score
//   onMessage("start_game", client) — begin countdown, set status=active
//   onLeave(client, consented) — mark player disconnected
"""

# MiniGameLeaderboardState for live leaderboard broadcast
MINIGAME_LEADERBOARD_SCHEMA = """
// MiniGameLeaderboardState.ts
import { Schema, type, ArraySchema } from "@colyseus/schema";

export class LeaderboardEntry extends Schema {
  @type("string") odUserId: string = "";
  @type("string") username: string = "";
  @type("number") highScore: number = 0;
  @type("number") bestRank: number = 0;
  @type("number") gamesPlayed: number = 0;
}

export class MiniGameLeaderboardState extends Schema {
  @type("string") gameId: string = "";
  @type([LeaderboardEntry]) entries = new ArraySchema<LeaderboardEntry>();
  @type("number") totalPlayers: number = 0;
}
"""

# AuctionHouse room schema
AUCTION_ROOM_SCHEMA = """
// AuctionRoom.ts — Colyseus Schema for live auction state
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";

export class AuctionBid extends Schema {
  @type("string") bidderId: string = "";
  @type("string") username: string = "";
  @type("number") amount: number = 0;
  @type("number") timestamp: number = 0;  // unix ms
  @type("boolean") isWinning: boolean = false;
}

export class AuctionState extends Schema {
  @type("number") auctionId: number = 0;
  @type("string") itemId: string = "";
  @type("string") sellerId: string = "";
  @type("number") startBid: number = 0;
  @type("number") currentBid: number = 0;
  @type("string") currentWinnerId: string = "";
  @type("string") rarityTier: string = "common";
  @type("string") status: string = "active";  // active | ended | cancelled
  @type("number") endsAt: number = 0;         // unix timestamp ms
  @type([AuctionBid]) bids = new ArraySchema<AuctionBid>();
  @type("number") bidCount: number = 0;
}

// room: AuctionRoom
// State: AuctionState
// Lifecycle hooks:
//   onCreate(options) — load auction from DB by id, init AuctionState
//   onJoin(client, options) — track client session
//   onMessage("place_bid", client, message) — call POST /auctions/{id}/bid, broadcast updated state
//   onMessage("cancel", client, message) — owner cancel, broadcast cancelled
//   onLeave(client, consented) — remove from watchers
// Real-time: all bid events broadcast to all room clients immediately
"""
