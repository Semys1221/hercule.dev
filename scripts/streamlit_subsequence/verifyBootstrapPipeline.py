#!/usr/bin/env python3
"""Verify bootstrap CRM classification against Unibox threads (sample per step)."""

from __future__ import annotations

import argparse
import csv
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRIPTS_SUBSEQ_DIR = Path(__file__).resolve().parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))
if str(_SCRIPTS_SUBSEQ_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_SUBSEQ_DIR))

from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402

from bootstrapPipelineFromUnibox import resolve_campaign_id  # noqa: E402
from unibox_classify import (  # noqa: E402
    NO_SHOW_STATUS,
    STEP_RANK,
    classify_lead_emails,
    derive_step_from_flows,
)
from unibox_thread import derive_step_from_thread, fetch_thread_messages  # noqa: E402

DEFAULT_BOOTSTRAP_REPORT = Path("bootstrap_pipeline_report.csv")
DEFAULT_VERIFY_REPORT = Path("verify_bootstrap_report.csv")
EMAIL_FETCH_DELAY_S = 0.2
SAMPLE_PER_STEP = 3


@dataclass
class VerifyRow:
    email: str
    proposed_step: str
    derived_step: str
    detected_flows: str
    confidence: str
    status: str
    notes: str


def _is_no_show_from_status(raw: str) -> bool:
    try:
        return int(raw) == NO_SHOW_STATUS
    except (TypeError, ValueError):
        return False


def sample_leads_from_csv(
    path: Path,
    *,
    per_step: int = SAMPLE_PER_STEP,
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    by_step: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_step[row.get("proposed_step", "step_0")].append(row)

    sampled: list[dict[str, str]] = []
    seen: set[str] = set()

    for step in STEP_RANK:
        bucket = by_step.get(step, [])
        low_first = sorted(
            bucket,
            key=lambda r: (0 if r.get("confidence") == "low" else 1, r.get("email", "")),
        )
        for row in low_first[:per_step]:
            email = row.get("email", "").strip().lower()
            if email and email not in seen:
                seen.add(email)
                sampled.append(row)

    return sampled


def verify_lead(
    client: InstantlyClient,
    *,
    row: dict[str, str],
    campaign_id: str,
) -> VerifyRow:
    email = row.get("email", "").strip().lower()
    proposed = row.get("proposed_step", "step_0")
    confidence = row.get("confidence", "high")
    status_raw = row.get("interest_status", "")
    is_no_show = _is_no_show_from_status(status_raw)

    flows, _, low_conf = classify_lead_emails(
        client,
        lead_email=email,
        campaign_id=campaign_id,
        is_no_show=is_no_show,
    )
    derived = derive_step_from_flows(set(flows), is_no_show=is_no_show)

    try:
        interest_status = int(status_raw) if status_raw else None
    except ValueError:
        interest_status = None

    thread = fetch_thread_messages(
        client,
        lead_email=email,
        campaign_id=campaign_id,
        interest_status=interest_status,
    )
    thread_step, thread_flows = derive_step_from_thread(
        thread,
        interest_status=interest_status,
    )

    notes: list[str] = []
    if low_conf:
        notes.append("low_confidence")
    if derived != thread_step:
        notes.append(f"thread_step={thread_step}")

    if proposed == derived:
        status = "MATCH"
    elif confidence == "low":
        status = "LOW_CONFIDENCE"
    else:
        status = "MISMATCH"

    return VerifyRow(
        email=email,
        proposed_step=proposed,
        derived_step=derived,
        detected_flows=",".join(sorted(flows)) or ",".join(sorted(thread_flows)),
        confidence=confidence,
        status=status,
        notes="; ".join(notes),
    )


def write_verify_report(rows: list[VerifyRow], path: Path) -> None:
    fieldnames = [
        "email",
        "proposed_step",
        "derived_step",
        "detected_flows",
        "confidence",
        "status",
        "notes",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "email": row.email,
                    "proposed_step": row.proposed_step,
                    "derived_step": row.derived_step,
                    "detected_flows": row.detected_flows,
                    "confidence": row.confidence,
                    "status": row.status,
                    "notes": row.notes,
                }
            )


def print_verify_summary(rows: list[VerifyRow]) -> tuple[int, int, int]:
    match = sum(1 for r in rows if r.status == "MATCH")
    mismatch = sum(1 for r in rows if r.status == "MISMATCH")
    low = sum(1 for r in rows if r.status == "LOW_CONFIDENCE")
    total = len(rows)

    print("\n=== Verify summary ===")
    print(f"  sampled: {total}")
    print(f"  MATCH: {match}")
    print(f"  MISMATCH: {mismatch}")
    print(f"  LOW_CONFIDENCE: {low}")
    if total:
        print(f"  match_rate: {100 * match / total:.1f}%")

    return match, mismatch, low


def can_auto_apply(
    bootstrap_rows: list[dict[str, str]],
    verify_rows: list[VerifyRow],
) -> tuple[bool, str]:
    total = len(bootstrap_rows)
    if total == 0:
        return False, "no leads in bootstrap report"

    low_conf = sum(1 for r in bootstrap_rows if r.get("confidence") == "low")
    low_pct = low_conf / total
    if low_pct > 0.10:
        return False, f"low_confidence {low_pct:.0%} exceeds 10% threshold"

    mismatches = [r for r in verify_rows if r.status == "MISMATCH"]
    if mismatches:
        emails = ", ".join(r.email for r in mismatches[:5])
        return False, f"{len(mismatches)} mismatch(es) in sample: {emails}"

    return True, "ok"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify bootstrap pipeline classification.")
    parser.add_argument("--campaign-id", help="Instantly campaign UUID")
    parser.add_argument(
        "--bootstrap-report",
        type=Path,
        default=DEFAULT_BOOTSTRAP_REPORT,
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_VERIFY_REPORT,
    )
    parser.add_argument("--per-step", type=int, default=SAMPLE_PER_STEP)
    parser.add_argument(
        "--check-auto-apply",
        action="store_true",
        help="Exit 0 only if safe to auto-apply bootstrap",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not args.bootstrap_report.is_file():
        print(f"Error: bootstrap report not found: {args.bootstrap_report}", file=sys.stderr)
        return 1

    try:
        campaign_id = resolve_campaign_id(args.campaign_id)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    api_key = get_api_key()
    if not api_key:
        print("Error: INSTANTLY_API_KEY is not set", file=sys.stderr)
        return 1

    with args.bootstrap_report.open(newline="", encoding="utf-8") as handle:
        bootstrap_rows = list(csv.DictReader(handle))

    sample = sample_leads_from_csv(args.bootstrap_report, per_step=args.per_step)
    print(f"Verifying {len(sample)} sampled lead(s) for campaign {campaign_id}…")

    client = InstantlyClient(api_key)
    verify_rows: list[VerifyRow] = []

    for index, row in enumerate(sample, start=1):
        email = row.get("email", "")
        print(f"  [{index}/{len(sample)}] {email}")
        verify_rows.append(verify_lead(client, row=row, campaign_id=campaign_id))
        time.sleep(EMAIL_FETCH_DELAY_S)

    write_verify_report(verify_rows, args.report)
    print_verify_summary(verify_rows)
    print(f"\nReport written to {args.report.resolve()}")

    if args.check_auto_apply:
        ok, reason = can_auto_apply(bootstrap_rows, verify_rows)
        if ok:
            print(f"\nAuto-apply gate: PASS ({reason})")
            return 0
        print(f"\nAuto-apply gate: BLOCKED ({reason})")
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
