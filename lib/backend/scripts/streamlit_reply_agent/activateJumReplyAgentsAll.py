#!/usr/bin/env python3
"""Activate AI Reply Agent for all three JUM Instantly campaigns."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"
_REPLY_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_reply_agent"
_SCRAPER_CONFIG = _SCRAPER_DIR / "configs" / "jum_advisory_config.py"

for path in (str(_REPO_ROOT), str(_SCRAPER_DIR), str(_REPLY_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")


def _load_jum_verticals() -> list[dict]:
    spec = importlib.util.spec_from_file_location("jum_advisory_config", _SCRAPER_CONFIG)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {_SCRAPER_CONFIG}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return list(module.JUM_VERTICALS)


def _patch_jum_campaign_preset_resolution(jum_campaign_ids: set[str]) -> None:
    import onboarding
    import presets

    original = presets.resolve_preset_for_campaign

    def _resolve(campaign_id: str) -> str | None:
        if campaign_id.strip() in jum_campaign_ids:
            return "jum_advisory"
        return original(campaign_id)

    presets.resolve_preset_for_campaign = _resolve
    onboarding.resolve_preset_for_campaign = _resolve


def main() -> None:
    verticals = _load_jum_verticals()
    jum_campaign_ids = {vertical["campaign_id"] for vertical in verticals}
    _patch_jum_campaign_preset_resolution(jum_campaign_ids)

    from activateReplyAgents import activate_preset
    from bootstrap.discovery import discover_presets

    presets = discover_presets(use_cache=True)
    meta = presets.get("jum_advisory")
    if meta is None:
        raise SystemExit("jum_advisory preset not found")

    import config_loader

    original_load = config_loader.load_config
    failed = False

    for vertical in verticals:
        campaign_id = vertical["campaign_id"]
        campaign_name = vertical["campaign_name"]

        class _Meta:
            label = campaign_name
            subniche_label = f"{meta.label} — {vertical['label']}"

        def _load_config(preset_id: str, require_keys: bool = True):
            config = original_load(preset_id, require_keys=require_keys)
            if preset_id == "jum_advisory":
                config = dict(config)
                config["INSTANTLY_CAMPAIGN_ID"] = campaign_id
                config["INSTANTLY_LIST_ID"] = vertical["list_id"]
            return config

        config_loader.load_config = _load_config
        try:
            result = activate_preset(
                "jum_advisory",
                _Meta(),
                target_type="buyer",
                status="waiting_for_replies",
            )
        except Exception as exc:
            failed = True
            print(f"FAIL {vertical['key']}: {exc}", file=sys.stderr)
            continue
        finally:
            config_loader.load_config = original_load

        if result.get("skipped"):
            print(f"SKIP {vertical['key']} — {result.get('reason')}")
        else:
            print(
                f"OK {vertical['key']} — campaign={result.get('campaign_id')} "
                f"status={result.get('status')}"
            )

    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
