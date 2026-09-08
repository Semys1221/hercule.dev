"""Live Instantly counts and worker heartbeat for the operations panel."""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any

_LIVE_CACHE: dict[str, tuple[float, int]] = {}
_LIVE_CACHE_TTL_S = 60.0


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def heartbeat_path(out_dir: str) -> str:
    return os.path.join(out_dir, "worker_heartbeat.json")


def cron_events_path(out_dir: str) -> str:
    return os.path.join(out_dir, "cron_events.jsonl")


def touch_worker_heartbeat(out_dir: str, *, preset: str, status: str = "running") -> None:
    os.makedirs(out_dir, exist_ok=True)
    payload = {
        "preset": preset,
        "status": status,
        "last_seen": _utc_now(),
    }
    path = heartbeat_path(out_dir)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    os.replace(tmp, path)


def load_worker_heartbeat(out_dir: str) -> dict[str, Any] | None:
    path = heartbeat_path(out_dir)
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def append_cron_event(out_dir: str, event: dict[str, Any]) -> None:
    os.makedirs(out_dir, exist_ok=True)
    row = {"ts": _utc_now(), **event}
    with open(cron_events_path(out_dir), "a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def tail_cron_events(out_dir: str, *, max_lines: int = 10) -> list[dict[str, Any]]:
    path = cron_events_path(out_dir)
    if not os.path.isfile(path):
        return []
    try:
        with open(path, encoding="utf-8") as handle:
            lines = handle.readlines()
    except OSError:
        return []
    events: list[dict[str, Any]] = []
    for line in lines[-max_lines:]:
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
            if isinstance(item, dict):
                events.append(item)
        except json.JSONDecodeError:
            continue
    return events


def fetch_instantly_live(config: dict, *, use_cache: bool = True) -> int | None:
    """Return lead count in Instantly list, or None if keys missing / API error."""
    api_key = str(config.get("INSTANTLY_API_KEY") or "").strip()
    list_id = str(config.get("INSTANTLY_LIST_ID") or "").strip()
    if not api_key or not list_id:
        return None

    cache_key = list_id
    if use_cache and cache_key in _LIVE_CACHE:
        cached_at, value = _LIVE_CACHE[cache_key]
        if time.time() - cached_at < _LIVE_CACHE_TTL_S:
            return value

    try:
        from instantly_client import count_leads_in_list

        value = count_leads_in_list(api_key, list_id)
        if value is not None:
            _LIVE_CACHE[cache_key] = (time.time(), value)
        return value
    except Exception:
        return None


def invalidate_instantly_live_cache(list_id: str = "") -> None:
    if list_id:
        _LIVE_CACHE.pop(list_id.strip(), None)
    else:
        _LIVE_CACHE.clear()


async def sleep_with_heartbeat(
    seconds: float,
    out_dir: str,
    *,
    preset: str,
    status: str = "running",
    tick_s: float = 15.0,
) -> None:
    """Sleep in chunks while refreshing worker heartbeat."""
    import asyncio

    end = time.time() + max(seconds, 0.0)
    while True:
        touch_worker_heartbeat(out_dir, preset=preset, status=status)
        remaining = end - time.time()
        if remaining <= 0:
            break
        await asyncio.sleep(min(tick_s, remaining))


def heartbeat_age_seconds(heartbeat: dict[str, Any] | None) -> float | None:
    if not heartbeat:
        return None
    raw = str(heartbeat.get("last_seen") or "").strip()
    if not raw:
        return None
    try:
        seen = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if seen.tzinfo is None:
            seen = seen.replace(tzinfo=timezone.utc)
        return max((datetime.now(timezone.utc) - seen).total_seconds(), 0.0)
    except ValueError:
        return None
