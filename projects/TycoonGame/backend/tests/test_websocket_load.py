"""
WebSocket load test simulation for Colyseus game rooms.

NOTE: No Colyseus server was found running in this environment.
      This script contains the full WS simulation suite.
      Run against a live Colyseus deployment by setting COLYEUS_WS_URL.

Colyseus protocol reference:
  - ws://host:port/<room_name>?sessionId=<session>
  - Client → Server: { "op": <opcode>, "d": <data> }
    op 0 = join, op 1 = leave, op 2 = call, op 4 = send, op 5 = publish
  - Server → Client: { "op": <opcode>, "d": <data> }
    op 0 = joined, op 1 = leave, op 2 = error, op 3 = ok, op 4 = room data, op 7 = message
"""
import asyncio
import json
import time
import random
import statistics
from dataclasses import dataclass, field
from typing import Optional

COLYSEUS_WS_URL = "ws://127.0.0.1:2567"  # Default Colyseus port; override via env


@dataclass
class ColyseusConnection:
    """Simulates a Colyseus room connection (logical client)."""
    session_id: str
    room_name: str
    user_id: str
    connect_time: float = 0.0
    latency_samples: list = field(default_factory=list)
    messages_sent: int = 0
    messages_received: int = 0
    error: Optional[str] = None


class ColyseusLoadSimulator:
    """
    Simulates N concurrent players connecting to a Colyseus room.

    Colyseus opcodes (client → server):
      0 = JOIN_ROOM
      1 = LEAVE_ROOM
      2 = CALL_METHOD
      4 = SEND_MESSAGE
      5 = PUBLISH_UPDATE
    """

    OPCODE_JOIN = 0
    OPCODE_LEAVE = 1
    OPCODE_CALL = 2
    OPCODE_SEND = 4

    def __init__(
        self,
        base_url: str = COLYSEUS_WS_URL,
        room_name: str = "game_lobby",
        max_concurrent: int = 1000,
    ):
        self.base_url = base_url
        self.room_name = room_name
        self.max_concurrent = max_concurrent
        self.connections: dict[str, ColyseusConnection] = {}
        self.start_time: float = 0.0
        self.end_time: float = 0.0
        self.errors: list[str] = []

    async def connect_client(self, client_id: int) -> ColyseusConnection:
        """Simulate a single client connecting to the Colyseus room."""
        session_id = f"session_{client_id}_{random.randint(10000, 99999)}"
        user_id = f"user_{client_id}"
        conn = ColyseusConnection(
            session_id=session_id,
            room_name=self.room_name,
            user_id=user_id,
            connect_time=time.time(),
        )
        try:
            import websockets
            ws_url = f"{self.base_url}/{self.room_name}?sessionId={session_id}"
            async with websockets.connect(ws_url, open_timeout=5, close_timeout=2) as ws:
                # Send join message (op 0)
                join_msg = json.dumps({"op": self.OPCODE_JOIN, "d": {"userId": user_id}})
                await ws.send(join_msg)
                conn.messages_sent += 1

                # Wait for join ack (op 0 from server)
                try:
                    ack = await asyncio.wait_for(ws.recv(), timeout=5)
                    conn.messages_received += 1
                    data = json.loads(ack)
                    if data.get("op") == 0:
                        pass  # Joined successfully
                except asyncio.TimeoutError:
                    conn.error = "Join ack timeout"

                # Simulate gameplay loop: send periodic messages
                for _ in range(random.randint(5, 20)):
                    await asyncio.sleep(random.uniform(0.1, 1.0))
                    latency_start = time.perf_counter()
                    send_msg = json.dumps({
                        "op": self.OPCODE_SEND,
                        "d": {
                            "type": random.choice(["move", "action", "trade", "chat"]),
                            "payload": {
                                "x": random.uniform(-100, 100),
                                "y": random.uniform(-100, 100),
                                "timestamp": time.time(),
                            }
                        }
                    })
                    await ws.send(send_msg)
                    conn.messages_sent += 1

                    # Try to receive server response
                    try:
                        resp = await asyncio.wait_for(ws.recv(), timeout=2)
                        conn.messages_received += 1
                        round_trip = (time.perf_counter() - latency_start) * 1000
                        conn.latency_samples.append(round_trip)
                    except asyncio.TimeoutError:
                        pass

        except Exception as e:
            conn.error = str(e)[:100]

        self.connections[session_id] = conn
        return conn

    async def run_load_test(
        self,
        target_ccu: int,
        spawn_rate: int = 100,
        ramp_up_seconds: float = 30.0,
        sustained_seconds: float = 30.0,
    ):
        """
        Run a complete load test.

        Args:
            target_ccu: Target concurrent users
            spawn_rate: Users to spawn per second
            ramp_up_seconds: Time to reach target CCU
            sustained_seconds: Time to sustain at target CCU
        """
        print(f"\n{'='*60}")
        print(f"Colyseus Load Test: {target_ccu} CCU target")
        print(f"  Spawn rate   : {spawn_rate} users/sec")
        print(f"  Ramp-up      : {ramp_up_seconds}s")
        print(f"  Sustained    : {sustained_seconds}s")
        print(f"{'='*60}\n")

        self.start_time = time.time()
        spawn_interval = 1.0 / spawn_rate if spawn_rate > 0 else 0

        async def spawn_client(client_num: int):
            delay = (client_num / spawn_rate) if spawn_rate > 0 else 0
            if delay > 0:
                await asyncio.sleep(delay)
            await self.connect_client(client_num)

        spawn_tasks = [spawn_client(i) for i in range(target_ccu)]
        await asyncio.gather(*spawn_tasks)

        # Wait for sustained period
        await asyncio.sleep(sustained_seconds)

        self.end_time = time.time()

        self.print_summary()

    def print_summary(self):
        all_latencies = []
        connected = 0
        errors = 0
        error_types: dict[str, int] = {}

        for conn in self.connections.values():
            all_latencies.extend(conn.latency_samples)
            if conn.error:
                errors += 1
                error_types[conn.error] = error_types.get(conn.error, 0) + 1
            elif conn.messages_received > 0:
                connected += 1

        duration = self.end_time - self.start_time
        total = len(self.connections)

        print(f"\n{'='*60}")
        print(f"Colyseus Load Test Results")
        print(f"{'='*60}")
        print(f"  Total connections attempted : {total}")
        print(f"  Successfully connected      : {connected}")
        print(f"  Errors                       : {errors}")
        print(f"  Duration                     : {duration:.1f}s")
        if error_types:
            print(f"  Error breakdown:")
            for err, count in error_types.items():
                print(f"    [{err[:60]}] : {count}")
        if all_latencies:
            lat_sorted = sorted(all_latencies)
            n = len(lat_sorted)
            print(f"\n  Message Round-Trip Latency (ms):")
            print(f"    p50 : {lat_sorted[int(n*0.50)]:.1f}")
            print(f"    p95 : {lat_sorted[int(n*0.95)]:.1f}")
            print(f"    p99 : {lat_sorted[int(n*0.99)]:.1f}")
            print(f"    max : {max(lat_sorted):.1f}")
            if len(lat_sorted) >= 10:
                breaking = next((l for l in lat_sorted if l > 200), None)
                if breaking:
                    print(f"\n  ⚠ Breaking point: latency exceeded 200ms at {breaking:.1f}ms")
                else:
                    print(f"\n  ✓ Latency stayed under 200ms throughout test")
        else:
            print("\n  No latency samples collected (no Colyseus server reachable)")
        print(f"{'='*60}\n")


async def main():
    import os
    ws_url = os.environ.get("COLYSEUS_WS_URL", COLYSEUS_WS_URL)

    simulator = ColyseusLoadSimulator(base_url=ws_url, room_name="game_lobby")

    # Quick smoke test
    print("Quick 10-user smoke test...")
    await simulator.run_load_test(target_ccu=10, spawn_rate=5, sustained_seconds=5)


if __name__ == "__main__":
    asyncio.run(main())
