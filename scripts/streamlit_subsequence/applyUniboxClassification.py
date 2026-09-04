#!/usr/bin/env python3
"""Apply agent-classified Unibox steps to Supabase pipeline + events."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402


from send_queue import idempotency_key, lead_has_replied_since  # noqa: E402
from supabase_repo import (  # noqa: E402
    get_pipeline_step,
    has_sent_event,
    record_event,
    upsert_pipeline_step,
)
from unibox_classify import INTERESTED_FLOWS, NO_SHOW_FLOWS  # noqa: E402

DEFAULT_EXPORT_DIR = _REPO_ROOT / "tmp" / "unibox_export"
DEFAULT_REPORT = Path("classification_apply_report.csv")
STEPS = ("step_0", "step_1", "step_2", "step_3")
REPLY_ELIGIBLE = {"step_1", "step_2", "step_3"}


def _load_classified(export_dir: Path) -> tuple[str, list[dict[str, Any]]]:
    manifest_path = export_dir / "manifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Missing {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    campaign_id = str(manifest["campaign_id"])

    rows: list[dict[str, Any]] = []
    seen: set[str] = set()

    for step in STEPS:
        path = export_dir / "classified" / f"{step}.json"
        if not path.is_file():
            raise FileNotFoundError(f"Missing {path}")

        for entry in json.loads(path.read_text(encoding="utf-8")):
            email = str(entry.get("email") or "").strip().lower()
            if not email:
                raise ValueError(f"Empty email in {path}")
            if email in seen:
                raise ValueError(f"Duplicate email across step files: {email}")
            seen.add(email)
            rows.append({**entry, "step": step, "email": email})

    index_path = export_dir / "index.json"
    if index_path.is_file():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        index_emails = {str(e["email"]).lower() for e in index}
        missing = index_emails - seen
        extra = seen - index_emails
        if missing:
            raise ValueError(f"Leads in index but not classified: {sorted(missing)[:5]}…")
        if extra:
            raise ValueError(f"Classified emails not in index: {sorted(extra)[:5]}…")

    return campaign_id, rows


def _validate_flows(entry: dict[str, Any]) -> None:
    allowed = set(INTERESTED_FLOWS) | set(NO_SHOW_FLOWS)
    for flow in entry.get("detected_flows") or []:
        if flow not in allowed:
            raise ValueError(f"Invalid flow {flow} for {entry['email']}")


def _thread_path_for_email(export_dir: Path, email: str) -> Path | None:
    for path in (export_dir / "threads").glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if str(data.get("email") or "").lower() == email.lower():
            return path
    return None


def _last_sent_timestamp(export_dir: Path, email: str) -> str:
    thread_path = _thread_path_for_email(export_dir, email)
    if not thread_path:
        return datetime.now(timezone.utc).isoformat()

    thread = json.loads(thread_path.read_text(encoding="utf-8"))
    last_ts = ""
    for msg in thread.get("messages") or []:
        if msg.get("direction") != "sent":
            continue
        ts = str(msg.get("timestamp") or "")
        if ts > last_ts:
            last_ts = ts
    return last_ts or datetime.now(timezone.utc).isoformat()


def apply_classification(
    *,
    export_dir: Path,
    dry_run: bool,
    detect_replies: bool,
    report_path: Path,
) -> dict[str, int]:
    campaign_id, rows = _load_classified(export_dir)
    for entry in rows:
        _validate_flows(entry)

    client: InstantlyClient | None = None
    if detect_replies and not dry_run:
        api_key = get_api_key()
        if api_key:
            client = InstantlyClient(api_key)

    stats = {"updated": 0, "unchanged": 0, "events_backfilled": 0, "replies": 0}
    report_rows: list[dict[str, Any]] = []

    for entry in rows:
        email = entry["email"]
        new_step = entry["step"]
        if detect_replies and new_step in REPLY_ELIGIBLE and client:
            last_ts = _last_sent_timestamp(export_dir, email)
            if last_ts and lead_has_replied_since(client, email, last_ts):
                new_step = "replies_to_handle"
                stats["replies"] += 1

        old_step = get_pipeline_step(campaign_id, email) or ""

        if old_step != new_step:
            stats["updated"] += 1
            if not dry_run:
                upsert_pipeline_step(campaign_id, email, new_step)
        else:
            stats["unchanged"] += 1

        flows_added: list[str] = []
        for flow in entry.get("detected_flows") or []:
            idem = idempotency_key(flow, campaign_id, email)
            if has_sent_event(idem):
                continue
            flows_added.append(flow)
            if not dry_run:
                record_event(
                    {
                        "idempotency_key": idem,
                        "flow": flow,
                        "campaign_id": campaign_id,
                        "lead_email": email,
                        "lead_id": entry.get("lead_id") or None,
                        "dispatched_at": _last_sent_timestamp(export_dir, email),
                        "status": "sent",
                    }
                )
            stats["events_backfilled"] += 1

        report_rows.append(
            {
                "email": email,
                "old_step": old_step,
                "new_step": new_step,
                "detected_flows": ",".join(entry.get("detected_flows") or []),
                "flows_backfilled": ",".join(flows_added),
                "rationale": entry.get("rationale") or "",
            }
        )

    with report_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "email",
                "old_step",
                "new_step",
                "detected_flows",
                "flows_backfilled",
                "rationale",
            ],
        )
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"\nCampaign: {campaign_id}")
    print(f"  updated: {stats['updated']}")
    print(f"  unchanged: {stats['unchanged']}")
    print(f"  events_backfilled: {stats['events_backfilled']}")
    if detect_replies:
        print(f"  replies_to_handle: {stats['replies']}")
    print(f"  report: {report_path.resolve()}")

    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply classified Unibox steps to Supabase.")
    parser.add_argument(
        "--export-dir",
        type=Path,
        default=DEFAULT_EXPORT_DIR,
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write to Supabase (default: dry-run)",
    )
    parser.add_argument(
        "--detect-replies",
        action="store_true",
        help="Move to replies_to_handle when lead replied after last Hercule send",
    )
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    dry_run = not args.apply
    mode = "DRY-RUN" if dry_run else "APPLY"
    print(f"[{mode}] Reading classified files from {args.export_dir}…")

    try:
        apply_classification(
            export_dir=args.export_dir,
            dry_run=dry_run,
            detect_replies=args.detect_replies,
            report_path=args.report,
        )
    except (FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if dry_run:
        print("\nDry-run complete. Re-run with --apply to write Supabase.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
