#!/usr/bin/env python3
"""Send interested_email1 (E1) to recovery-audit leads — no Grok."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SUBSEQ_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"

for path in (str(_REPO_ROOT), str(_SUBSEQ_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

DEFAULT_DRAFTS = (
    _REPO_ROOT / "scripts" / "streamlit_reply_agent" / "reports" / "recovery-19-drafts.json"
)


def _enrich_lead(lead: dict, niche: str, booking_link: str) -> dict:
    key = "reservation_comptable_link" if niche == "comptable" else "reservation_cif_link"
    payload = dict(lead.get("payload") or {})
    if booking_link:
        payload[key] = booking_link
    lead = dict(lead)
    lead["payload"] = payload
    return lead


def _resolve_lead(client, campaign_id: str, email: str) -> dict | None:
    lead = client.find_lead_by_email_in_campaign(campaign_id, email)
    if lead:
        return lead
    return client.find_lead_by_email(email)


def main() -> None:
    parser = argparse.ArgumentParser(description="Send E1 to recovery lead list")
    parser.add_argument("--drafts", type=Path, default=DEFAULT_DRAFTS)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force-immediate", action="store_true", default=True)
    args = parser.parse_args()

    from send_queue import dispatch_one, thread_already_has_e1
    from shared.instantly_client import InstantlyClient, get_api_key

    drafts = json.loads(args.drafts.read_text(encoding="utf-8"))
    api_key = get_api_key()
    if not api_key:
        raise SystemExit("INSTANTLY_API_KEY is not set")
    client = InstantlyClient(api_key)

    sent = skipped = failed = 0
    errors: list[str] = []

    for row in drafts:
        email = str(row["lead_email"]).lower()
        campaign_id = str(row["campaign_id"])
        niche = str(row.get("niche") or "comptable")
        booking_link = str(row.get("booking_link") or "")

        if thread_already_has_e1(client, lead_email=email, campaign_id=campaign_id):
            print(f"SKIP {email} — E1 already in thread")
            skipped += 1
            continue

        lead = _resolve_lead(client, campaign_id, email)
        if not lead:
            print(f"FAIL {email} — lead not found in Instantly")
            failed += 1
            errors.append(f"{email}: lead_not_found")
            continue

        lead = _enrich_lead(lead, niche, booking_link)
        result = dispatch_one(
            client,
            flow="interested_email1",
            campaign_id=campaign_id,
            lead=lead,
            dry_run=args.dry_run,
            force_immediate=args.force_immediate,
        )

        if result.get("skipped"):
            print(f"SKIP {email} — {result.get('skipped')}")
            skipped += 1
        elif result.get("ok"):
            label = "dry-run" if args.dry_run else "sent"
            print(f"OK {email} — {label}")
            sent += 1
        else:
            print(f"FAIL {email} — {result.get('error')}")
            failed += 1
            errors.append(f"{email}: {result.get('error')}")

    print(f"\nDone: sent={sent} skipped={skipped} failed={failed}")
    if errors:
        print("Errors:")
        for err in errors:
            print(f"  - {err}")


if __name__ == "__main__":
    main()
