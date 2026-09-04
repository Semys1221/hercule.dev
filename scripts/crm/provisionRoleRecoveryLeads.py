#!/usr/bin/env python3
"""One-time provisioner for Calendly bookings missing slug tracking."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "crm"))

from calendly_client import list_untracked_bookings  # noqa: E402
from config import settings, temporary_base_url_for  # noqa: E402
from slug import build_confirm_url  # noqa: E402
from supabase_repo import get_client, provision_or_update_role_recovery_lead  # noqa: E402


def main() -> None:
    start_sequences = "--start-sequences" in sys.argv
    client = get_client()
    temp_base = temporary_base_url_for("agence")
    rows = list_untracked_bookings()
    if not rows:
        print("No untracked Calendly bookings found.")
        return

    output: list[dict[str, str]] = []
    for booking in rows:
        lead = provision_or_update_role_recovery_lead(
            client,
            email=booking["email"],
            first_name=booking.get("first_name"),
            company=booking.get("company"),
            scheduled_at=booking.get("start_time"),
            calendly_invitee_uri=booking.get("invitee_uri"),
            calendly_payload={
                "invitee_uri": booking.get("invitee_uri"),
                "event_uri": booking.get("event_uri"),
            },
            calendly_questions=booking.get("questions") or {},
        )
        temp_url = build_confirm_url(temp_base, lead["slug"], booking["email"])
        output.append(
            {
                "email": booking["email"],
                "slug": lead["slug"],
                "temporary_url": temp_url,
                "lead_id": lead["id"],
            }
        )
        print(f"provisioned {booking['email']} -> {temp_url}")

    writer = csv.DictWriter(
        sys.stdout,
        fieldnames=["email", "slug", "temporary_url", "lead_id"],
    )
    writer.writeheader()
    writer.writerows(output)

    if start_sequences:
        from crm_api import start_role_recovery_sequence  # noqa: E402

        for row in output:
            result = start_role_recovery_sequence(
                lead_id=row["lead_id"],
                category="agence",
                email=row["email"],
            )
            print(f"sequence {row['email']}: {result}")
    else:
        print(
            "\nSequences not started. Re-run with --start-sequences after review.",
            file=sys.stderr,
        )
        print(f"Backend: {settings.crm_backend_url}", file=sys.stderr)


if __name__ == "__main__":
    main()
