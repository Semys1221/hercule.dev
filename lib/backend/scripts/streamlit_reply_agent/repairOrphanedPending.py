#!/usr/bin/env python3
"""Repair inbound messages stuck at ai_status=pending (webhook interrupted mid-flight)."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_REPLY_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_reply_agent"
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"

for path in (str(_REPO_ROOT), str(_REPLY_DIR), str(_SCRAPER_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")


def _parse_ts(value: str) -> datetime | None:
    raw = (value or "").strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = f"{raw[:-1]}+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _classify_orphan(
    row: dict[str, Any],
    *,
    interest_status: int | None,
    has_outbound: bool,
) -> str:
    body = str(row.get("body_text") or "").lower()
    if has_outbound:
        return "fix_status_only"
    if any(
        phrase in body
        for phrase in (
            "n'est plus disponible",
            "no longer available",
            "out of office",
            "absence du bureau",
        )
    ):
        return "mark_ooo"
    if interest_status == -4:
        return "mark_no_show"
    return "retry_grok_send"


def list_orphans(
    campaign_id: str,
    *,
    min_age_hours: int = 1,
) -> list[dict[str, Any]]:
    from config import require_instantly_api_key
    from lead_tags import build_interest_index, lookup_lead_interest
    from shared.instantly_client import InstantlyClient
    from supabase_repo import get_client

    sb = get_client()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=min_age_hours)
    pending = (
        sb.table("ai_reply_agent_messages")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("direction", "inbound")
        .eq("ai_status", "pending")
        .execute()
        .data
        or []
    )

    inst = InstantlyClient(require_instantly_api_key())
    interest_index = build_interest_index(inst, campaign_id)
    orphans: list[dict[str, Any]] = []

    for row in pending:
        created = _parse_ts(str(row.get("created_at") or ""))
        if created and created > cutoff:
            continue
        email = str(row.get("lead_email") or "").lower()
        outbound = (
            sb.table("ai_reply_agent_messages")
            .select("id, ai_status")
            .eq("campaign_id", campaign_id)
            .eq("lead_email", email)
            .eq("direction", "outbound")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
            or []
        )
        interest = lookup_lead_interest(inst, campaign_id, email, interest_index)
        action = _classify_orphan(
            row,
            interest_status=interest,
            has_outbound=bool(outbound),
        )
        orphans.append(
            {
                "message_id": row.get("id"),
                "lead_email": email,
                "created_at": row.get("created_at"),
                "interest_status": interest,
                "action": action,
                "body_preview": str(row.get("body_text") or "")[:120],
                "outbound_status": outbound[0].get("ai_status") if outbound else None,
            }
        )
    return orphans


def repair_orphans(
    campaign_id: str,
    config: dict[str, Any],
    orphans: list[dict[str, Any]],
    *,
    dry_run: bool = True,
    send: bool = False,
) -> None:
    from agent_preview import generate_reply_preview
    from config import require_instantly_api_key
    from inbox import dispatch_manual_reply
    from lead_tags import interest_label
    from shared.instantly_client import InstantlyClient
    from supabase_repo import get_client, update_message_status

    sb = get_client()
    inst = InstantlyClient(require_instantly_api_key())

    for item in orphans:
        email = item["lead_email"]
        action = item["action"]
        message_id = str(item["message_id"])
        print(f"\n{email} → {action}")

        if action == "fix_status_only":
            new_status = str(item.get("outbound_status") or "auto_replied")
            print(f"  set inbound status → {new_status}")
            if not dry_run:
                update_message_status(
                    message_id,
                    new_status,
                    "Repaired: outbound already sent",
                )
            continue

        if action == "mark_no_show":
            print("  set inbound status → skipped_not_interested (No show)")
            if not dry_run:
                update_message_status(
                    message_id,
                    "skipped_not_interested",
                    "Lead marked No show in Instantly",
                )
            continue

        if action == "mark_ooo":
            print("  set inbound status → skipped_ooo")
            if not dry_run:
                update_message_status(
                    message_id,
                    "skipped_ooo",
                    "Auto-reply / bounce detected on repair",
                )
            continue

        inbound = (
            sb.table("ai_reply_agent_messages")
            .select("*")
            .eq("id", message_id)
            .maybe_single()
            .execute()
        )
        body = ""
        if inbound and inbound.data:
            body = str(inbound.data.get("body_text") or "")
        label = interest_label(item.get("interest_status"))
        preview = generate_reply_preview(
            config,
            body,
            email,
            interest_label=label,
        )
        from reply_gate import apply_reply_gate

        gate = apply_reply_gate(item.get("interest_status"), preview)
        reply_text = str(preview.get("reply_text") or "").strip()
        reason = gate["reason"] or str(preview.get("reason") or "")
        print(
            f"  grok allow_reply={gate['allow_reply']} "
            f"status={gate['ai_status']} reason={reason[:80]}"
        )
        if reply_text:
            print(f"  draft: {reply_text[:100]}…")

        if not gate["allow_reply"]:
            print(f"  set inbound status → {gate['ai_status']}")
            if not dry_run:
                update_message_status(message_id, gate["ai_status"], reason)
            continue

        if dry_run or not send:
            print("  (dry-run — not sending)")
            continue

        from pipeline_sync import sync_pipeline_step_from_sent_flows

        result = dispatch_manual_reply(
            inst,
            campaign_id=campaign_id,
            inbound=inbound.data if inbound else {"id": message_id, "lead_email": email},
            reply_text=reply_text,
            target_type=str(config.get("target_type") or "buyer"),
        )
        sync_pipeline_step_from_sent_flows(campaign_id, email)
        print(f"  send: {result}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Repair orphaned pending inbound messages")
    parser.add_argument("--campaign-id", required=True)
    parser.add_argument("--min-age-hours", type=int, default=1)
    parser.add_argument("--dry-run", action="store_true", default=True)
    parser.add_argument("--execute", action="store_true", help="Apply status fixes and Grok")
    parser.add_argument("--send", action="store_true", help="Also send replies (requires --execute)")
    args = parser.parse_args()

    from supabase_repo import get_config

    config = get_config(args.campaign_id)
    if not config:
        print("Error: campaign config not found", file=sys.stderr)
        sys.exit(1)

    orphans = list_orphans(args.campaign_id, min_age_hours=args.min_age_hours)
    print(f"Found {len(orphans)} orphaned pending inbound(s)")
    for item in orphans:
        print(
            f"  {item['lead_email']} | interest={item['interest_status']} | "
            f"action={item['action']} | {item['body_preview'][:60]}"
        )

    dry_run = not args.execute
    repair_orphans(
        args.campaign_id,
        config,
        orphans,
        dry_run=dry_run,
        send=args.send and args.execute,
    )


if __name__ == "__main__":
    main()
