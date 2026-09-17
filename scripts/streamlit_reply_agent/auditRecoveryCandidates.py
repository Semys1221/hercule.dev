#!/usr/bin/env python3
"""Dry-run Grok recovery gate on all eligible skipped inbound (no send)."""

from __future__ import annotations

import argparse
import json
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_REPLY_DIR = _REPO_ROOT / "app" / "streamlit_reply_agent"
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"

for path in (str(_REPO_ROOT), str(_SCRAPER_DIR), str(_REPLY_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

DEFAULT_STATUSES = ("skipped_unsafe", "skipped_recovery", "skipped_not_interested")
EXCLUDE_REASONS = {"Opt-out détecté", "Lead marked No show in Instantly"}


def _fetch_deduped_rows(since_days: int, exclude_emails: set[str]) -> list[dict[str, Any]]:
    from supabase_repo import get_client

    since = datetime.now(timezone.utc) - timedelta(days=since_days)
    configs = {
        c["campaign_id"]: c
        for c in (
            get_client()
            .table("ai_reply_agent_config")
            .select("campaign_id,niche_preset_id,target_type")
            .execute()
            .data
            or []
        )
    }

    rows = (
        get_client()
        .table("ai_reply_agent_messages")
        .select("*")
        .eq("direction", "inbound")
        .in_("ai_status", list(DEFAULT_STATUSES))
        .gte("created_at", since.isoformat())
        .order("created_at", desc=True)
        .limit(5000)
        .execute()
        .data
        or []
    )
    rows = [
        r
        for r in rows
        if r.get("campaign_id") in configs
        and str(r.get("ai_reason") or "") not in EXCLUDE_REASONS
    ]

    outbound_keys = {
        (o["campaign_id"], str(o["lead_email"]).lower())
        for o in (
            get_client()
            .table("ai_reply_agent_messages")
            .select("campaign_id,lead_email")
            .eq("direction", "outbound")
            .gte("created_at", since.isoformat())
            .limit(5000)
            .execute()
            .data
            or []
        )
    }

    latest: dict[tuple[str, str], dict[str, Any]] = {}
    for row in rows:
        email = str(row.get("lead_email") or "").lower()
        if email in exclude_emails:
            continue
        key = (str(row["campaign_id"]), email)
        if key in outbound_keys:
            continue
        if key not in latest:
            latest[key] = row

    return list(latest.values())


def _audit_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    from agent_preview import generate_reply_preview
    from config import require_instantly_api_key
    from lead_relances import detect_opt_out
    from lead_tags import build_interest_index, interest_label, lookup_lead_interest
    from reply_gate import apply_reply_gate, is_recovery_interest_tag
    from shared.instantly_client import InstantlyClient
    from supabase_repo import get_config

    by_campaign: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_campaign[str(row["campaign_id"])].append(row)

    inst = InstantlyClient(require_instantly_api_key())
    items: list[dict[str, Any]] = []
    errors = 0

    for campaign_id, campaign_rows in sorted(by_campaign.items()):
        config = get_config(campaign_id)
        if not config:
            continue
        interest_index = build_interest_index(inst, campaign_id)
        for row in campaign_rows:
            lead_email = str(row.get("lead_email") or "").lower()
            body = str(row.get("body_text") or "")
            item: dict[str, Any] = {
                "message_id": row.get("id"),
                "campaign_id": campaign_id,
                "lead_email": lead_email,
                "old_status": row.get("ai_status"),
                "old_reason": row.get("ai_reason"),
            }
            if detect_opt_out(body):
                item.update({"action": "opt_out", "allow_reply": False})
                items.append(item)
                continue
            try:
                interest = lookup_lead_interest(inst, campaign_id, lead_email, interest_index)
                preview = generate_reply_preview(
                    config,
                    body,
                    lead_email,
                    interest_label=interest_label(interest),
                )
                gate = apply_reply_gate(interest, preview)
                item.update(
                    {
                        "interest_status": interest,
                        "is_recovery_tag": is_recovery_interest_tag(interest),
                        "should_reply": preview.get("should_reply"),
                        "recovery_confidence": preview.get("recovery_confidence"),
                        "allow_reply": gate["allow_reply"],
                        "new_status": gate["ai_status"],
                        "new_reason": gate["reason"],
                        "action": "dry_run",
                    }
                )
            except Exception as exc:  # noqa: BLE001
                errors += 1
                item.update({"action": "error", "error": str(exc)[:300], "allow_reply": False})
            items.append(item)

    allow = [i for i in items if i.get("allow_reply")]
    recovery_allow = [i for i in allow if i.get("is_recovery_tag")]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_leads": len(items),
        "allow_reply": len(allow),
        "recovery_allow_reply": len(recovery_allow),
        "errors": errors,
        "by_old_status": _count(items, "old_status"),
        "by_new_status": _count(items, "new_status"),
        "by_campaign": _count(items, "campaign_id"),
        "items": items,
    }


def _count(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for item in items:
        counts[str(item.get(key) or "unknown")] += 1
    return dict(sorted(counts.items(), key=lambda kv: -kv[1]))


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit recovery candidates (dry-run Grok)")
    parser.add_argument("--since-days", type=int, default=30)
    parser.add_argument("--exclude-emails", nargs="*", default=["alexandredabin@gmail.com"])
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    exclude = {e.strip().lower() for e in args.exclude_emails if e.strip()}
    rows = _fetch_deduped_rows(args.since_days, exclude)
    print(f"Auditing {len(rows)} deduped lead(s) (dry-run, no send)...")
    started = time.time()
    report = _audit_rows(rows)
    report["duration_seconds"] = round(time.time() - started, 1)

    out = args.json_out
    if out is None:
        out = (
            Path(__file__).resolve().parent
            / "reports"
            / f"recovery-audit-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
        )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Report: {out}")
    print(f"Total leads audited: {report['total_leads']}")
    print(f"Would allow_reply (send candidates): {report['allow_reply']}")
    print(f"Recovery-tagged allow_reply: {report['recovery_allow_reply']}")
    print(f"Errors: {report['errors']}")
    print(f"Duration: {report['duration_seconds']}s")


if __name__ == "__main__":
    main()
