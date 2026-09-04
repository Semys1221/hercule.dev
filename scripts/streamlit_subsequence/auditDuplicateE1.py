#!/usr/bin/env python3
"""Audit Unibox threads for duplicate E1 sends (heuristic: word 'mandataires')."""

from __future__ import annotations

import argparse
import csv
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402

from bootstrapPipelineFromUnibox import fetch_leads, resolve_campaign_id  # noqa: E402
from send_queue import NO_SHOW_STATUS  # noqa: E402
from supabase_repo import get_client  # noqa: E402
from unibox_classify import (  # noqa: E402
    INTERESTED_FLOWS,
    is_hercule_email,
    match_flows,
    normalize_email_text,
)
from unibox_thread import ThreadMessage, fetch_thread_messages  # noqa: E402

DEFAULT_OUT = _REPO_ROOT / "tmp" / "e1_duplicate_audit.csv"
DEFAULT_SUMMARY = _REPO_ROOT / "tmp" / "e1_duplicate_audit_summary.md"
MANDATAIRES_MARKER = "mandataires"
EMAIL_FETCH_DELAY_S = 0.2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--campaign-id", help="Instantly campaign UUID")
    parser.add_argument(
        "--since-hours",
        type=int,
        default=24,
        help="Audit E1 sent events within this window (default 24)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="CSV output path",
    )
    parser.add_argument(
        "--summary",
        type=Path,
        default=DEFAULT_SUMMARY,
        help="Markdown summary path",
    )
    return parser.parse_args()


def _load_recent_e1_sent(
    campaign_id: str,
    *,
    since: datetime,
) -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("instantly_bypass_events")
        .select("lead_email, dispatched_at, webhook_received_at, status")
        .eq("campaign_id", campaign_id)
        .eq("flow", "interested_email1")
        .eq("status", "sent")
        .gte("dispatched_at", since.isoformat())
        .order("dispatched_at")
        .execute()
    )
    rows = resp.data or []
    by_email: dict[str, dict[str, Any]] = {}
    for row in rows:
        email = str(row.get("lead_email") or "").strip().lower()
        if not email:
            continue
        by_email[email] = row
    return [{"lead_email": email, **by_email[email]} for email in sorted(by_email)]


def _interest_label(status: int | None) -> str:
    if status == 1:
        return "Interested"
    if status == NO_SHOW_STATUS:
        return "No Show"
    return str(status) if status is not None else "—"


def _mandataires_messages(messages: list[ThreadMessage]) -> list[ThreadMessage]:
    matched: list[ThreadMessage] = []
    for msg in messages:
        if msg.direction != "sent":
            continue
        text = msg.body_plain or msg.body_html
        if not is_hercule_email(text):
            continue
        if MANDATAIRES_MARKER in normalize_email_text(text):
            matched.append(msg)
    return matched


def _detect_e1_flows(messages: list[ThreadMessage]) -> set[str]:
    flows: set[str] = set()
    for msg in messages:
        if msg.direction != "sent":
            continue
        text = msg.body_plain or msg.body_html
        flows |= match_flows(text, allowed_flows=list(INTERESTED_FLOWS))
    return flows


def audit_lead(
    client: InstantlyClient,
    *,
    campaign_id: str,
    lead_email: str,
    e1_sent_at: str | None,
    lead: dict[str, Any] | None,
) -> dict[str, Any]:
    interest_status: int | None = None
    if lead:
        raw = lead.get("lt_interest_status")
        try:
            interest_status = int(raw) if raw is not None else None
        except (TypeError, ValueError):
            interest_status = None

    messages = fetch_thread_messages(
        client,
        lead_email=lead_email,
        campaign_id=campaign_id,
        lead_first_name=str((lead or {}).get("first_name") or ""),
        interest_status=interest_status,
    )
    mandataires_msgs = _mandataires_messages(messages)
    mandataires_timestamps = " | ".join(m.timestamp for m in mandataires_msgs if m.timestamp)

    return {
        "lead_email": lead_email,
        "e1_sent_at": e1_sent_at or "",
        "interest_status": interest_status if interest_status is not None else "",
        "interest_label": _interest_label(interest_status),
        "mandataires_message_count": len(mandataires_msgs),
        "duplicate_e1": len(mandataires_msgs) >= 2,
        "detected_e1_flow": "interested_email1" in _detect_e1_flows(messages),
        "mandataires_timestamps": mandataires_timestamps,
    }


def _write_summary(
    path: Path,
    *,
    campaign_id: str,
    since_hours: int,
    rows: list[dict[str, Any]],
) -> None:
    total = len(rows)
    duplicate_rows = [r for r in rows if r["duplicate_e1"]]
    clean_rows = [r for r in rows if r["mandataires_message_count"] == 1]
    no_mandataires = [r for r in rows if r["mandataires_message_count"] == 0]
    no_show_rows = [r for r in rows if r.get("interest_label") == "No Show"]

    lines = [
        "# E1 duplicate audit summary",
        "",
        f"- Campaign: `{campaign_id}`",
        f"- Window: last {since_hours} hours (E1 events with status sent)",
        f"- Total audited: **{total}**",
        f"- Duplicate E1 (`mandataires` >= 2): **{len(duplicate_rows)}**",
        f"- Clean (exactly 1 `mandataires`): **{len(clean_rows)}**",
        f"- No `mandataires` in thread: **{len(no_mandataires)}**",
        f"- Currently No Show in Instantly: **{len(no_show_rows)}**",
        "",
    ]

    if duplicate_rows:
        lines.append("## Confirmed duplicates")
        lines.append("")
        for row in duplicate_rows:
            lines.append(
                f"- `{row['lead_email']}` — {row['mandataires_message_count']} messages "
                f"({row['mandataires_timestamps']})"
            )
        lines.append("")
        lines.append(
            "**Recommendation:** enable webhook E1 thread guard (skip if E1 already in Unibox)."
        )
    else:
        lines.append("No duplicate E1 detected via `mandataires` heuristic.")

    if no_show_rows:
        lines.append("")
        lines.append("## Leads still tagged No Show but E1 sent recently")
        lines.append("")
        for row in no_show_rows:
            lines.append(f"- `{row['lead_email']}` — E1 at {row['e1_sent_at']}")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    campaign_id = resolve_campaign_id(args.campaign_id)
    since = datetime.now(timezone.utc) - timedelta(hours=args.since_hours)

    api_key = get_api_key()
    if not api_key:
        print("INSTANTLY_API_KEY is not set", file=sys.stderr)
        return 1

    events = _load_recent_e1_sent(campaign_id, since=since)
    print(f"Campaign: {campaign_id}")
    print(f"E1 sent events since {since.isoformat()}: {len(events)}")
    if not events:
        print("Nothing to audit.")
        return 0

    client = InstantlyClient(api_key)
    leads_by_email = {
        str(lead.get("email") or "").strip().lower(): lead
        for lead in fetch_leads(client, campaign_id=campaign_id, max_leads=5000)
    }
    rows: list[dict[str, Any]] = []

    for index, event in enumerate(events, start=1):
        email = str(event["lead_email"])
        print(f"  [{index}/{len(events)}] {email}")
        row = audit_lead(
            client,
            campaign_id=campaign_id,
            lead_email=email,
            e1_sent_at=str(event.get("dispatched_at") or ""),
            lead=leads_by_email.get(email),
        )
        rows.append(row)
        time.sleep(EMAIL_FETCH_DELAY_S)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with args.out.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    duplicate_count = sum(1 for row in rows if row["duplicate_e1"])
    clean_count = sum(1 for row in rows if row["mandataires_message_count"] == 1)
    no_show_now = sum(1 for row in rows if row.get("interest_label") == "No Show")

    print("")
    print(f"total_audited={len(rows)}")
    print(f"duplicate_count={duplicate_count}")
    print(f"clean_count={clean_count}")
    print(f"no_show_now={no_show_now}")
    print(f"CSV: {args.out}")

    _write_summary(
        args.summary,
        campaign_id=campaign_id,
        since_hours=args.since_hours,
        rows=rows,
    )
    print(f"Summary: {args.summary}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
