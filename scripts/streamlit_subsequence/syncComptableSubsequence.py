#!/usr/bin/env python3
"""Sync comptable Interested subsequence E1–E3 from Supabase templates to Instantly."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SUBSEQUENCE_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"

for path in (str(_REPO_ROOT), str(_SUBSEQUENCE_DIR), str(_SCRAPER_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

COMPTABLE_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"
COMPTABLE_SUBSEQUENCE_ID = "7105ed91-f2b7-4316-96c9-76a3c374cd6e"

_INTERESTED_KEYS = ("interested_email1", "interested_email2", "interested_email3")


def _wrap_instantly_body(body_html: str) -> str:
    """Instantly PATCH strips bare text nodes; wrap in <p> like default_templates."""
    body = body_html.strip()
    if body.startswith("<p>") and body.endswith("</p>"):
        return body
    return f"<p>{body}</p>"


def sync_comptable_subsequence(
    *,
    campaign_id: str = COMPTABLE_CAMPAIGN_ID,
    subsequence_id: str = COMPTABLE_SUBSEQUENCE_ID,
    dry_run: bool = False,
    default_delay_days: int = 1,
) -> dict[str, object]:
    from instantly_client import patch_subsequence_sequences
    from shared.instantly_client import get_api_key
    from supabase_repo import list_templates

    rows = list_templates(campaign_id)
    emails: list[dict[str, str]] = []
    loaded_keys: list[str] = []
    for key in _INTERESTED_KEYS:
        row = next((r for r in rows if str(r.get("template_key") or "") == key), None)
        if not row:
            continue
        body = str(row.get("body_html") or "").strip()
        if not body:
            continue
        subject = str(row.get("subject") or "").strip() or "Re: votre message"
        emails.append({"subject": subject, "body": _wrap_instantly_body(body)})
        loaded_keys.append(key)

    if len(emails) < 3:
        raise RuntimeError(
            f"Expected 3 interested templates for {campaign_id}, got {len(emails)} ({loaded_keys})"
        )

    if dry_run:
        return {
            "campaign_id": campaign_id,
            "subsequence_id": subsequence_id,
            "template_keys": loaded_keys,
            "dry_run": True,
        }

    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("INSTANTLY_API_KEY is required")

    patch_subsequence_sequences(
        api_key,
        subsequence_id,
        emails,
        default_delay_days=default_delay_days,
    )
    return {
        "campaign_id": campaign_id,
        "subsequence_id": subsequence_id,
        "template_keys": loaded_keys,
        "instantly_synced": True,
        "dry_run": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PATCH Instantly subsequence from Supabase bypass templates (comptable)"
    )
    parser.add_argument("--campaign-id", default=COMPTABLE_CAMPAIGN_ID)
    parser.add_argument("--subsequence-id", default=COMPTABLE_SUBSEQUENCE_ID)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--delay-days", type=int, default=1)
    args = parser.parse_args()

    result = sync_comptable_subsequence(
        campaign_id=args.campaign_id.strip(),
        subsequence_id=args.subsequence_id.strip(),
        dry_run=args.dry_run,
        default_delay_days=args.delay_days,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
