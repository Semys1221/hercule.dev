#!/usr/bin/env python3
"""Provision link-tracking slugs + Instantly custom_variables for leads in an Instantly list."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_CRM_DIR = _REPO_ROOT / "crm"

for path in (str(_REPO_ROOT), str(_CRM_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

DEFAULT_LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c"
DEFAULT_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"
DEFAULT_CATEGORY = "entreprise"


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _as_str(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in ("nan", "none", "<na>"):
        return ""
    return text


def _needs_provision(
    email: str,
    email_index: dict[str, tuple[str, dict[str, Any]]],
    category: str,
) -> bool:
    existing = email_index.get(email)
    if not existing:
        return True
    existing_category, row = existing
    if existing_category != category:
        return False
    slug = _as_str(row.get("slug"))
    entreprise_link = _as_str(row.get("reservation_entreprise_link"))
    confirm_link = _as_str(row.get("confirmation_agence_link"))
    post_booking_link = (
        _as_str(row.get("post_booking_link"))
        if category == "entreprise"
        else "ok"
    )
    if not slug or not entreprise_link or not confirm_link or not post_booking_link:
        return True
    return False


def _attach_campaign_lead_ids(
    client: Any,
    campaign_id: str,
    leads: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Patch Instantly custom_variables on the campaign lead, not the list lead copy."""
    enriched: list[dict[str, Any]] = []
    for lead in leads:
        email = _as_str(lead.get("email")).lower()
        if not email:
            enriched.append(lead)
            continue
        campaign_lead = client.find_lead_by_email_in_campaign(campaign_id, email)
        if campaign_lead and campaign_lead.get("id"):
            merged = dict(lead)
            merged["id"] = campaign_lead["id"]
            merged["instantly_lead_id"] = campaign_lead["id"]
            enriched.append(merged)
        else:
            enriched.append(lead)
    return enriched


def provision_list_links(
    *,
    list_id: str,
    campaign_id: str,
    category: str,
    dry_run: bool = False,
    max_leads: int | None = None,
    emails: list[str] | None = None,
    resync_all: bool = False,
    from_campaign: bool = False,
) -> dict[str, Any]:
    from instantly_client import get_instantly_client
    from pipeline import provision_from_instantly_leads
    from shared.instantly_client import fetch_leads_from_campaign, fetch_leads_from_list
    from supabase_repo import LeadCategory, get_client, load_email_index

    if category not in ("agence", "entreprise"):
        raise ValueError(f"Invalid category: {category}")

    lead_category: LeadCategory = category  # type: ignore[assignment]

    client = get_instantly_client()
    supabase = get_client()
    email_index = load_email_index(supabase)

    if from_campaign:
        all_leads = fetch_leads_from_campaign(campaign_id, max_leads=max_leads)
    else:
        all_leads = fetch_leads_from_list(list_id, max_leads=max_leads)
    email_filter = {_as_str(email).lower() for email in (emails or []) if _as_str(email)}
    selected: list[dict[str, Any]] = []
    skipped_wrong_category = 0
    skipped_email_filter = 0

    for lead in all_leads:
        email = _as_str(lead.get("email")).lower()
        if not email or "@" not in email:
            continue
        if email_filter and email not in email_filter:
            skipped_email_filter += 1
            continue
        existing = email_index.get(email)
        if existing and existing[0] != category:
            skipped_wrong_category += 1
            continue
        if resync_all or _needs_provision(email, email_index, category):
            selected.append(lead)

    summary: dict[str, Any] = {
        "list_id": list_id,
        "campaign_id": campaign_id,
        "category": category,
        "total_in_list": len(all_leads),
        "selected": len(selected),
        "skipped_wrong_category": skipped_wrong_category,
        "skipped_email_filter": skipped_email_filter,
        "resync_all": resync_all,
        "from_campaign": from_campaign,
    }

    if dry_run:
        summary["dry_run"] = True
        return summary

    if not selected:
        summary.update({"created": 0, "updated": 0, "patched": 0, "failed": 0})
        return summary

    if not from_campaign:
        selected = _attach_campaign_lead_ids(client, campaign_id, selected)

    result = provision_from_instantly_leads(
        category=lead_category,
        campaign_id=campaign_id,
        selected_leads=selected,
        instantly=client,
        supabase=supabase,
        patch_instantly=True,
    )

    summary.update(
        {
            "created": result.created,
            "updated": result.updated,
            "patched": result.patched,
            "failed": result.failed,
            "errors": result.errors[:10],
        }
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision link tracking for Instantly list leads")
    parser.add_argument("--list-id", default=_env("LINK_PROVISIONING_LIST_ID", DEFAULT_LIST_ID))
    parser.add_argument(
        "--campaign-id",
        default=_env("LINK_PROVISIONING_CAMPAIGN_ID", DEFAULT_CAMPAIGN_ID),
    )
    parser.add_argument(
        "--category",
        default=_env("LINK_PROVISIONING_CATEGORY", DEFAULT_CATEGORY),
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--resync-all",
        action="store_true",
        help="Re-sync all list leads to Supabase + Instantly (not only missing fields)",
    )
    parser.add_argument(
        "--from-campaign",
        action="store_true",
        help="Fetch leads from the campaign instead of the Instantly list",
    )
    parser.add_argument("--max-leads", type=int, default=None)
    parser.add_argument(
        "--email",
        action="append",
        default=[],
        help="Only provision leads matching these emails (repeatable)",
    )
    args = parser.parse_args()

    if not args.list_id or not args.campaign_id:
        print("list-id and campaign-id are required", file=sys.stderr)
        sys.exit(1)

    result = provision_list_links(
        list_id=args.list_id,
        campaign_id=args.campaign_id,
        category=args.category,
        dry_run=args.dry_run,
        max_leads=args.max_leads,
        emails=args.email or None,
        resync_all=args.resync_all,
        from_campaign=args.from_campaign,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
