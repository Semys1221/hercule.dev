"""Tests for geo reload cycles after full location sweep."""

from __future__ import annotations

import sys
from pathlib import Path

_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from commune_passes import (  # noqa: E402
    GEO_PHASE_PASS,
    initial_geo_state,
    maybe_begin_reload_round,
    reload_enabled,
    reload_max_rounds,
)
from config_loader import load_config  # noqa: E402
from scrape_state import new_scrape_state  # noqa: E402


def _vol_config() -> dict:
    return load_config("cabinets_expertise_comptable_vol", require_keys=False)


def test_vol_config_starts_commune_pass() -> None:
    config = _vol_config()
    assert config.get("SCRAPE_START_QUERY_PASS") == 2
    assert config.get("OUTSCRAPER_FILTERS") == ["only_with_website", "operational_only"]
    assert config.get("SCRAPE_RELOAD_ENABLED") is True
    assert config.get("SCRAPE_RELOAD_MAX_ROUNDS") == 3


def test_initial_geo_state_uses_start_pass() -> None:
    config = {
        "SCRAPE_START_QUERY_PASS": 0,
        "KEYWORDS": ["expert comptable"],
        "EXPANSION_KEYWORDS": [],
        "LOCATIONS": ["Paris"],
        "EXPANSION_LOCATIONS": [],
    }
    geo_phase, query_pass, skip_places = initial_geo_state(config)
    assert geo_phase == GEO_PHASE_PASS
    assert query_pass == 0
    assert skip_places == 0


def test_reload_stops_on_zero_delta() -> None:
    config = {
        "TARGET_LEADS": 10000,
        "TARGET_MODE": "instantly_pushed_run",
        "SCRAPE_RELOAD_ENABLED": True,
        "SCRAPE_RELOAD_MAX_ROUNDS": 3,
        "SCRAPE_START_QUERY_PASS": 0,
    }
    run_state = new_scrape_state(
        config,
        queries_total=10,
        batches_total=1,
        instantly_pushed=100,
    )
    run_state["reload_round"] = 1
    run_state["reload_round_pushed_start"] = 100
    logs: list[str] = []

    started, new_geo = maybe_begin_reload_round(
        config,
        run_state,
        instantly_pushed=100,
        target=10000,
        target_mode="instantly_pushed_run",
        log_cb=logs.append,
    )
    assert not started
    assert new_geo is None
    assert any("pushed 0" in line for line in logs)


def test_reload_advances_up_to_max() -> None:
    config = {
        "TARGET_LEADS": 10000,
        "TARGET_MODE": "instantly_pushed_run",
        "SCRAPE_RELOAD_ENABLED": True,
        "SCRAPE_RELOAD_MAX_ROUNDS": 3,
        "SCRAPE_START_QUERY_PASS": 0,
        "KEYWORDS": ["expert comptable"],
        "EXPANSION_KEYWORDS": [],
        "LOCATIONS": ["Paris"],
        "EXPANSION_LOCATIONS": [],
    }
    run_state = new_scrape_state(
        config,
        queries_total=10,
        batches_total=1,
        instantly_pushed=50,
    )
    run_state["reload_round"] = 0
    run_state["reload_round_pushed_start"] = 40
    logs: list[str] = []

    started, new_geo = maybe_begin_reload_round(
        config,
        run_state,
        instantly_pushed=50,
        target=10000,
        target_mode="instantly_pushed_run",
        log_cb=logs.append,
    )
    assert started
    assert new_geo == (GEO_PHASE_PASS, 0, 0)
    assert run_state["reload_round"] == 1
    assert run_state["reload_round_pushed_start"] == 50
    assert any("Reload round 1" in line for line in logs)

    run_state["reload_round"] = 3
    run_state["reload_round_pushed_start"] = 80
    started_max, _ = maybe_begin_reload_round(
        config,
        run_state,
        instantly_pushed=90,
        target=10000,
        target_mode="instantly_pushed_run",
        log_cb=logs.append,
    )
    assert not started_max


def test_reload_disabled_breaks_on_exhaustion() -> None:
    config = {
        "TARGET_LEADS": 10000,
        "TARGET_MODE": "instantly_pushed_run",
        "SCRAPE_RELOAD_ENABLED": False,
        "SCRAPE_RELOAD_MAX_ROUNDS": 3,
    }
    run_state = new_scrape_state(
        config,
        queries_total=10,
        batches_total=1,
        instantly_pushed=10,
    )
    assert not reload_enabled(config)
    assert reload_max_rounds(config) == 3
    started, new_geo = maybe_begin_reload_round(
        config,
        run_state,
        instantly_pushed=10,
        target=10000,
        target_mode="instantly_pushed_run",
        log_cb=lambda _msg: None,
    )
    assert not started
    assert new_geo is None
