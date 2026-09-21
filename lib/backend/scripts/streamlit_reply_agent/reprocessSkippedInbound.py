#!/usr/bin/env python3
"""Re-run Grok on historical skipped inbound messages (read-only by default)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_REPLY_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_reply_agent"
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"
for path in (str(_REPO_ROOT), str(_SCRAPER_DIR), str(_REPLY_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

DEFAULT_STATUSES = ("skipped_unsafe", "skipped_recovery", "skipped_not_interested")
NO_SHOW_REASON = "Lead marked No show in Instantly"
OPT_OUT_REASON = "Opt-out détecté"


def _fetch_rows(
    campaign_id: str,
    statuses: tuple[str, ...],
    since: datetime,
    contacts: set[str],
    limit: int,
) -> list[dict[str, Any]]:
    from supabase_repo import get_client

    query = (
        get_client()
        .table("ai_reply_agent_messages")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("direction", "inbound")
        .in_("ai_status", list(statuses))
        .gte("created_at", since.isoformat())
        .order("created_at", desc=True)
    )
    if contacts:
        query = query.in_("lead_email", sorted(contacts))
    resp = query.limit(limit * 3 if contacts else limit).execute()
    rows = resp.data or []
    filtered = [
        row
        for row in rows
        if str(row.get("ai_reason") or "") not in (OPT_OUT_REASON, NO_SHOW_REASON)
    ]
    return filtered[:limit]


def _has_outbound_for_inbound(campaign_id: str, lead_email: str, inbound_id: str) -> bool:
    from supabase_repo import get_client

    outbound = (
        get_client()
        .table("ai_reply_agent_messages")
        .select("id")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.lower())
        .eq("direction", "outbound")
        .gte("created_at", datetime.now(timezone.utc) - timedelta(days=30))
        .limit(1)
        .execute()
        .data
        or []
    )
    return bool(outbound)


def reprocess_rows(
    campaign_id: str,
    config: dict[str, Any],
    rows: list[dict[str, Any]],
    *,
    execute: bool = False,
    send: bool = False,
) -> list[dict[str, Any]]:
    from agent_preview import generate_reply_preview
    from config import require_instantly_api_key
    from inbox import dispatch_manual_reply
    from lead_relances import detect_opt_out, stop_all_lead_relances
    from lead_tags import build_interest_index, interest_label, lookup_lead_interest
    from pipeline_sync import sync_pipeline_step_from_sent_flows
    from lead_tags import INTERESTED_STATUS
    from reply_gate import apply_reply_gate, is_recovery_interest_tag
    from shared.instantly_client import InstantlyClient
    from supabase_repo import update_message_status

    inst = InstantlyClient(require_instantly_api_key())
    interest_index = build_interest_index(inst, campaign_id)
    report: list[dict[str, Any]] = []

    for row in rows:
        message_id = str(row.get("id") or "")
        lead_email = str(row.get("lead_email") or "").lower()
        body = str(row.get("body_text") or "")
        old_status = str(row.get("ai_status") or "")
        item: dict[str, Any] = {
            "message_id": message_id,
            "lead_email": lead_email,
            "old_status": old_status,
            "old_reason": row.get("ai_reason"),
        }

        if detect_opt_out(body):
            item["action"] = "opt_out"
            if execute:
                stop_all_lead_relances(
                    lead_email=lead_email,
                    campaign_id=campaign_id,
                    reason="opt-out reprocess",
                    dry_run=False,
                )
                update_message_status(
                    message_id,
                    "skipped_not_interested",
                    OPT_OUT_REASON,
                )
            report.append(item)
            continue

        interest = lookup_lead_interest(inst, campaign_id, lead_email, interest_index)
        label = interest_label(interest)
        preview = generate_reply_preview(
            config,
            body,
            lead_email,
            interest_label=label,
        )
        gate = apply_reply_gate(interest, preview)
        item.update(
            {
                "interest_status": interest,
                "should_reply": preview.get("should_reply"),
                "recovery_confidence": preview.get("recovery_confidence"),
                "allow_reply": gate["allow_reply"],
                "new_status": gate["ai_status"],
                "new_reason": gate["reason"],
                "model": preview.get("model"),
                "draft_preview": (preview.get("reply_text") or "")[:200],
            }
        )

        if not execute:
            item["action"] = "dry_run"
            report.append(item)
            continue

        update_message_status(
            message_id,
            gate["ai_status"],
            gate["reason"],
            groq_model=str(preview.get("model") or "") or None,
            recovery_confidence=preview.get("recovery_confidence"),
            groq_cost_usd_ticks=preview.get("cost_usd_ticks"),
        )

        if gate["allow_reply"] and send and preview.get("reply_text"):
            if _has_outbound_for_inbound(campaign_id, lead_email, message_id):
                item["action"] = "skipped_send_existing_outbound"
            else:
                dispatch_manual_reply(
                    inst,
                    campaign_id=campaign_id,
                    inbound=row,
                    reply_text=str(preview["reply_text"]),
                    target_type=str(config.get("target_type") or "buyer"),
                )
                if is_recovery_interest_tag(interest):
                    try:
                        inst.update_interest_status(
                            lead_email=lead_email,
                            interest_value=INTERESTED_STATUS,
                            campaign_id=campaign_id,
                        )
                        item["retagged_interested"] = True
                    except Exception as exc:  # noqa: BLE001
                        item["retagged_interested"] = False
                        item["retag_error"] = str(exc)
                sync_pipeline_step_from_sent_flows(campaign_id, lead_email)
                item["action"] = "sent"
        else:
            item["action"] = "updated_status"

        report.append(item)

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Reprocess skipped inbound reply-agent messages")
    parser.add_argument("--campaign-id", required=True)
    parser.add_argument("--status", default=",".join(DEFAULT_STATUSES))
    parser.add_argument("--since-days", type=int, default=30)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--contacts", nargs="*", default=[])
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    from supabase_repo import get_config

    config = get_config(args.campaign_id)
    if not config:
        print("Campaign config not found", file=sys.stderr)
        sys.exit(1)

    since = datetime.now(timezone.utc) - timedelta(days=args.since_days)
    statuses = tuple(s.strip() for s in args.status.split(",") if s.strip())
    contacts = {c.strip().lower() for c in args.contacts if c.strip()}
    rows = _fetch_rows(args.campaign_id, statuses, since, contacts, args.limit)
    print(f"Found {len(rows)} inbound row(s) to reprocess")

    execute = args.execute
    report = reprocess_rows(
        args.campaign_id,
        config,
        rows,
        execute=execute,
        send=args.send and execute,
    )

    out_path = args.json_out
    if out_path is None:
        out_path = (
            Path(__file__).resolve().parent
            / "reports"
            / f"reprocess-skipped-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
        )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Report: {out_path}")
    allow = sum(1 for item in report if item.get("allow_reply"))
    print(f"Candidates allow_reply={allow} / {len(report)}")


if __name__ == "__main__":
    main()
