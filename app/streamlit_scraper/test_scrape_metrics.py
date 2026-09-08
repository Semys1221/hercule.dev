"""Tests for scrape metrics helpers."""

from datetime import datetime, timedelta, timezone

from scrape_metrics import heartbeat_age_seconds, load_worker_heartbeat


def test_heartbeat_age_seconds_recent() -> None:
    seen = (datetime.now(timezone.utc) - timedelta(seconds=30)).isoformat()
    age = heartbeat_age_seconds({"last_seen": seen})
    assert age is not None
    assert 0 <= age < 120


def test_heartbeat_age_seconds_missing() -> None:
    assert heartbeat_age_seconds(None) is None
    assert heartbeat_age_seconds({}) is None


def test_load_worker_heartbeat_missing(tmp_path) -> None:
    assert load_worker_heartbeat(str(tmp_path)) is None
