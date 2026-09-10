#!/usr/bin/env python3
"""Match Calendly bookings to Instantly leads and enrich Calendly Contacts.company."""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "crm"))

from calendly_client import list_all_bookings  # noqa: E402
from calendly_contacts import (  # noqa: E402
    CalendlyContactsError,
    contact_company,
    create_contact,
    get_contact_by_email,
    patch_contact_company,
    preflight_contacts_scope,
)
from instantly_match import (  # noqa: E402
    InstantlyMatch,
    build_instantly_email_index,
    find_instantly_lead_for_booking,
    is_delivery_booking,
    should_patch_company,
)
from outreach_config import load_niche_campaigns  # noqa: E402
from supabase_repo import get_client, update_lead  # noqa: E402

Action = Literal[
    "ok",
    "created_contact",
    "patched",
    "skipped_no_website",
    "skipped_conflict",
    "skipped_delivery",
    "unmatched_instantly",
    "error",
]

REPORT_FIELDS = [
    "email",
    "invitee_uri",
    "start_time",
    "instantly_matched",
    "website",
    "contact_uri",
    "action",
    "note",
]


@dataclass
class SyncRow:
    email: str
    invitee_uri: str
    start_time: str
    instantly_matched: bool
    website: str
    contact_uri: str
    action: Action
    note: str

    def as_dict(self) -> dict[str, str]:
        return {
            "email": self.email,
            "invitee_uri": self.invitee_uri,
            "start_time": self.start_time,
            "instantly_matched": "yes" if self.instantly_matched else "no",
            "website": self.website,
            "contact_uri": self.contact_uri,
            "action": self.action,
            "note": self.note,
        }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync Calendly bookings with Instantly and enrich Calendly Contacts.",
    )
    parser.add_argument("--days-back", type=int, default=30)
    parser.add_argument("--days-ahead", type=int, default=30)
    parser.add_argument("--limit", type=int, default=0, help="Process at most N bookings (0 = all)")
    parser.add_argument("--force-company", action="store_true")
    parser.add_argument("--bootstrap-supabase", action="store_true")
    parser.add_argument(
        "--preload-index",
        action="store_true",
        help="Preload full Instantly campaign indexes (slow; default uses search API)",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Preview only (default)")
    mode.add_argument("--execute", action="store_true", help="Apply Calendly Contact updates")
    return parser.parse_args()


def _bootstrap_supabase_lead(
    booking: dict[str, Any],
    instantly_lead_id: str | None,
    campaign_id: str | None,
) -> str | None:
    from booking_bootstrap import BootstrapError, upsert_booked_lead  # noqa: WPS433

    if booking.get("lead_id"):
        return None

    category = str(booking.get("booking_category") or "agence")
    if category not in ("agence", "entreprise"):
        return f"bootstrap_skipped_category:{category}"

    client = get_client()
    try:
        lead = upsert_booked_lead(client, booking, category=category)
    except BootstrapError as exc:
        return f"bootstrap_failed:{exc}"

    if instantly_lead_id:
        patch: dict[str, Any] = {"instantly_lead_id": instantly_lead_id}
        if campaign_id:
            patch["instantly_campaign_id"] = campaign_id
        update_lead(
            client,
            category=category,
            lead_id=str(lead.get("id") or ""),
            patch=patch,
        )
    return "bootstrapped_supabase"


def _process_booking(
    booking: dict[str, Any],
    *,
    execute: bool,
    force_company: bool,
    bootstrap_supabase: bool,
    email_index: dict[str, InstantlyMatch],
) -> SyncRow:
    email = str(booking.get("email") or "").strip().lower()
    invitee_uri = str(booking.get("invitee_uri") or "").strip()
    start_time = str(booking.get("start_time") or "").strip()
    utm_content = str(booking.get("utm_content") or "").strip()

    if is_delivery_booking(utm_content):
        return SyncRow(
            email=email,
            invitee_uri=invitee_uri,
            start_time=start_time,
            instantly_matched=False,
            website="",
            contact_uri="",
            action="skipped_delivery",
            note="utm_content match:*",
        )

    match = find_instantly_lead_for_booking(booking, email_index=email_index)
    if not match:
        return SyncRow(
            email=email,
            invitee_uri=invitee_uri,
            start_time=start_time,
            instantly_matched=False,
            website="",
            contact_uri="",
            action="unmatched_instantly",
            note="no_instantly_lead",
        )

    website = match.website or ""
    if not website:
        return SyncRow(
            email=email,
            invitee_uri=invitee_uri,
            start_time=start_time,
            instantly_matched=True,
            website="",
            contact_uri="",
            action="skipped_no_website",
            note=f"niche={match.niche}",
        )

    notes: list[str] = [f"niche={match.niche}"]
    if bootstrap_supabase:
        bootstrap_note = _bootstrap_supabase_lead(
            booking,
            match.instantly_lead_id,
            match.campaign_id,
        )
        if bootstrap_note:
            notes.append(bootstrap_note)

    try:
        contact = get_contact_by_email(email)
        created = False
        if not contact:
            if not execute:
                return SyncRow(
                    email=email,
                    invitee_uri=invitee_uri,
                    start_time=start_time,
                    instantly_matched=True,
                    website=website,
                    contact_uri="",
                    action="created_contact",
                    note=";".join(notes + ["would_create_contact"]),
                )
            contact = create_contact(str(booking.get("name") or email), email)
            created = True

        contact_uri = str(contact.get("uri") or "").strip()
        can_patch, reason = should_patch_company(
            contact_company(contact),
            website,
            force=force_company,
        )
        if not can_patch:
            return SyncRow(
                email=email,
                invitee_uri=invitee_uri,
                start_time=start_time,
                instantly_matched=True,
                website=website,
                contact_uri=contact_uri,
                action="skipped_conflict",
                note=";".join(notes + [reason]),
            )

        if not execute:
            action: Action = "created_contact" if created else "patched"
            return SyncRow(
                email=email,
                invitee_uri=invitee_uri,
                start_time=start_time,
                instantly_matched=True,
                website=website,
                contact_uri=contact_uri,
                action=action,
                note=";".join(notes + [f"would_patch:{reason}"]),
            )

        patch_contact_company(contact_uri, website)
        action = "created_contact" if created else "patched"
        if reason == "already_set":
            action = "ok"
        return SyncRow(
            email=email,
            invitee_uri=invitee_uri,
            start_time=start_time,
            instantly_matched=True,
            website=website,
            contact_uri=contact_uri,
            action=action,
            note=";".join(notes + [reason]),
        )
    except (CalendlyContactsError, RuntimeError) as exc:
        return SyncRow(
            email=email,
            invitee_uri=invitee_uri,
            start_time=start_time,
            instantly_matched=True,
            website=website,
            contact_uri="",
            action="error",
            note=str(exc),
        )


def main() -> int:
    args = _parse_args()
    execute = bool(args.execute)
    mode = "execute" if execute else "dry-run"

    campaigns = load_niche_campaigns()
    if not campaigns:
        print(
            "No Instantly campaign configured (niche_outreach_config or env).",
            file=sys.stderr,
        )
        return 1

    print(
        f"sync-calendly-instantly-contacts ({mode}) "
        f"campaigns={','.join(c.niche for c in campaigns)}",
        file=sys.stderr,
    )

    try:
        preflight_contacts_scope()
    except CalendlyContactsError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    email_index: dict[str, InstantlyMatch] = {}
    if args.preload_index:
        print("Loading Instantly lead index...", file=sys.stderr)
        email_index = build_instantly_email_index(campaigns)
        print(f"Instantly index: {len(email_index)} leads", file=sys.stderr)

    bookings = list_all_bookings(
        days_back=max(args.days_back, 0),
        days_ahead=max(args.days_ahead, 0),
    )
    if args.limit and args.limit > 0:
        bookings = bookings[: args.limit]

    rows: list[SyncRow] = []
    for booking in bookings:
        rows.append(
            _process_booking(
                booking,
                execute=execute,
                force_company=args.force_company,
                bootstrap_supabase=args.bootstrap_supabase,
                email_index=email_index,
            )
        )

    writer = csv.DictWriter(sys.stdout, fieldnames=REPORT_FIELDS)
    writer.writeheader()
    for row in rows:
        writer.writerow(row.as_dict())

    counts: dict[str, int] = {}
    for row in rows:
        counts[row.action] = counts.get(row.action, 0) + 1

    print("---", file=sys.stderr)
    for action, count in sorted(counts.items()):
        print(f"{action}={count}", file=sys.stderr)
    print(f"total={len(rows)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
