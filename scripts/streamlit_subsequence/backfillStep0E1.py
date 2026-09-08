#!/usr/bin/env python3
"""Send E1 (interested_email1) to pipeline step_0 leads that never received it."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from send_queue import (  # noqa: E402
    dispatch_bulk,
    fetch_pipeline_leads,
    idempotency_key,
    leads_for_step,
    thread_already_has_e1,
)
from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402
from supabase_repo import has_pending_job, has_sent_event, list_configs  # noqa: E402

COMPTABLE_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--campaign-id",
        default=COMPTABLE_CAMPAIGN_ID,
        help="Instantly campaign UUID",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview sends/schedules without dispatching",
    )
    parser.add_argument(
        "--force-immediate",
        action="store_true",
        help="Bypass Paris send window (send now)",
    )
    parser.add_argument(
        "--max-leads",
        type=int,
        default=0,
        help="Limit number of step_0 leads to process (0 = all)",
    )
    return parser.parse_args()


def resolve_campaign_id(explicit: str | None) -> str:
    if explicit and explicit.strip():
        return explicit.strip()
    configs = list_configs()
    if not configs:
        raise SystemExit("No campaign in instantly_bypass_config; pass --campaign-id")
    campaign_id = str(configs[0].get("campaign_id") or "").strip()
    if not campaign_id:
        raise SystemExit("Campaign config row missing campaign_id")
    return campaign_id


def main() -> None:
    args = parse_args()
    campaign_id = resolve_campaign_id(args.campaign_id)
    api_key = get_api_key()
    if not api_key:
        raise SystemExit("INSTANTLY_API_KEY is not set")
    client = InstantlyClient(api_key)

    queue = fetch_pipeline_leads(campaign_id=campaign_id, client=client)
    step0: list = []
    skipped_thread = 0
    skipped_scheduled = 0

    for row in leads_for_step(queue, "step_0"):
        if row.missing_reservation_link or not row.envoyer:
            continue
        idem = idempotency_key("interested_email1", campaign_id, row.email)
        if has_sent_event(idem):
            continue
        if has_pending_job(idem):
            skipped_scheduled += 1
            continue
        if thread_already_has_e1(client, lead_email=row.email, campaign_id=campaign_id):
            skipped_thread += 1
            continue
        step0.append(row)

    if args.max_leads > 0:
        step0 = step0[: args.max_leads]

    print(f"Campaign: {campaign_id}")
    print(f"Step 0 leads eligible for E1: {len(step0)}")
    print(f"Skipped (E1 already in thread): {skipped_thread}")
    print(f"Skipped (already scheduled): {skipped_scheduled}")
    if not step0:
        return

    leads_payload = [row.raw for row in step0]
    result = dispatch_bulk(
        campaign_id=campaign_id,
        flow="interested_email1",
        leads=leads_payload,
        dry_run=args.dry_run,
        force_immediate=args.force_immediate,
        on_progress=lambda msg: print(msg),
    )

    print(
        f"Done — sent={result.sent} scheduled={result.scheduled} "
        f"skipped={result.skipped} failed={result.failed}"
    )
    if result.errors:
        print("Errors:")
        for err in result.errors[:20]:
            print(f"  - {err}")
        if len(result.errors) > 20:
            print(f"  … and {len(result.errors) - 20} more")


if __name__ == "__main__":
    main()
