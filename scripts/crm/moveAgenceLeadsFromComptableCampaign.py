#!/usr/bin/env python3
"""Move marketing-agency leads out of the Comptable Instantly campaign."""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"

for path in (str(_REPO_ROOT), str(_SCRAPER_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

COMPTABLE_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"
AGENCE_CAMPAIGN_ID = "2cd03978-93b3-4462-ad88-f0fb0f35d59c"
BATCH_SIZE = 100


def _payload(lead: dict[str, Any]) -> dict[str, Any]:
    payload = lead.get("payload") or {}
    return payload if isinstance(payload, dict) else {}


def _lead_summary(lead: dict[str, Any]) -> dict[str, str]:
    payload = _payload(lead)
    return {
        "id": str(lead.get("id") or ""),
        "email": str(lead.get("email") or payload.get("email") or ""),
        "company": str(lead.get("company_name") or payload.get("companyName") or ""),
        "type": str(payload.get("type") or ""),
        "service": str(payload.get("service") or ""),
        "category": str(payload.get("category") or ""),
        "niche": str(payload.get("niche") or ""),
    }


def is_marketing_agency_lead(lead: dict[str, Any]) -> bool:
    """True when lead belongs in the Agence web campaign, not Comptable."""
    payload = _payload(lead)
    service = str(payload.get("service") or "").strip().lower()
    lead_type = str(payload.get("type") or "").strip().lower()
    category = str(payload.get("category") or "").strip().lower()
    niche = str(payload.get("niche") or "").strip().lower()
    reservation_agence = str(payload.get("reservation_agence_link") or "").strip()

    if service == "expertise comptable":
        return False
    if "cabinets expertise comptable" in niche:
        return False
    if lead_type in {
        "expert-comptable",
        "cabinet d'expertise comptable",
        "comptable",
    }:
        return False
    if category in {"expert-comptable", "accounting firm", "comptable"}:
        return False
    if "expert-comptable" in lead_type or "cabinet d'expertise comptable" in lead_type:
        return False

    if service == "seo":
        return True
    if lead_type.startswith("agence") or "agence de " in lead_type:
        return True
    if reservation_agence:
        return True
    if any(
        marker in category
        for marker in (
            "concepteur de sites",
            "marketing internet",
            "agence de marketing",
            "agence de publicité",
            "graphiste",
        )
    ):
        return True

    return False


def _collect_leads(campaign_id: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    from shared.instantly_client import fetch_leads_from_campaign

    print("Fetching campaign leads...")
    leads = fetch_leads_from_campaign(campaign_id, max_leads=None)
    print(f"  {len(leads)} lead(s) in campaign")

    agency_leads = [lead for lead in leads if is_marketing_agency_lead(lead)]
    accountant_leads = [lead for lead in leads if not is_marketing_agency_lead(lead)]
    return agency_leads, accountant_leads


def _print_report(
    agency_leads: list[dict[str, Any]],
    accountant_leads: list[dict[str, Any]],
) -> None:
    print()
    print(f"Marketing agency leads to move: {len(agency_leads)}")
    print(f"Accountant leads to keep: {len(accountant_leads)}")
    print()
    print("Agency sample (up to 10):")
    for lead in agency_leads[:10]:
        row = _lead_summary(lead)
        print(
            f"  - {row['email']} | {row['company']} | "
            f"type={row['type']} | service={row['service']}"
        )
    print()
    print("Accountant sample (up to 5):")
    for lead in accountant_leads[:5]:
        row = _lead_summary(lead)
        print(
            f"  - {row['email']} | {row['company']} | "
            f"type={row['type']} | service={row['service']}"
        )


def _move_leads(
    lead_ids: list[str],
    *,
    source_campaign_id: str,
    target_campaign_id: str,
) -> int:
    from shared.instantly_client import InstantlyClient, get_api_key

    client = InstantlyClient(get_api_key())
    moved = 0
    for index in range(0, len(lead_ids), BATCH_SIZE):
        batch = lead_ids[index : index + BATCH_SIZE]
        client._fetch(
            "/leads/move",
            method="POST",
            body={
                "lead_ids": batch,
                "to_campaign_id": target_campaign_id,
                "campaign": source_campaign_id,
            },
        )
        moved += len(batch)
        print(f"  moved {moved}/{len(lead_ids)}")
        if index + BATCH_SIZE < len(lead_ids):
            time.sleep(0.5)
    return moved


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Move marketing-agency leads from Comptable to Agence web 1",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Move matching leads (default: dry-run preview only)",
    )
    parser.add_argument("--source-campaign-id", default=COMPTABLE_CAMPAIGN_ID)
    parser.add_argument("--target-campaign-id", default=AGENCE_CAMPAIGN_ID)
    args = parser.parse_args()

    agency_leads, accountant_leads = _collect_leads(args.source_campaign_id)
    _print_report(agency_leads, accountant_leads)

    if not agency_leads:
        print("\nNothing to move.")
        return 0

    if not args.execute:
        print("\nDry-run only — pass --execute to move leads.")
        return 0

    lead_ids = [str(lead.get("id") or "") for lead in agency_leads if lead.get("id")]
    print(f"\nMoving {len(lead_ids)} lead(s) to {args.target_campaign_id}...")
    moved = _move_leads(
        lead_ids,
        source_campaign_id=args.source_campaign_id,
        target_campaign_id=args.target_campaign_id,
    )
    print(f"\nDone. Moved {moved} lead(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
