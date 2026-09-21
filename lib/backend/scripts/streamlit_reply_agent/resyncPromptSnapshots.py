#!/usr/bin/env python3
"""Resync prompt_snapshot in Supabase from prompts/*.md for all active campaigns."""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_REPLY_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_reply_agent"

for path in (str(_REPO_ROOT), str(_REPLY_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")


def main() -> None:
    from prompt_store import prompt_file_path, save_prompt
    from supabase_repo import get_client

    client = get_client()
    configs = (
        client.table("ai_reply_agent_config")
        .select("*")
        .in_("status", ["waiting_for_replies", "paused"])
        .execute()
        .data
        or []
    )

    updated = 0
    skipped = 0
    for cfg in configs:
        campaign_id = str(cfg.get("campaign_id") or "")
        prompt_key = str(cfg.get("prompt_key") or "")
        if not campaign_id or not prompt_key or "_" not in prompt_key:
            skipped += 1
            continue
        preset_id, target_type = prompt_key.rsplit("_", 1)
        path = prompt_file_path(preset_id, target_type)
        if not path.is_file():
            print(f"SKIP {campaign_id}: missing {path.name}")
            skipped += 1
            continue
        text = path.read_text(encoding="utf-8")
        result = save_prompt(
            preset_id,
            target_type,
            text,
            campaign_id=campaign_id,
            config=cfg,
            push_prod=True,
        )
        if result.get("prod"):
            updated += 1
            print(f"OK {campaign_id} ({prompt_key})")
        else:
            skipped += 1
            print(f"SKIP {campaign_id} ({prompt_key}): {result.get('reason')}")

    print(f"\nDone: {updated} updated, {skipped} skipped")


if __name__ == "__main__":
    main()
