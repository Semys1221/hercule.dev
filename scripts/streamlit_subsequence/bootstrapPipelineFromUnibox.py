#!/usr/bin/env python3
"""One-shot CRM bootstrap: classify Unibox sent emails and seed pipeline + events."""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from shared.instantly_client import (  # noqa: E402
    FILTER_LEAD_INTERESTED,
    FILTER_LEAD_NO_SHOW,
    InstantlyClient,
    get_api_key,
)

from send_queue import (  # noqa: E402
    INTERESTED_STATUS,
    NO_SHOW_STATUS,
    idempotency_key,
    lead_has_replied_since,
)

from supabase_repo import (  # noqa: E402
    get_event_sent_at,
    get_pipeline_step,
    has_sent_event,
    list_configs,
    list_sent_flows,
    record_event,
    upsert_pipeline_step,
)

PipelineStep = Literal[
    "step_0", "step_1", "step_2", "step_3", "replies_to_handle"
]
Flow = Literal[
    "interested_email1",
    "interested_email2",
    "interested_email3",
    "no_show_email1",
    "no_show_email2",
]

INTERESTED_FLOWS: list[Flow] = [
    "interested_email1",
    "interested_email2",
    "interested_email3",
]
NO_SHOW_FLOWS: list[Flow] = ["no_show_email1", "no_show_email2"]

FLOW_FINGERPRINTS: dict[Flow, list[str]] = {
    "interested_email1": [
        "voici les precisions",
        "audit de compatibilite",
        "mon agence est compatible",
    ],
    "interested_email2": [
        "confirmer que votre reservation calendly",
    ],
    "interested_email3": [
        "retirer de notre liste",
    ],
    "no_show_email1": [
        "confirmer si votre reservation calendly",
        "demandez l'audit",
    ],
    "no_show_email2": [
        "n'ayant recu aucune confirmation",
        "retirer votre agence",
    ],
}

STEP_RANK: dict[PipelineStep, int] = {
    "step_0": 0,
    "step_1": 1,
    "step_2": 2,
    "step_3": 3,
    "replies_to_handle": 4,
}

REPLY_ELIGIBLE_STEPS: set[PipelineStep] = {"step_1", "step_2", "step_3"}

EMAIL_FETCH_DELAY_S = 0.2
DEFAULT_REPORT_PATH = Path("bootstrap_pipeline_report.csv")

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def normalize_email_text(raw: str) -> str:
    """Lowercase, strip HTML, remove accents for fingerprint matching."""
    text = _HTML_TAG_RE.sub(" ", raw or "")
    text = re.sub(r"\s+", " ", text).strip().lower()
    return _strip_accents(text)


def is_hercule_email(text: str) -> bool:
    normalized = normalize_email_text(text)
    return "beatrice meyer" in normalized or "hercule.dev" in normalized


def match_flows(text: str, *, allowed_flows: list[Flow]) -> set[Flow]:
    normalized = normalize_email_text(text)
    if not is_hercule_email(normalized):
        return set()
    matched: set[Flow] = set()
    for flow in allowed_flows:
        for phrase in FLOW_FINGERPRINTS[flow]:
            if phrase in normalized:
                matched.add(flow)
                break
    return matched


def derive_step_from_flows(flows: set[str], *, is_no_show: bool) -> PipelineStep:
    if is_no_show:
        if "no_show_email2" in flows:
            return "step_3"
        if "no_show_email1" in flows:
            return "step_1"
        return "step_0"

    if "interested_email3" in flows:
        return "step_3"
    if "interested_email2" in flows:
        return "step_2"
    if "interested_email1" in flows:
        return "step_1"
    return "step_0"


def merge_steps(
    proposed: PipelineStep,
    current: PipelineStep | None,
    *,
    overwrite: bool,
) -> PipelineStep:
    if current is None:
        return proposed
    if overwrite:
        return proposed
    if STEP_RANK[proposed] >= STEP_RANK[current]:  # type: ignore[index]
        return proposed
    return current  # type: ignore[return-value]


def _extract_email_text(item: dict[str, Any]) -> tuple[str, bool]:
    """Return (text, has_body). has_body=False means subject-only (low confidence)."""
    body = item.get("body")
    if isinstance(body, dict):
        for key in ("html", "text", "plain"):
            value = body.get(key)
            if isinstance(value, str) and value.strip():
                return value, True
    for key in ("body_html", "html", "text"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value, True
    subject = str(item.get("subject") or "")
    return subject, False


def _fetch_email_detail(client: InstantlyClient, email_id: str) -> dict[str, Any] | None:
    try:
        data = client._fetch(f"/emails/{email_id.strip()}", method="GET")
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def _email_timestamp(item: dict[str, Any]) -> str:
    return str(item.get("timestamp_email") or item.get("timestamp_created") or "")


@dataclass
class FlowDetection:
    flow: Flow
    timestamp: str
    has_body: bool


@dataclass
class LeadBootstrapRow:
    email: str
    lead_id: str
    interest_status: int | None
    detected_flows: set[Flow] = field(default_factory=set)
    existing_flows: list[str] = field(default_factory=list)
    merged_flows: set[str] = field(default_factory=set)
    proposed_step: PipelineStep = "step_0"
    current_step: PipelineStep | None = None
    replied_since_send: bool = False
    confidence: str = "high"
    notes: str = ""
    flow_timestamps: dict[str, str] = field(default_factory=dict)


def classify_lead_emails(
    client: InstantlyClient,
    *,
    lead_email: str,
    campaign_id: str,
    is_no_show: bool,
) -> tuple[set[Flow], dict[Flow, str], bool]:
    """Classify sent Unibox emails. Returns (flows, timestamps, any_low_confidence)."""
    allowed: list[Flow] = list(NO_SHOW_FLOWS if is_no_show else INTERESTED_FLOWS)
    detected: set[Flow] = set()
    timestamps: dict[Flow, str] = {}
    low_confidence = False

    sent_items = client.list_emails(
        search=lead_email,
        campaign_id=campaign_id,
        email_type="sent",
        limit=50,
    )

    for item in sent_items:
        text, has_body = _extract_email_text(item)
        if not has_body and item.get("id"):
            detail = _fetch_email_detail(client, str(item["id"]))
            if detail:
                text, has_body = _extract_email_text(detail)
                item = {**item, **detail}

        if not text.strip():
            continue

        matched = match_flows(text, allowed_flows=allowed)
        if not matched:
            continue

        if not has_body:
            low_confidence = True

        ts = _email_timestamp(item)
        for flow in matched:
            detected.add(flow)
            prev = timestamps.get(flow, "")
            if ts and (not prev or ts > prev):
                timestamps[flow] = ts

    return detected, timestamps, low_confidence


def flows_from_existing(existing: list[str], *, is_no_show: bool) -> set[str]:
    allowed = set(NO_SHOW_FLOWS if is_no_show else INTERESTED_FLOWS)
    return {flow for flow in existing if flow in allowed}


def build_lead_row(
    client: InstantlyClient,
    *,
    lead: dict[str, Any],
    campaign_id: str,
    overwrite: bool,
) -> LeadBootstrapRow:
    email = str(lead.get("email") or "").strip().lower()
    lead_id = str(lead.get("id") or "")
    status = lead.get("lt_interest_status")
    is_no_show = status == NO_SHOW_STATUS

    detected, flow_ts, low_conf = classify_lead_emails(
        client,
        lead_email=email,
        campaign_id=campaign_id,
        is_no_show=is_no_show,
    )
    existing = list_sent_flows(campaign_id, email)
    merged = detected | flows_from_existing(existing, is_no_show=is_no_show)

    base_step = derive_step_from_flows(merged, is_no_show=is_no_show)
    current = get_pipeline_step(campaign_id, email)
    current_step: PipelineStep | None = None
    if current in STEP_RANK:
        current_step = current  # type: ignore[assignment]

    proposed = merge_steps(base_step, current_step, overwrite=overwrite)

    last_sent_ts = ""
    for flow in merged:
        ts = flow_ts.get(flow)  # type: ignore[arg-type]
        if not ts:
            ts = get_event_sent_at(campaign_id, email, flow)
        if ts and ts > last_sent_ts:
            last_sent_ts = ts

    replied = False
    if proposed in REPLY_ELIGIBLE_STEPS and last_sent_ts:
        replied = lead_has_replied_since(client, email, last_sent_ts)
        if replied:
            proposed = "replies_to_handle"

    notes: list[str] = []
    if low_conf:
        notes.append("subject_only_match")
    if current_step and current_step != base_step and not overwrite:
        notes.append(f"kept_current={current_step}")

    return LeadBootstrapRow(
        email=email,
        lead_id=lead_id,
        interest_status=int(status) if status is not None else None,
        detected_flows=detected,
        existing_flows=existing,
        merged_flows=merged,
        proposed_step=proposed,
        current_step=current_step,
        replied_since_send=replied,
        confidence="low" if low_conf else "high",
        notes="; ".join(notes),
        flow_timestamps={
            flow: flow_ts.get(flow)  # type: ignore[arg-type]
            or get_event_sent_at(campaign_id, email, flow)
            or datetime.now(timezone.utc).isoformat()
            for flow in merged
        },
    )


def fetch_leads(
    client: InstantlyClient,
    *,
    campaign_id: str,
    max_leads: int,
) -> list[dict[str, Any]]:
    by_email: dict[str, dict[str, Any]] = {}

    for interest_filter in (FILTER_LEAD_INTERESTED, FILTER_LEAD_NO_SHOW):
        batch = client.list_leads_by_interest_filter(
            campaign_id=campaign_id,
            interest_filter=interest_filter,
            max_leads=max_leads,
        )
        for lead in batch:
            email = str(lead.get("email") or "").strip().lower()
            if email:
                by_email[email] = lead

    return list(by_email.values())


def apply_row(row: LeadBootstrapRow, *, campaign_id: str) -> dict[str, int]:
    stats = {"pipeline_updated": 0, "events_backfilled": 0, "skipped": 0}

    if row.current_step != row.proposed_step:
        upsert_pipeline_step(campaign_id, row.email, row.proposed_step)
        stats["pipeline_updated"] += 1
    elif row.current_step is None:
        upsert_pipeline_step(campaign_id, row.email, row.proposed_step)
        stats["pipeline_updated"] += 1
    else:
        stats["skipped"] += 1

    for flow in sorted(row.merged_flows):
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
                "dispatched_at": row.flow_timestamps.get(flow)
                or datetime.now(timezone.utc).isoformat(),
                "status": "sent",
            }
        )
        stats["events_backfilled"] += 1

    return stats


def write_report(rows: list[LeadBootstrapRow], path: Path) -> None:
    fieldnames = [
        "email",
        "interest_status",
        "detected_flows",
        "existing_flows",
        "proposed_step",
        "current_step",
        "replied_since_send",
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
                    "interest_status": row.interest_status,
                    "detected_flows": ",".join(sorted(row.detected_flows)),
                    "existing_flows": ",".join(row.existing_flows),
                    "proposed_step": row.proposed_step,
                    "current_step": row.current_step or "",
                    "replied_since_send": row.replied_since_send,
                    "confidence": row.confidence,
                    "notes": row.notes,
                }
            )


def print_summary(rows: list[LeadBootstrapRow]) -> None:
    counts: dict[str, int] = {step: 0 for step in STEP_RANK}
    low_conf = 0
    for row in rows:
        counts[row.proposed_step] += 1
        if row.confidence == "low":
            low_conf += 1

    print("\n=== Bootstrap summary ===")
    for step in STEP_RANK:
        print(f"  {step}: {counts[step]}")
    print(f"  low_confidence: {low_conf}")
    print(f"  total leads: {len(rows)}")


def resolve_campaign_id(explicit: str | None) -> str:
    if explicit:
        return explicit.strip()
    configs = list_configs()
    if len(configs) == 1:
        return str(configs[0]["campaign_id"])
    if not configs:
        raise ValueError("No campaign configured — pass --campaign-id")
    names = ", ".join(c["campaign_id"][:8] + "…" for c in configs)
    raise ValueError(f"Multiple campaigns configured — pass --campaign-id ({names})")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Bootstrap instantly_bypass_pipeline from Instantly Unibox history.",
    )
    parser.add_argument("--campaign-id", help="Instantly campaign UUID")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write pipeline + events to Supabase (default: dry-run report only)",
    )
    parser.add_argument("--max-leads", type=int, default=500)
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing step even if current is more advanced",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_REPORT_PATH,
        help=f"CSV report path (default: {DEFAULT_REPORT_PATH})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    dry_run = not args.apply

    try:
        campaign_id = resolve_campaign_id(args.campaign_id)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    api_key = get_api_key()
    if not api_key:
        print("Error: INSTANTLY_API_KEY is not set", file=sys.stderr)
        return 1

    client = InstantlyClient(api_key)
    mode = "DRY-RUN" if dry_run else "APPLY"
    print(f"[{mode}] campaign={campaign_id} max_leads={args.max_leads}")

    print("Fetching Interested + No-show leads…")
    leads = fetch_leads(client, campaign_id=campaign_id, max_leads=args.max_leads)
    print(f"Found {len(leads)} lead(s).")

    rows: list[LeadBootstrapRow] = []
    apply_stats = {"pipeline_updated": 0, "events_backfilled": 0, "skipped": 0}

    for index, lead in enumerate(leads, start=1):
        email = str(lead.get("email") or "").strip().lower()
        print(f"  [{index}/{len(leads)}] {email}")
        row = build_lead_row(
            client,
            lead=lead,
            campaign_id=campaign_id,
            overwrite=args.overwrite,
        )
        rows.append(row)

        if not dry_run:
            stats = apply_row(row, campaign_id=campaign_id)
            for key in apply_stats:
                apply_stats[key] += stats[key]

        time.sleep(EMAIL_FETCH_DELAY_S)

    write_report(rows, args.report)
    print_summary(rows)
    print(f"\nReport written to {args.report.resolve()}")

    if not dry_run:
        print(
            f"\nApplied: pipeline_updated={apply_stats['pipeline_updated']} "
            f"events_backfilled={apply_stats['events_backfilled']} "
            f"skipped={apply_stats['skipped']}"
        )
    else:
        print("\nDry-run complete. Re-run with --apply to write Supabase.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
