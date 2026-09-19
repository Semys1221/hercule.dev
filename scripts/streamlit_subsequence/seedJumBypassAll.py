#!/usr/bin/env python3
"""Seed JUM bypass templates for all three Instantly campaigns (vertical-specific E1)."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SUBSEQUENCE_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRAPER_CONFIG = _REPO_ROOT / "app" / "streamlit_scraper" / "configs" / "jum_advisory_config.py"

if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_SUBSEQUENCE_DIR) not in sys.path:
    sys.path.insert(0, str(_SUBSEQUENCE_DIR))

load_dotenv(_REPO_ROOT / ".env")


def _load_jum_verticals() -> list[dict]:
    spec = importlib.util.spec_from_file_location("jum_advisory_config", _SCRAPER_CONFIG)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {_SCRAPER_CONFIG}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return list(module.JUM_VERTICALS)


def main() -> None:
    from seedJumBypass import seed_jum_bypass

    verticals = _load_jum_verticals()
    for vertical in verticals:
        seed_jum_bypass(
            campaign_id=vertical["campaign_id"],
            campaign_name=vertical["campaign_name"],
            segment=vertical["segment"],
        )
    print(f"Seeded JUM bypass for {len(verticals)} campaigns.")


if __name__ == "__main__":
    main()
