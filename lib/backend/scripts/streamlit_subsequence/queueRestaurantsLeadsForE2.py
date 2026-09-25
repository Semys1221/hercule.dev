#!/usr/bin/env python3
"""Queue specific Restaurants DCE leads on the E2 send list (pipeline step_1)."""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_APP_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_subsequence"
_SCRIPTS_DIR = Path(__file__).resolve().parent
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"
_BACKEND_DIR = _REPO_ROOT / "lib" / "backend"

if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))
if str(_SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRAPER_DIR))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402

from bootstrapPipelineFromUnibox import (  # noqa: E402
    LeadBootstrapRow,
    apply_row,
    build_lead_row,
)
from send_queue import QueueLead, suggest_flow_for_lead  # noqa: E402
from supabase_repo import (  # noqa: E402
    get_pipeline_step,
    has_sent_event,
    list_sent_flows,
    upsert_pipeline_step,
)
from send_queue import idempotency_key  # noqa: E402

CAMPAIGN_ID = "e4f11e76-717e-4be9-a6ad-c7f0a331afb7"
INTERESTED_STATUS = 1

DEFAULT_EMAILS = (
    "leportlachaume@gmail.com",
    "contact@novacafe.fr",
    "contact@olasytapas.fr",
    "hello@tetedail.com",
)

EMAIL_DELAY_S = 0.25


@dataclass
class LeadReport:
    email: str
    in_campaign: bool = False
    interest_status: int | None = None
    step_before: str | None = None
    step_after: str | None = None
    sent_flows: list[str] = field(default_factory=list)
    proposed_step: str = ""
    status: str = ""
    notes: str = ""


def _normalize_emails(values: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in values:
        email = raw.strip().lower()
        if not email or "@" not in email or email in seen:
            continue
        seen.add(email)
        out.append(email)
    return out


def _has_e1_recorded(campaign_id: str, email: str, flows: list[str]) -> bool:
    if "interested_email1" in flows:
        return True
    return has_sent_event(idempotency_key("interested_email1", campaign_id, email))


def _trigger_e1_backfill(emails: list[str]) -> None:
    if not emails:
        return
    contacts = ",".join(emails)
    cmd = [
        "pnpm",
        "exec",
        "tsx",
        "--env-file=.env",
        "./lib/backend/scripts/instantly-bypass/backfillInterestedMissingResponses.ts",
        "--",
        f"--campaign-id={CAMPAIGN_ID}",
        f"--contacts={contacts}",
    ]
    subprocess.run(cmd, cwd=_REPO_ROOT, check=True)


def _ensure_in_campaign(
    client: InstantlyClient,
    email: str,
    *,
    apply: bool,
) -> dict[str, Any] | None:
    lead = client.find_lead_by_email_in_campaign(CAMPAIGN_ID, email)
    if lead:
        return lead
    if not apply:
        return None
    client.push_leads_to_campaign(
        campaign_id=CAMPAIGN_ID,
        leads=[{"email": email}],
    )
    time.sleep(EMAIL_DELAY_S)
    return client.find_lead_by_email_in_campaign(CAMPAIGN_ID, email)


def _ensure_interested(
    client: InstantlyClient,
    email: str,
    lead: dict[str, Any],
    *,
    apply: bool,
) -> int | None:
    status_raw = lead.get("lt_interest_status")
    try:
        status = int(status_raw) if status_raw is not None else None
    except (TypeError, ValueError):
        status = None
    if status == INTERESTED_STATUS:
        return status
    if not apply:
        return status
    client.update_interest_status(
        lead_email=email,
        interest_value=INTERESTED_STATUS,
        campaign_id=CAMPAIGN_ID,
    )
    time.sleep(EMAIL_DELAY_S)
    refreshed = client.find_lead_by_email_in_campaign(CAMPAIGN_ID, email)
    if refreshed:
        raw = refreshed.get("lt_interest_status")
        try:
            return int(raw) if raw is not None else INTERESTED_STATUS
        except (TypeError, ValueError):
            return INTERESTED_STATUS
    return INTERESTED_STATUS


def _classify_status(row: LeadBootstrapRow, campaign_id: str) -> str:
    flows = sorted(row.merged_flows | set(row.existing_flows))
    if "interested_email2" in flows or row.proposed_step in ("step_2", "step_3", "step_4"):
        return "already_e2"
    if row.replied_since_send or row.proposed_step == "replies_to_handle":
        return "replied"
    if not _has_e1_recorded(campaign_id, row.email, flows):
        return "needs_e1"
    return "queued_e2"


def _force_e2_queue_step(campaign_id: str, email: str, flows: list[str]) -> None:
    if "interested_email2" in flows:
        return
    if not _has_e1_recorded(campaign_id, email, flows):
        return
    upsert_pipeline_step(campaign_id, email, "step_1")


def process_lead(
    client: InstantlyClient,
    email: str,
    *,
    apply: bool,
) -> LeadReport:
    report = LeadReport(email=email)
    report.step_before = get_pipeline_step(CAMPAIGN_ID, email)

    lead = _ensure_in_campaign(client, email, apply=apply)
    report.in_campaign = lead is not None
    if not lead:
        report.status = "missing_campaign"
        report.notes = "not in campaign (dry-run or push failed)"
        report.step_after = report.step_before
        return report

    report.interest_status = _ensure_interested(client, email, lead, apply=apply)
    if report.interest_status != INTERESTED_STATUS:
        report.status = "not_interested"
        report.notes = f"interest_status={report.interest_status}"
        report.step_after = report.step_before
        return report

    if apply and report.step_before is None:
        upsert_pipeline_step(CAMPAIGN_ID, email, "step_0")

    lead = client.find_lead_by_email_in_campaign(CAMPAIGN_ID, email) or lead
    row = build_lead_row(
        client,
        lead=lead,
        campaign_id=CAMPAIGN_ID,
        overwrite=False,
    )
    report.sent_flows = sorted(row.merged_flows | set(row.existing_flows))
    report.proposed_step = row.proposed_step
    report.status = _classify_status(row, CAMPAIGN_ID)

    if apply:
        if report.status == "needs_e1":
            report.notes = "scheduling E1 via backfill-interested-missing-responses"
        elif report.status == "queued_e2":
            apply_row(row, campaign_id=CAMPAIGN_ID)
            _force_e2_queue_step(CAMPAIGN_ID, email, report.sent_flows)
            refreshed = build_lead_row(
                client,
                lead=client.find_lead_by_email_in_campaign(CAMPAIGN_ID, email) or lead,
                campaign_id=CAMPAIGN_ID,
                overwrite=False,
            )
            report.sent_flows = sorted(
                refreshed.merged_flows | set(refreshed.existing_flows)
            )
            _force_e2_queue_step(CAMPAIGN_ID, email, report.sent_flows)
        elif report.status == "already_e2":
            apply_row(row, campaign_id=CAMPAIGN_ID)
        elif report.status == "replied":
            apply_row(row, campaign_id=CAMPAIGN_ID)

    report.step_after = get_pipeline_step(CAMPAIGN_ID, email)
    return report


def _verify_suggest_flow(email: str, step: str | None, sent_flows: list[str]) -> str | None:
    if step is None:
        return None
    lead_row = QueueLead(
        lead_id="",
        email=email,
        first_name="",
        interest_label="Interested",
        last_sent_at=None,
        replied_since_last_send=False,
        missing_reservation_link=False,
        sent_flows=sent_flows,
        step=step,  # type: ignore[arg-type]
        envoyer=True,
    )
    return suggest_flow_for_lead(lead_row)


def print_report_table(reports: list[LeadReport]) -> None:
    print("\n=== Restaurants DCE — E2 queue report ===")
    print(
        "email | campaign | interest | step_before | step_after | flows | "
        "suggest_flow | status"
    )
    for row in reports:
        suggest = _verify_suggest_flow(row.email, row.step_after, row.sent_flows)
        print(
            f"{row.email} | {row.in_campaign} | {row.interest_status} | "
            f"{row.step_before or '-'} | {row.step_after or '-'} | "
            f"{','.join(row.sent_flows) or '-'} | {suggest or '-'} | {row.status}"
            + (f" ({row.notes})" if row.notes else "")
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Queue Restaurants DCE leads for E2")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write Instantly + Supabase changes (default: dry-run)",
    )
    parser.add_argument(
        "--email",
        action="append",
        default=[],
        help="Lead email (repeatable); defaults to built-in list of 4",
    )
    return parser.parse_args()


def main() -> int:
    load_dotenv(_REPO_ROOT / ".env")
    args = parse_args()
    emails = _normalize_emails(args.email or list(DEFAULT_EMAILS))
    if not emails:
        print("No emails to process", file=sys.stderr)
        return 1

    api_key = get_api_key()
    if not api_key:
        print("INSTANTLY_API_KEY is required", file=sys.stderr)
        return 1

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] campaign={CAMPAIGN_ID} leads={len(emails)}")

    client = InstantlyClient(api_key)
    reports: list[LeadReport] = []
    needs_e1: list[str] = []

    for email in emails:
        print(f"\n— {email}")
        report = process_lead(client, email, apply=args.apply)
        reports.append(report)
        if report.status == "needs_e1":
            needs_e1.append(email)
        time.sleep(EMAIL_DELAY_S)

    if args.apply and needs_e1:
        print(f"\nTriggering E1 backfill for {len(needs_e1)} lead(s)…")
        _trigger_e1_backfill(needs_e1)
        for email in needs_e1:
            lead = client.find_lead_by_email_in_campaign(CAMPAIGN_ID, email)
            if not lead:
                continue
            row = build_lead_row(
                client,
                lead=lead,
                campaign_id=CAMPAIGN_ID,
                overwrite=False,
            )
            if _classify_status(row, CAMPAIGN_ID) == "queued_e2":
                apply_row(row, campaign_id=CAMPAIGN_ID)
                flows = sorted(row.merged_flows | set(row.existing_flows))
                _force_e2_queue_step(CAMPAIGN_ID, email, flows)
            for report in reports:
                if report.email == email:
                    report.sent_flows = sorted(
                        row.merged_flows | set(row.existing_flows)
                    )
                    report.step_after = get_pipeline_step(CAMPAIGN_ID, email)
                    report.status = _classify_status(row, CAMPAIGN_ID)
                    report.notes = "E1 backfill triggered"

    print_report_table(reports)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
