#!/usr/bin/env python3
"""Activate AI Reply Agent for scraper sub-niche campaigns (buyer prompts + webhooks)."""

from __future__ import annotations

import argparse
import importlib.util
import os
import sys
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"
_REPLY_DIR = _REPO_ROOT / "app" / "streamlit_reply_agent"

for path in (str(_REPO_ROOT), str(_SCRAPER_DIR), str(_REPLY_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")


def _load_app_module(app_dir: Path, module_name: str):
    module_path = app_dir / f"{module_name}.py"
    app_path = str(app_dir)
    saved_path = sys.path[:]
    saved_modules = {
        name: sys.modules[name]
        for name in ("config", "supabase_repo", "onboarding", "pipeline", "prompt_store")
        if name in sys.modules
    }
    for name in saved_modules:
        del sys.modules[name]
    repo_root = str(_REPO_ROOT)
    filtered_path = [p for p in saved_path if os.path.abspath(p) != os.path.abspath(repo_root)]
    sys.path = [app_path] + filtered_path
    try:
        spec = importlib.util.spec_from_file_location(module_name, module_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load {module_path}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module
    finally:
        sys.path = saved_path
        for name, module in saved_modules.items():
            sys.modules[name] = module


def _read_prompt(preset_id: str, target_type: str) -> str:
    path = _REPLY_DIR / "prompts" / f"{preset_id}_{target_type}.md"
    if not path.is_file():
        return ""
    return path.read_text(encoding="utf-8")


def activate_preset(
    preset_id: str,
    meta: Any,
    *,
    target_type: str = "buyer",
    status: Literal["waiting_for_replies", "paused"] = "waiting_for_replies",
    dry_run: bool = False,
) -> dict[str, Any]:
    from config_loader import load_config
    from instantly_client import instantly_resource_name
    from prompt_scaffold import scaffold_ai_reply_prompts
    from shared.instantly_client import InstantlyClient, get_api_key

    config = load_config(preset_id, require_keys=False)
    campaign_id = str(config.get("INSTANTLY_CAMPAIGN_ID") or "").strip()
    if not campaign_id:
        raise ValueError(f"{preset_id}: INSTANTLY_CAMPAIGN_ID missing")

    campaign_name = instantly_resource_name(meta.label)
    label = meta.subniche_label or meta.label
    scaffold_ai_reply_prompts(preset_id, label)
    prompt_text = _read_prompt(preset_id, target_type)
    if not prompt_text.strip():
        raise ValueError(f"Prompt file missing or empty: {preset_id}_{target_type}.md")

    reply_onboarding = _load_app_module(_REPLY_DIR, "onboarding")
    reply_repo = _load_app_module(_REPLY_DIR, "supabase_repo")
    reply_config = _load_app_module(_REPLY_DIR, "config")

    existing = reply_repo.get_config(campaign_id)
    readiness = reply_onboarding.validate_campaign_readiness(existing or {}, campaign_id)
    if readiness.ready and existing and str(existing.get("status")) == status:
        return {
            "preset_id": preset_id,
            "campaign_id": campaign_id,
            "skipped": True,
            "reason": "already_active",
        }

    if dry_run:
        return {
            "preset_id": preset_id,
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "prompt_key": f"{preset_id}_{target_type}",
            "status": status,
            "dry_run": True,
            "skipped": False,
        }

    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("INSTANTLY_API_KEY is required")

    from presets import load_niche_metadata

    instantly_client = InstantlyClient(api_key)
    public_url = reply_config.webhook_public_url()
    secret = reply_config.webhook_secret()
    if not secret:
        raise RuntimeError("INSTANTLY_BYPASS_WEBHOOK_SECRET or CRON_SECRET required")

    reply_id, ooo_id = reply_onboarding.initiate_webhooks(
        instantly_client,
        campaign_id=campaign_id,
        campaign_name=campaign_name,
        target_url=public_url,
        secret=secret,
    )

    merged = reply_onboarding.merge_webhook_config(
        existing,
        {
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "niche_preset_id": preset_id,
            "target_type": target_type,
            "prompt_key": f"{preset_id}_{target_type}",
            "webhook_id": reply_id,
            "ooo_webhook_id": ooo_id,
        },
    )
    reply_repo.save_config(merged)

    niche_metadata = load_niche_metadata(preset_id)
    row = reply_onboarding.activate_campaign(
        campaign_id=campaign_id,
        campaign_name=campaign_name,
        niche_preset_id=preset_id,
        niche_metadata=niche_metadata,
        target_type=target_type,
        prompt_key=f"{preset_id}_{target_type}",
        prompt_snapshot=prompt_text,
        webhook_id=reply_id,
        ooo_webhook_id=ooo_id,
    )
    if status == "paused":
        row["status"] = "paused"
    reply_repo.save_config(row)

    final = reply_repo.get_config(campaign_id) or {}
    final_readiness = reply_onboarding.validate_campaign_readiness(final, campaign_id)
    if not final_readiness.ready:
        raise RuntimeError(
            f"{preset_id}: activation incomplete ({final_readiness.reason})"
        )

    return {
        "preset_id": preset_id,
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "prompt_key": f"{preset_id}_{target_type}",
        "status": final.get("status"),
        "skipped": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Activate AI Reply Agent for sub-niche campaigns")
    parser.add_argument("--preset", default="", help="Single preset id (default: all sub-niches)")
    parser.add_argument("--target-type", default="buyer", choices=["buyer", "seller"])
    parser.add_argument(
        "--status",
        default="waiting_for_replies",
        choices=["waiting_for_replies", "paused"],
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    from bootstrap.discovery import discover_presets
    from bootstrap.provision import provision_targets

    presets = discover_presets(use_cache=True)
    try:
        targets = provision_targets(args.preset)
    except KeyError:
        print(f"Unknown preset: {args.preset!r}", file=sys.stderr)
        raise SystemExit(1)

    failed = False
    for pid in targets:
        try:
            result = activate_preset(
                pid,
                presets[pid],
                target_type=args.target_type,
                status=args.status,
                dry_run=args.dry_run,
            )
        except Exception as exc:
            failed = True
            print(f"FAIL {pid}: {exc}", file=sys.stderr)
            continue

        if result.get("skipped"):
            print(f"SKIP {pid} — {result.get('reason')}")
            continue
        mode = "DRY" if args.dry_run else "OK"
        print(
            f"{mode} {pid} — campaign={result.get('campaign_id')} "
            f"status={result.get('status', args.status)} "
            f"key={result.get('prompt_key')}"
        )

    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
