#!/usr/bin/env python3
"""Migrate No Show leads to Interested pipeline: CRM placement, tag, optional send."""

from __future__ import annotations

import argparse
import csv
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from shared.instantly_client import (  # noqa: E402
    FILTER_LEAD_NO_SHOW,
    InstantlyClient,
    get_api_key,
    lead_custom_var,
)

from send_queue import (  # noqa: E402
    DEFAULT_FLOW_BY_STEP,
    EMAIL_SEND_DELAY_S,
    INTERESTED_STATUS,
    PipelineStep,
    campaign_requires_reservation_link,
    dispatch_one,
    idempotency_key,
    lead_has_replied_since,
    was_hercule_sent_today,
)
from supabase_repo import (  # noqa: E402
    get_event_sent_at,
    get_pipeline_step,
    has_sent_event,
    list_sent_flows,
    record_event,
    set_campaign_webhook_auto_send_enabled,
    upsert_pipeline_step,
)
from unibox_classify import (  # noqa: E402
    STEP_RANK,
    derive_step_from_flows,
    flows_from_existing_unified,
    classify_lead_emails_unified,
)

DEFAULT_CAMPAIGN_ID = "2cd03978-93b3-4462-ad88-f0fb0f35d59c"
EMAIL_FETCH_DELAY_S = 0.2
DEFAULT_REPORT = _REPO_ROOT / "tmp" / "no_show_migration_report.csv"
DEFAULT_SUMMARY = _REPO_ROOT / "tmp" / "no_show_migration_summary.md"

REPLY_ELIGIBLE_STEPS: set[PipelineStep] = {"step_1", "step_2", "step_3"}
SENDABLE_STEPS: set[PipelineStep] = {"step_0", "step_1", "step_2"}

CROSS_BACKFILL: dict[str, str] = {
    "no_show_email1": "interested_email1",
    "no_show_email2": "interested_email3",
}


@dataclass
class MigrationRow:
    email: str
    lead_id: str
    detected_flows: set[str] = field(default_factory=set)
    existing_flows: list[str] = field(default_factory=list)
    merged_flows: set[str] = field(default_factory=set)
    proposed_step: PipelineStep = "step_0"
    current_step: PipelineStep | None = None
    next_flow: str | None = None
    sent_today: bool = False
    last_send_at: str | None = None
    replied_since_send: bool = False
    missing_reservation_link: bool = False
    skip_send_reason: str = ""
    confidence: str = "high"
    notes: str = ""
    flow_timestamps: dict[str, str] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)


def _missing_reservation_link(lead: dict[str, Any]) -> bool:
    return not bool(lead_custom_var(lead, "reservation_agence_link"))


def _flow_timestamp(
    flow: str,
    *,
    flow_ts: dict[str, str],
    campaign_id: str,
    email: str,
) -> str:
    return (
        flow_ts.get(flow)
        or get_event_sent_at(campaign_id, email, flow)
        or datetime.now(timezone.utc).isoformat()
    )


def build_migration_row(
    client: InstantlyClient,
    *,
    lead: dict[str, Any],
    campaign_id: str,
    requires_link: bool,
) -> MigrationRow:
    email = str(lead.get("email") or "").strip().lower()
    lead_id = str(lead.get("id") or "")

    detected, flow_ts, low_conf = classify_lead_emails_unified(
        client,
        lead_email=email,
        campaign_id=campaign_id,
    )
    existing = list_sent_flows(campaign_id, email)
    merged = detected | flows_from_existing_unified(existing)

    base_step = derive_step_from_flows(merged, is_no_show=False)
    current_raw = get_pipeline_step(campaign_id, email)
    current_step: PipelineStep | None = None
    if current_raw in STEP_RANK:
        current_step = current_raw  # type: ignore[assignment]

    proposed: PipelineStep = base_step
    last_sent_ts = ""
    for flow in merged:
        ts = _flow_timestamp(flow, flow_ts=flow_ts, campaign_id=campaign_id, email=email)
        if ts > last_sent_ts:
            last_sent_ts = ts

    replied = False
    if proposed in REPLY_ELIGIBLE_STEPS and last_sent_ts:
        replied = lead_has_replied_since(client, email, last_sent_ts)
        if replied:
            proposed = "replies_to_handle"

    sent_today, last_send_at = was_hercule_sent_today(campaign_id, email, client)
    next_flow = DEFAULT_FLOW_BY_STEP.get(proposed)
    missing_link = requires_link and _missing_reservation_link(lead)

    skip_reasons: list[str] = []
    if proposed not in SENDABLE_STEPS:
        skip_reasons.append(f"step={proposed}")
    elif not next_flow:
        skip_reasons.append("no_next_flow")
    elif sent_today:
        skip_reasons.append("sent_today")
    elif next_flow and has_sent_event(idempotency_key(next_flow, campaign_id, email)):
        skip_reasons.append("next_flow_already_sent")
    elif missing_link:
        skip_reasons.append("missing_reservation_link")

    notes: list[str] = []
    if low_conf:
        notes.append("subject_only_match")
    if current_step and current_step != base_step:
        notes.append(f"current_step={current_step}")

    return MigrationRow(
        email=email,
        lead_id=lead_id,
        detected_flows=set(detected),
        existing_flows=existing,
        merged_flows=merged,
        proposed_step=proposed,
        current_step=current_step,
        next_flow=next_flow,
        sent_today=sent_today,
        last_send_at=last_send_at,
        replied_since_send=replied,
        missing_reservation_link=missing_link,
        skip_send_reason="; ".join(skip_reasons),
        confidence="low" if low_conf else "high",
        notes="; ".join(notes),
        flow_timestamps={
            flow: _flow_timestamp(flow, flow_ts=flow_ts, campaign_id=campaign_id, email=email)
            for flow in merged
        },
        raw=lead,
    )


def fetch_no_show_leads(
    client: InstantlyClient,
    *,
    campaign_id: str,
    max_leads: int,
) -> list[dict[str, Any]]:
    return client.list_leads_by_interest_filter(
        campaign_id=campaign_id,
        interest_filter=FILTER_LEAD_NO_SHOW,
        max_leads=max_leads,
    )


def _flows_to_backfill(row: MigrationRow) -> dict[str, str]:
    """Return flow -> dispatched_at for CRM event backfill (includes cross-backfill)."""
    flows: dict[str, str] = {}
    for flow in row.merged_flows:
        flows[flow] = row.flow_timestamps.get(flow) or datetime.now(timezone.utc).isoformat()

    for source, target in CROSS_BACKFILL.items():
        if source in row.merged_flows and target not in flows:
            flows[target] = row.flow_timestamps.get(source) or datetime.now(timezone.utc).isoformat()

    return flows


def apply_crm_row(row: MigrationRow, *, campaign_id: str) -> dict[str, int]:
    stats = {"pipeline_updated": 0, "events_backfilled": 0, "tagged_interested": 0}

    if row.current_step != row.proposed_step or row.current_step is None:
        upsert_pipeline_step(campaign_id, row.email, row.proposed_step)
        stats["pipeline_updated"] += 1

    for flow, dispatched_at in sorted(_flows_to_backfill(row).items()):
        idem = idempotency_key(flow, campaign_id, row.email)
        if has_sent_event(idem):
            continue
        record_event(
            {
                "idempotency_key": idem,
                "flow": flow,
                "campaign_id": campaign_id,
                "lead_email": row.email,
                "lead_id": row.lead_id or None,
                "dispatched_at": dispatched_at,
                "status": "sent",
            }
        )
        stats["events_backfilled"] += 1

    return stats


def tag_interested(client: InstantlyClient, row: MigrationRow, *, campaign_id: str) -> None:
    client.update_interest_status(
        lead_email=row.email,
        interest_value=INTERESTED_STATUS,
        campaign_id=campaign_id,
    )


def send_next_flow(
    client: InstantlyClient,
    row: MigrationRow,
    *,
    campaign_id: str,
    dry_run: bool,
) -> dict[str, Any]:
    if row.skip_send_reason:
        return {"ok": True, "skipped": row.skip_send_reason, "lead_email": row.email}
    if not row.next_flow:
        return {"ok": True, "skipped": "no_next_flow", "lead_email": row.email}

    return dispatch_one(
        client,
        flow=row.next_flow,  # type: ignore[arg-type]
        campaign_id=campaign_id,
        lead=row.raw,
        dry_run=dry_run,
        force_immediate=True,
    )


def write_report(rows: list[MigrationRow], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "email",
        "detected_flows",
        "existing_flows",
        "proposed_step",
        "current_step",
        "next_flow",
        "sent_today",
        "last_send_at",
        "replied_since_send",
        "missing_reservation_link",
        "skip_send_reason",
        "confidence",
        "notes",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "email": row.email,
                    "detected_flows": ",".join(sorted(row.detected_flows)),
                    "existing_flows": ",".join(row.existing_flows),
                    "proposed_step": row.proposed_step,
                    "current_step": row.current_step or "",
                    "next_flow": row.next_flow or "",
                    "sent_today": row.sent_today,
                    "last_send_at": row.last_send_at or "",
                    "replied_since_send": row.replied_since_send,
                    "missing_reservation_link": row.missing_reservation_link,
                    "skip_send_reason": row.skip_send_reason,
                    "confidence": row.confidence,
                    "notes": row.notes,
                }
            )


def write_summary(
    rows: list[MigrationRow],
    path: Path,
    *,
    campaign_id: str,
    mode: str,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    step_counts: dict[str, int] = {step: 0 for step in STEP_RANK}
    sent_today_count = 0
    will_send = 0
    for row in rows:
        step_counts[row.proposed_step] += 1
        if row.sent_today:
            sent_today_count += 1
        if not row.skip_send_reason and row.next_flow:
            will_send += 1

    lines = [
        "# No Show → Interested migration summary",
        "",
        f"- Campaign: `{campaign_id}`",
        f"- Mode: **{mode}**",
        f"- Total leads: **{len(rows)}**",
        f"- Sent Hercule today: **{sent_today_count}**",
        f"- Eligible for send (not skipped): **{will_send}**",
        "",
        "## Step distribution",
        "",
    ]
    for step in STEP_RANK:
        lines.append(f"- `{step}`: {step_counts[step]}")

    ns1_today = [
        row.email
        for row in rows
        if row.sent_today and "no_show_email1" in row.detected_flows
    ]
    if ns1_today:
        lines.extend(["", "## NS1 sent today (send skipped)", ""])
        for email in ns1_today:
            lines.append(f"- `{email}`")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--campaign-id",
        default=DEFAULT_CAMPAIGN_ID,
        help=f"Instantly campaign UUID (default: Biggy 3 {DEFAULT_CAMPAIGN_ID})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report only — no CRM writes, tags, or sends (default unless --apply)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write CRM + events, tag Interested in Instantly",
    )
    parser.add_argument(
        "--send",
        action="store_true",
        help="Send next interested flow (requires --apply); force immediate",
    )
    parser.add_argument("--max-leads", type=int, default=500)
    parser.add_argument(
        "--expected-count",
        type=int,
        default=30,
        help="Warn if No Show lead count differs from expected",
    )
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--summary", type=Path, default=DEFAULT_SUMMARY)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    dry_run = not args.apply
    if args.send and not args.apply:
        print("Error: --send requires --apply", file=sys.stderr)
        return 1

    campaign_id = args.campaign_id.strip()
    api_key = get_api_key()
    if not api_key:
        print("Error: INSTANTLY_API_KEY is not set", file=sys.stderr)
        return 1

    client = InstantlyClient(api_key)
    mode = "DRY-RUN"
    if args.apply and args.send:
        mode = "APPLY+SEND"
    elif args.apply:
        mode = "APPLY"

    print(f"[{mode}] campaign={campaign_id}")

    print("Fetching No Show leads…")
    leads = fetch_no_show_leads(client, campaign_id=campaign_id, max_leads=args.max_leads)
    print(f"Found {len(leads)} lead(s).")
    if args.expected_count and len(leads) != args.expected_count:
        print(
            f"Warning: expected {args.expected_count} leads, got {len(leads)}",
            file=sys.stderr,
        )

    requires_link = campaign_requires_reservation_link(campaign_id)
    rows: list[MigrationRow] = []
    apply_stats = {"pipeline_updated": 0, "events_backfilled": 0, "tagged_interested": 0}
    send_stats = {"sent": 0, "skipped": 0, "failed": 0}

    try:
        if args.apply:
            print("Pausing campaign webhook auto-send…")
            set_campaign_webhook_auto_send_enabled(campaign_id, False)

        for index, lead in enumerate(leads, start=1):
            email = str(lead.get("email") or "").strip().lower()
            print(f"  [{index}/{len(leads)}] {email}")
            row = build_migration_row(
                client,
                lead=lead,
                campaign_id=campaign_id,
                requires_link=requires_link,
            )
            rows.append(row)

            if args.apply:
                stats = apply_crm_row(row, campaign_id=campaign_id)
                for key in ("pipeline_updated", "events_backfilled"):
                    apply_stats[key] += stats[key]

                tag_interested(client, row, campaign_id=campaign_id)
                apply_stats["tagged_interested"] += 1

                if args.send:
                    result = send_next_flow(
                        client,
                        row,
                        campaign_id=campaign_id,
                        dry_run=False,
                    )
                    if result.get("skipped"):
                        send_stats["skipped"] += 1
                    elif result.get("ok"):
                        send_stats["sent"] += 1
                    else:
                        send_stats["failed"] += 1
                        print(
                            f"    send failed: {result.get('error', 'unknown')}",
                            file=sys.stderr,
                        )
                    time.sleep(EMAIL_SEND_DELAY_S)

            time.sleep(EMAIL_FETCH_DELAY_S)

    finally:
        if args.apply:
            print("Re-enabling campaign webhook auto-send…")
            set_campaign_webhook_auto_send_enabled(campaign_id, True)

    write_report(rows, args.report)
    write_summary(rows, args.summary, campaign_id=campaign_id, mode=mode)
    print(f"\nReport: {args.report.resolve()}")
    print(f"Summary: {args.summary.resolve()}")

    step_counts: dict[str, int] = {step: 0 for step in STEP_RANK}
    for row in rows:
        step_counts[row.proposed_step] += 1
    print("\n=== Step distribution ===")
    for step in STEP_RANK:
        print(f"  {step}: {step_counts[step]}")

    if args.apply:
        print(
            f"\nApplied: pipeline_updated={apply_stats['pipeline_updated']} "
            f"events_backfilled={apply_stats['events_backfilled']} "
            f"tagged_interested={apply_stats['tagged_interested']}"
        )
        if args.send:
            print(
                f"Send: sent={send_stats['sent']} skipped={send_stats['skipped']} "
                f"failed={send_stats['failed']}"
            )
    else:
        will_send = sum(1 for row in rows if not row.skip_send_reason and row.next_flow)
        print(f"\nDry-run complete. {will_send} lead(s) would receive next flow.")
        print("Re-run with --apply to write CRM + tag Interested.")
        print("Add --send to also dispatch next emails.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
