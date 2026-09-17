#!/usr/bin/env python3
"""Audit AI Reply Agent health — failures, abstentions, slow pending, Instantly backlog."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_REPLY_DIR = _REPO_ROOT / "app" / "streamlit_reply_agent"
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"
_REPORTS_DIR = Path(__file__).resolve().parent / "reports"

for path in (str(_REPO_ROOT), str(_REPLY_DIR), str(_SCRAPER_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")


def _cluster_abstention_reasons(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        reason = str(row.get("ai_reason") or "null")[:160]
        counts[reason] += 1
    return dict(sorted(counts.items(), key=lambda item: -item[1]))


def _status_rollup(inbound: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    by_campaign: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for row in inbound:
        cid = str(row.get("campaign_id") or "")
        status = str(row.get("ai_status") or "unknown")
        by_campaign[cid][status] += 1
    return dict(by_campaign)


def _audit_instantly_slow(
    *,
    campaign_id: str,
    niche_preset_id: str,
    stale_hours: int,
) -> list[dict[str, Any]]:
    from config import require_instantly_api_key
    from lead_tags import build_interest_index
    from pending_fetch import (
        enrich_pending_rows,
        fetch_pending_emails,
        is_reply_over_24h,
    )
    from shared.instantly_client import InstantlyClient

    client = InstantlyClient(require_instantly_api_key())
    rows = fetch_pending_emails(client, campaign_id=campaign_id)
    interest_index = build_interest_index(client, campaign_id)
    rows = enrich_pending_rows(client, interest_index, campaign_id, rows)
    slow = [r for r in rows if is_reply_over_24h(r.last_reply_at)]
    return [
        {
            "campaign_id": campaign_id,
            "niche_preset_id": niche_preset_id,
            "lead_email": row.lead_email,
            "last_reply_at": row.last_reply_at,
            "stale_hours": stale_hours,
        }
        for row in slow
    ]


def run_audit(
    *,
    include_instantly: bool = True,
    focus_niches: list[str] | None = None,
) -> dict[str, Any]:
    from supabase_repo import get_client

    sb = get_client()
    configs = (
        sb.table("ai_reply_agent_config")
        .select("campaign_id, niche_preset_id, status, target_type")
        .execute()
        .data
        or []
    )
    config_by_id = {str(c["campaign_id"]): c for c in configs}

    inbound = (
        sb.table("ai_reply_agent_messages")
        .select("campaign_id, ai_status, direction, lead_email, ai_reason, created_at")
        .eq("direction", "inbound")
        .execute()
        .data
        or []
    )

    failed = [r for r in inbound if r.get("ai_status") == "failed"]
    skipped = [r for r in inbound if r.get("ai_status") == "skipped_unsafe"]
    skipped_recovery = [r for r in inbound if r.get("ai_status") == "skipped_recovery"]
    pending = [r for r in inbound if r.get("ai_status") == "pending"]

    stale_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    stale_pending = []
    for row in pending:
        created = str(row.get("created_at") or "")
        try:
            parsed = datetime.fromisoformat(created.replace("Z", "+00:00"))
        except ValueError:
            continue
        if parsed <= stale_cutoff:
            stale_pending.append(row)

    failed_jobs = (
        sb.table("ai_reply_agent_jobs")
        .select("*")
        .eq("status", "failed")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
        .data
        or []
    )

    instantly_slow: list[dict[str, Any]] = []
    if include_instantly:
        active = [c for c in configs if c.get("status") == "waiting_for_replies"]
        if focus_niches:
            active = [
                c
                for c in active
                if str(c.get("niche_preset_id") or "") in focus_niches
            ]
        for cfg in active:
            cid = str(cfg.get("campaign_id") or "")
            preset = str(cfg.get("niche_preset_id") or "")
            try:
                instantly_slow.extend(
                    _audit_instantly_slow(
                        campaign_id=cid,
                        niche_preset_id=preset,
                        stale_hours=24,
                    )
                )
            except Exception as exc:
                instantly_slow.append(
                    {
                        "campaign_id": cid,
                        "niche_preset_id": preset,
                        "error": str(exc),
                    }
                )

    reprocess_candidates = [
        r
        for r in inbound
        if r.get("ai_status") in ("skipped_unsafe", "skipped_recovery", "skipped_not_interested")
        and str(r.get("ai_reason") or "") not in (
            "Opt-out détecté",
            "Lead marked No show in Instantly",
        )
    ]

    report: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "campaigns": len(configs),
        "inbound_total": len(inbound),
        "reprocess_candidates_count": len(reprocess_candidates),
        "status_by_campaign": _status_rollup(inbound),
        "failed_recent": failed[-20:],
        "skipped_recovery_count": len(skipped_recovery),
        "recovery_gate_clusters": _cluster_abstention_reasons(skipped_recovery),
        "abstention_clusters": _cluster_abstention_reasons(skipped),
        "stale_pending": stale_pending,
        "failed_jobs": failed_jobs,
        "instantly_slow_pending": instantly_slow,
        "config_index": {
            cid: {
                "niche_preset_id": cfg.get("niche_preset_id"),
                "status": cfg.get("status"),
                "target_type": cfg.get("target_type"),
            }
            for cid, cfg in config_by_id.items()
        },
    }
    return report


def _print_summary(report: dict[str, Any]) -> None:
    print(f"Generated: {report.get('generated_at')}")
    print(f"Campaigns: {report.get('campaigns')} | Inbound messages: {report.get('inbound_total')}")
    print(f"Recovery gate (skipped_recovery): {report.get('skipped_recovery_count', 0)}")
    print(f"Reprocess candidates: {report.get('reprocess_candidates_count', 0)}")
    print(f"Stale pending (>24h): {len(report.get('stale_pending') or [])}")
    print(f"Failed jobs: {len(report.get('failed_jobs') or [])}")
    print(f"Instantly slow pending: {len(report.get('instantly_slow_pending') or [])}")

    print("\n--- Status by campaign (top niches) ---")
    for cid, statuses in list((report.get("status_by_campaign") or {}).items())[:8]:
        preset = (report.get("config_index") or {}).get(cid, {}).get("niche_preset_id", "?")
        parts = ", ".join(f"{k}={v}" for k, v in sorted(statuses.items(), key=lambda x: -x[1]))
        print(f"  {preset} ({cid[:8]}…): {parts}")

    recovery_clusters = report.get("recovery_gate_clusters") or {}
    if recovery_clusters:
        print("\n--- Top recovery gate reasons ---")
        for reason, count in list(recovery_clusters.items())[:10]:
            print(f"  [{count}] {reason[:100]}")

    clusters = report.get("abstention_clusters") or {}
    if clusters:
        print("\n--- Top abstention reasons ---")
        for reason, count in list(clusters.items())[:10]:
            print(f"  [{count}] {reason[:100]}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit AI Reply Agent health")
    parser.add_argument(
        "--no-instantly",
        action="store_true",
        help="Skip Instantly Unibox slow-pending scan",
    )
    parser.add_argument(
        "--focus",
        nargs="*",
        help="Only scan Instantly for these niche_preset_id values",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        help="Write full JSON report to this path (default: scripts/.../reports/)",
    )
    args = parser.parse_args()

    report = run_audit(
        include_instantly=not args.no_instantly,
        focus_niches=args.focus,
    )
    _print_summary(report)

    out_path = args.json_out
    if out_path is None:
        _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_path = _REPORTS_DIR / f"reply-agent-health-{stamp}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nFull report: {out_path}")


if __name__ == "__main__":
    main()
