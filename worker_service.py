import asyncio
import json
import os
import time
from datetime import datetime, timezone

import aiohttp
from aiohttp import web
from pocketoptionapi_async.client import AsyncPocketOptionClient

POLL_SECONDS = int(os.getenv("POLL_SECONDS", "30"))
TIMEFRAME = os.getenv("PO_TIMEFRAME", "1m")
ASSETS = [x.strip() for x in os.getenv("PO_ASSETS", "EURUSD_otc,GBPUSD_otc").split(",") if x.strip()]
INGEST_URL = os.getenv("HATCHABLE_INGEST_URL", "").strip()
WORKER_SECRET = os.getenv("TRADER_WORKER_SECRET", "")
SSID = os.getenv("POCKETOPTION_SSID", "")
STATE = {"connected": False, "last_success": None, "last_error": None, "assets": ASSETS, "mode": "DEMO_ONLY"}

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

async def market_loop():
    if not SSID or not INGEST_URL or not WORKER_SECRET:
        STATE["last_error"] = "Missing POCKETOPTION_SSID, HATCHABLE_INGEST_URL or TRADER_WORKER_SECRET."
        return
    validate_demo_ssid(SSID)
    client = AsyncPocketOptionClient(
        ssid=SSID,
        is_demo=True,
        region="DEMO",
        persistent_connection=False,
        auto_reconnect=True,
        enable_logging=False,
    )
    timeout = aiohttp.ClientTimeout(total=15)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        while True:
            try:
                if not client.is_connected:
                    ok = await client.connect(regions=["DEMO"], persistent=False)
                    if not ok:
                        raise RuntimeError("Pocket Option demo connection/authentication failed.")
                STATE["connected"] = bool(client.is_connected)
                for symbol in ASSETS:
                    candles = await client.get_candles(asset=symbol, timeframe=TIMEFRAME, count=120)
                    rows = []
                    for candle in candles:
                        ts = getattr(candle, "timestamp", None)
                        rows.append({
                            "timestamp": ts.isoformat() if hasattr(ts, "isoformat") else str(ts or ""),
                            "open": float(candle.open),
                            "high": float(candle.high),
                            "low": float(candle.low),
                            "close": float(candle.close),
                            "volume": float(getattr(candle, "volume", 0) or 0),
                        })
                    if len(rows) < 30:
                        raise RuntimeError(f"Insufficient candles for {symbol}: {len(rows)}")
                    async with session.post(
                        INGEST_URL,
                        json={"symbol": symbol, "timeframe": TIMEFRAME, "candles": rows},
                        headers={"Authorization": f"Bearer {WORKER_SECRET}"},
                    ) as response:
                        if response.status != 200:
                            raise RuntimeError(f"Hatchable ingest returned HTTP {response.status}")
                        await response.json()
                STATE["last_success"] = datetime.now(timezone.utc).isoformat()
                STATE["last_error"] = None
                await asyncio.sleep(POLL_SECONDS)
            except Exception as exc:
                STATE["connected"] = bool(client.is_connected)
                STATE["last_error"] = str(exc)[:240]
                await asyncio.sleep(max(POLL_SECONDS, 30))

async def on_startup(app):
    app["market_task"] = asyncio.create_task(market_loop())

async def on_cleanup(app):
    task = app.get("market_task")
    if task:
        task.cancel()

def main():
    app = web.Application()
    app.router.add_get("/health", health)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    web.run_app(app, host="0.0.0.0", port=int(os.getenv("PORT", "10000")))

if __name__ == "__main__":
    main()
