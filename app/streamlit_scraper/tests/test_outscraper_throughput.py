"""Tests for vol throughput helpers (Outscraper filters, geo advance)."""

from __future__ import annotations

import sys
from pathlib import Path

_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from core_logic import (  # noqa: E402
    _process_business,
    batch_duplicate_saturated,
    outscraper_filters,
    outscraper_request_language,
    website_required_for_scrape,
)


def test_outscraper_filters_from_config() -> None:
    config = {"OUTSCRAPER_FILTERS": ["only_with_website", "operational_only"]}
    assert outscraper_filters(config) == ["only_with_website", "operational_only"]


def test_website_not_required_when_outscraper_filter_set() -> None:
    config = {
        "ENRICH_ENABLED": False,
        "OUTSCRAPER_FILTERS": ["only_with_website"],
        "EXCLUDE_DOMAINS": [],
        "TAXONOMY_GATE_ENABLED": False,
    }
    assert website_required_for_scrape(config) is False
    row, audit = _process_business(
        {
            "name": "Cabinet Test",
            "email": "contact@cabinet-test.fr",
            "type": "Expert-comptable",
            "category": "Cabinet d'expertise comptable",
        },
        config,
        seen_domain=set(),
        seen_em=set(),
    )
    assert row is not None
    assert audit is not None
    assert audit["Verdict"] == "accepted"


def test_outscraper_request_language_uses_en_with_filters() -> None:
    assert outscraper_request_language({"OUTSCRAPER_FILTERS": ["only_with_website"]}) == "en"
    assert outscraper_request_language({"OUTSCRAPER_FILTERS": []}) == "fr"


def test_batch_duplicate_saturated() -> None:
    assert batch_duplicate_saturated(10, 90, 50) is True
    assert batch_duplicate_saturated(40, 60, 40) is False
    assert batch_duplicate_saturated(1, 1, 1) is False
