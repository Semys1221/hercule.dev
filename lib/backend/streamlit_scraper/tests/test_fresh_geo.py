"""Tests for cabinets_expertise_comptable_fresh_geo preset geo wiring."""

from __future__ import annotations

import sys
from pathlib import Path

_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from commune_passes import (  # noqa: E402
    GEO_PHASE_PASS,
    chunk_count,
    max_location_pass_index,
    next_geo_phase,
    unused_communes,
)
from config_loader import load_config  # noqa: E402
from core_logic import build_queries  # noqa: E402
from french_insee_communes import FRENCH_INSEE_COMMUNES  # noqa: E402
from french_postal_locations import FRENCH_POSTAL_LOCATIONS  # noqa: E402


def _fresh_config() -> dict:
    return load_config("cabinets_expertise_comptable_fresh_geo", require_keys=False)


def test_fresh_geo_config_locations() -> None:
    config = _fresh_config()
    assert config["INSTANTLY_LIST_ID"] == "bfb0fc90-ec59-4d49-b266-3891f59d3ea8"
    assert config.get("SCRAPE_START_QUERY_PASS") == 0
    assert config.get("SCRAPE_SKIP_PHASE_ENABLED") is False
    assert config.get("SCRAPE_DEPARTMENT_PHASE_ENABLED") is False
    assert config.get("TARGET_MODE") == "instantly_pushed_run"
    assert list(config.get("LOCATIONS") or []) == list(FRENCH_POSTAL_LOCATIONS)
    assert not (config.get("EXPANSION_LOCATIONS") or [])
    assert list(config.get("COMMUNE_POOL") or []) == list(FRENCH_INSEE_COMMUNES)


def test_commune_pool_override_chunks() -> None:
    config = _fresh_config()
    assert chunk_count(config) == 5
    assert len(unused_communes(config)) == len(FRENCH_INSEE_COMMUNES)
    # No expansion locations → base pass count 1; passes 0 + 5 commune chunks
    assert max_location_pass_index(config) == 5


def test_department_phase_disabled_exhausts_after_last_chunk() -> None:
    config = _fresh_config()
    last_pass = max_location_pass_index(config)
    nxt = next_geo_phase(
        config,
        geo_phase=GEO_PHASE_PASS,
        query_pass=last_pass,
        skip_places=0,
        limit_per_query=50,
    )
    assert nxt is None


def test_build_queries_pass0_and_pass1() -> None:
    config = _fresh_config()
    q0 = build_queries(config, 0, geo_phase=GEO_PHASE_PASS)
    assert len(q0) == 3 * len(FRENCH_POSTAL_LOCATIONS)
    assert len(q0) == 711
    q1 = build_queries(config, 1, geo_phase=GEO_PHASE_PASS)
    # 5 combined keywords × 400 communes in first chunk
    assert len(q1) == 2000
