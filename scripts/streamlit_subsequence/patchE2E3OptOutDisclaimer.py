#!/usr/bin/env python3
"""Patch E2/E3 instantly_bypass_templates with opt-out disclaimer (idempotent)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SUBSEQ_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_SUBSEQ_DIR) not in sys.path:
    sys.path.insert(0, str(_SUBSEQ_DIR))

load_dotenv(_REPO_ROOT / ".env")

from default_templates import OPT_OUT_DISCLAIMER_HTML  # noqa: E402

MARKER = "Répondez non si vous ne souhaitez plus de messages"
TARGET_KEYS = ("interested_email2", "interested_email3")


def patch_body(body: str) -> str | None:
    if MARKER in body:
        return None
    needle = "{{accountSignature}}"
    if needle in body:
        return body.replace(needle, f"{OPT_OUT_DISCLAIMER_HTML}<br/><br/>{needle}")
    return f"{body.rstrip()}{OPT_OUT_DISCLAIMER_HTML}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--campaign-id")
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()

    from supabase_repo import get_client

    client = get_client()
    query = client.table("instantly_bypass_templates").select("*")
    if args.campaign_id:
        query = query.eq("campaign_id", args.campaign_id)
    rows = query.execute().data or []

    patched = 0
    for row in rows:
        key = str(row.get("template_key") or "")
        if key not in TARGET_KEYS:
            continue
        body = str(row.get("body_html") or "")
        new_body = patch_body(body)
        if not new_body:
            continue
        patched += 1
        print(f"  {row.get('campaign_id')} {key}")
        if args.execute:
            client.table("instantly_bypass_templates").update(
                {"body_html": new_body}
            ).eq("id", row["id"]).execute()

    print(f"{'EXECUTE' if args.execute else 'DRY-RUN'}: {patched} template(s) to patch")


if __name__ == "__main__":
    main()
