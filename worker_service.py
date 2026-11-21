import asyncio
import json
import os
import time
from datetime import datetime, timezone

import aiohttp
from aiohttp import web
from BinaryOptionsToolsV2.pocketoption import PocketOptionAsync

TIMEFRAME_SECONDS = 60
ASSETS = [x.strip() for x in os.getenv("PO_ASSETS", "EURUSD_otc,GBPUSD_otc").split(",") if x.strip()]
INGEST_URL = os.getenv("HATCHABLE_INGEST_URL", "").strip()
WORKER_SECRET = os.getenv("TRADER_WORKER_SECRET", "")
SSID = os.getenv("POCKETOPTION_SSID", "")
STATE = {
    "connected": False,
    "last_success": None,
    "last_error": None,
    "assets": ASSETS,
    "mode": "DEMO_ONLY",
}

def validate_demo_ssid(value: str) -> None:
    if not value.startswith('42["auth",'):
        raise RuntimeError("POCKETOPTION_SSID must be the complete Socket.IO auth frame.")
    try:
        payload = json.loads(value[2:])
        auth = payload[1]
    except Exception as exc:
        raise RuntimeError("Invalid Pocket Option auth frame.") from exc
    if payload[0] != "auth" or int(auth.get("isDemo", 0)) != 1:
        raise RuntimeError("This worker is DEMO-ONLY. Refusing a non-demo session.")

async def health(_request):
    return web.json_response({
        "ok": True,
        "connected": STATE["connected"],
        "last_success": STATE["last_success"],
        "last_error": STATE["last_error"],
        "assets": STATE["assets"],
        "mode": STATE["mode"],
    })

async def stream_asset(client, session, symbol):
    last_post = 0.0
    while True:
        try:
            async for closed, forming in client.get_candles_live(
                symbol, period=TIMEFRAME_SECONDS, hours=2.0, max_rows=120
            ):
                # Analyze only fully closed candles; ignore the forming candle.
                rows = list(closed or [])[-120:]
                if len(rows) < 30:
                    continue
                now = time.monotonic()
                if now - last_post < 15:
                    continue
                normalized = []
                for candle in rows:
                    stamp = candle.get("time", candle.get("timestamp", ""))
                    normalized.append({
                        "timestamp": str(stamp),
                        "open": float(candle["open"]),
                        "high": float(candle["high"]),
                        "low": float(candle["low"]),
                        "close": float(candle["close"]),
                        "volume": float(candle.get("volume", 0) or 0),
                    })
                async with session.post(
                    INGEST_URL,
                    json={"symbol": symbol, "timeframe": "1m", "candles": normalized},
                    headers={"Authorization": f"Bearer {WORKER_SECRET}"},
                ) as response:
                    if response.status != 200:
                        raise RuntimeError(f"Hatchable ingest returned HTTP {response.status}")
                    await response.json()
                last_post = now
                STATE["last_success"] = datetime.now(timezone.utc).isoformat()
                STATE["last_error"] = None
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            STATE["connected"] = bool(client.is_connected())
            STATE["last_error"] = f"{symbol}: {str(exc)[:180]}"
            await asyncio.sleep(10)
            if not client.is_connected():
                await client.reconnect()

async def market_loop():
    try:
        if not SSID or not INGEST_URL or not WORKER_SECRET:
            raise RuntimeError("Missing POCKETOPTION_SSID, HATCHABLE_INGEST_URL or TRADER_WORKER_SECRET.")
        validate_demo_ssid(SSID)
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with PocketOptionAsync(SSID) as client:
                if not client.is_demo():
                    raise RuntimeError("Broker session is not demo. Worker refuses to start.")
                STATE["connected"] = bool(client.is_connected())
                await asyncio.gather(*(stream_asset(client, session, symbol) for symbol in ASSETS))
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        STATE["connected"] = False
        STATE["last_error"] = str(exc)[:240]

async def on_startup(app):
    app["market_task"] = asyncio.create_task(market_loop())

async def on_cleanup(app):
    task = app.get("market_task")
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

def main():
    app = web.Application()
    app.router.add_get("/health", health)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    web.run_app(app, host="0.0.0.0", port=int(os.getenv("PORT", "10000")))

if __name__ == "__main__":
    main()
