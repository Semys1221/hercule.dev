#!/usr/bin/env python3
"""Bootstrap a Calendly booking that missed link-tracking into the Resend email flow.

Examples:
  python3 scripts/crm/bootstrapUntrackedBooking.py --match METUKI --dry-run
  python3 scripts/crm/bootstrapUntrackedBooking.py --match METUKI --execute
  python3 scripts/crm/bootstrapUntrackedBooking.py --email contact@example.com --execute

Requires:
  - CALENDLY_API_TOKEN, Supabase env vars
  - CRM_BACKEND_URL + LINK_TRACKING_WEBHOOK_SECRET or CRON_SECRET (for --execute)
  - pnpm dev or deployed Next.js backend (for sequence trigger)
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "crm"))

from booking_bootstrap import BootstrapError, bootstrap_untracked_booking  # noqa: E402
from crm_api import start_booking_sequence, start_role_recovery_sequence  # noqa: E402
from config import settings  # noqa: E402


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Bootstrap an untracked Calendly booking into the Resend sequence.",
    )
    parser.add_argument("--email", help="Exact Calendly invitee email")
    parser.add_argument(
        "--match",
        help="Fuzzy match on email, name, or company (e.g. METUKI)",
    )
    parser.add_argument("--invitee-uri", help="Exact Calendly invitee URI")
    parser.add_argument(
        "--category",
        choices=["agence", "entreprise"],
        default="agence",
        help="Lead category (default: agence)",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview only (default when --execute is omitted)",
    )
    mode.add_argument(
        "--execute",
        action="store_true",
        help="Provision lead, sync links, and start sequence",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Continue even if a sequence already started",
    )
    parser.add_argument(
        "--skip-meeting-links",
        action="store_true",
        help="Skip Calendly meeting link backfill",
    )
    return parser.parse_args()


def _sync_meeting_links() -> None:
    cmd = [
        "pnpm",
        "provision-calendly-meeting-links",
        "--apply",
        "--limit=5",
    ]
    print(f"Running: {' '.join(cmd)}", file=sys.stderr)
    result = subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.stdout:
        print(result.stdout, end="")
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "unknown error"
        raise RuntimeError(f"Meeting links sync failed: {message}")


def _start_sequence(
    *,
    sequence: str,
    lead_id: str,
    category: str,
    email: str,
) -> dict[str, Any]:
    if sequence == "main":
        return start_booking_sequence(
            lead_id=lead_id,
            category=category,
            mode="now",
        )
    if sequence == "recovery":
        return start_role_recovery_sequence(
            lead_id=lead_id,
            category=category,
            email=email,
        )
    raise RuntimeError(f"Unsupported sequence kind: {sequence}")


def _print_summary(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False))


def main() -> int:
    args = _parse_args()
    dry_run = not args.execute

    try:
        result = bootstrap_untracked_booking(
            email=args.email,
            match=args.match,
            invitee_uri=args.invitee_uri,
            category=args.category,
            dry_run=dry_run,
            force=args.force,
        )
    except BootstrapError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    summary: dict[str, Any] = {
        "ok": result.ok,
        "dry_run": result.dry_run,
        "email": result.email,
        "company": result.company,
        "lead_id": result.lead_id,
        "slug": result.slug,
        "scheduled_at": result.scheduled_at,
        "sequence": result.sequence,
        "tracked_after": result.tracked,
        "scheduled_preview": result.scheduled_preview,
        "warnings": result.warnings,
        "backend": settings.crm_backend_url,
    }

    if dry_run:
        summary["note"] = (
            "tracked=false is expected after bootstrap — booking had no utm_content"
        )
        summary["next"] = "Re-run with --execute to provision and start sequence"
        _print_summary(summary)
        return 0

    if not args.skip_meeting_links:
        try:
            _sync_meeting_links()
        except Exception as exc:
            print(f"Warning: meeting links sync failed: {exc}", file=sys.stderr)

    try:
        seq = _start_sequence(
            sequence=result.sequence,
            lead_id=result.lead_id,
            category=args.category,
            email=result.email,
        )
    except Exception as exc:
        summary["sequence_result"] = {"started": False, "error": str(exc)}
        _print_summary(summary)
        print(
            f"\nLead was provisioned ({result.lead_id}) but sequence failed. "
            f"Ensure backend is running: pnpm dev ({settings.crm_backend_url})",
            file=sys.stderr,
        )
        return 1

    summary["sequence_result"] = seq
    summary["jobs_started"] = seq.get("started", False)
    _print_summary(summary)

    if not seq.get("started"):
        print(
            f"Sequence not started: {seq.get('reason', 'unknown')}",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
