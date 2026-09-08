#!/usr/bin/env python3
"""Fetch pending Instantly Unibox replies, run Grok, and optionally send."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"
_REPLY_DIR = _REPO_ROOT / "app" / "streamlit_reply_agent"

for path in (str(_REPO_ROOT), str(_SCRAPER_DIR), str(_REPLY_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")


def _normalize_name(value: str) -> str:
    return " ".join(value.strip().lower().split())


def resolve_campaign_by_name(
    campaigns: list[dict[str, Any]],
    campaign_name: str,
    *,
    hercule_prefix: str,
) -> tuple[str, str]:
    """Return (campaign_id, display_name). Raises ValueError if ambiguous/missing."""
    needle = _normalize_name(campaign_name)
    prefixed = _normalize_name(hercule_prefix)

    exact: list[tuple[str, str]] = []
    prefixed_matches: list[tuple[str, str]] = []
    fuzzy: list[tuple[str, str]] = []

    for campaign in campaigns:
        cid = str(campaign.get("id") or "").strip()
        name = str(campaign.get("name") or "").strip()
        if not cid or not name:
            continue
        normalized = _normalize_name(name)
        if normalized == needle:
            exact.append((cid, name))
        elif normalized == prefixed:
            prefixed_matches.append((cid, name))
        elif needle in normalized or normalized in needle:
            fuzzy.append((cid, name))

    if len(exact) == 1:
        return exact[0]
    if len(exact) > 1:
        raise ValueError(
            f"Multiple exact matches for {campaign_name!r}: "
            + ", ".join(name for _, name in exact)
        )
    if len(prefixed_matches) == 1:
        return prefixed_matches[0]
    if len(prefixed_matches) > 1:
        raise ValueError(
            f"Multiple prefixed matches for {campaign_name!r}: "
            + ", ".join(name for _, name in prefixed_matches)
        )
    if len(fuzzy) == 1:
        return fuzzy[0]
    if len(fuzzy) > 1:
        raise ValueError(
            f"Ambiguous campaign name {campaign_name!r}. Candidates:\n"
            + "\n".join(f"  - {name} ({cid})" for cid, name in fuzzy)
        )
    raise ValueError(f"No Instantly campaign matched {campaign_name!r}")


def _print_bulk_result(label: str, result) -> None:
    print(f"\n{label}:")
    print(f"  succeeded: {len(result.succeeded)}")
    print(f"  skipped:   {len(result.skipped)}")
    print(f"  failed:    {len(result.failed)}")
    for email, reason in result.skipped[:20]:
        print(f"    skip {email}: {reason}")
    if len(result.skipped) > 20:
        print(f"    ... and {len(result.skipped) - 20} more skipped")
    for email, error in result.failed:
        print(f"    fail {email}: {error}")


def _target_type_from_config(config: dict[str, Any]):
    value = str(config.get("target_type") or "").strip().lower()
    if value == "seller":
        return "seller"
    if value == "buyer":
        return "buyer"
    return None


def _emails_with_drafts(campaign_id: str, emails: set[str]) -> set[str]:
    from supabase_repo import get_lead_replies_batch

    replies = get_lead_replies_batch(campaign_id, sorted(emails))
    return {
        email.strip().lower()
        for email in emails
        if replies.get(email.strip().lower(), "").strip()
    }


def run(args: argparse.Namespace) -> int:
    from config import grok_api_key_status, require_instantly_api_key
    from instantly_client import instantly_resource_name
    from lead_tags import TAG_LABELS, build_interest_index, count_by_tag
    from onboarding import validate_campaign_readiness
    from pending_bulk_actions import bulk_send, bulk_try_agent
    from pending_fetch import fetch_pending_replies, filter_rows_by_tag
    from send_window import format_paris_slot, is_within_send_window
    from shared.instantly_client import InstantlyClient, list_all_campaigns
    from supabase_repo import get_config

    if args.try_only and args.send_only:
        print("Error: --try-only and --send-only are mutually exclusive", file=sys.stderr)
        return 1

    grok_ok, grok_hint = grok_api_key_status()
    if not args.dry_run and not args.send_only and not grok_ok:
        print(f"Error: {grok_hint or 'GROK_API_KEY missing'}", file=sys.stderr)
        return 1

    api_key = require_instantly_api_key()
    instantly_client = InstantlyClient(api_key)

    campaign_id, campaign_display = resolve_campaign_by_name(
        list_all_campaigns(),
        args.campaign_name,
        hercule_prefix=instantly_resource_name(args.campaign_name),
    )
    print(f"Campaign: {campaign_display}")
    print(f"ID: {campaign_id}")

    config = get_config(campaign_id)
    if not config:
        print(
            "Error: ai_reply_agent_config missing — activate via Streamlit or "
            "pnpm activate-reply-agents",
            file=sys.stderr,
        )
        return 1

    readiness = validate_campaign_readiness(config, campaign_id)
    if not readiness.ready:
        print(
            f"Error: campaign not ready ({readiness.reason or 'unknown'})",
            file=sys.stderr,
        )
        return 1

    if not str(config.get("prompt_snapshot") or "").strip():
        print("Error: prompt_snapshot is empty on campaign config", file=sys.stderr)
        return 1

    print(f"Status: {config.get('status')}")
    print(f"Niche: {config.get('niche_preset_id')} ({config.get('target_type')})")

    in_window = is_within_send_window()
    if in_window:
        print("Send window: open (immediate send)")
    else:
        from send_window import next_send_slot

        slot = next_send_slot()
        print(f"Send window: closed — sends will queue for {format_paris_slot(slot)}")

    def on_fetch_progress(page: int, max_pages: int, found: int, target: int) -> None:
        print(f"  fetch page {page}/{max_pages} — {found}/{target} pending…", flush=True)

    print(f"\nFetching pending replies (max {args.max_leads})…")
    interest_index = build_interest_index(instantly_client, campaign_id)
    pending_rows = fetch_pending_replies(
        instantly_client,
        campaign_id,
        max_leads=args.max_leads,
        on_progress=on_fetch_progress,
        interest_index=interest_index,
    )

    tag_counts = count_by_tag(pending_rows)
    print("\nPending by tag:")
    for tag_key, count in tag_counts.items():
        print(f"  {TAG_LABELS.get(tag_key, tag_key)}: {count}")

    filtered_rows = filter_rows_by_tag(pending_rows, args.tag)
    print(f"\nProcessing tag filter: {TAG_LABELS.get(args.tag, args.tag)} ({len(filtered_rows)} leads)")

    for row in filtered_rows[:30]:
        preview = (row.last_reply_preview or "")[:80]
        print(f"  - {row.lead_email} [{row.interest_label}] {preview}")
    if len(filtered_rows) > 30:
        print(f"  ... and {len(filtered_rows) - 30} more")

    if not filtered_rows:
        print("\nNo pending leads for this tag filter.")
        return 0

    if args.dry_run:
        print("\nDry run — no Grok or send.")
        return 0

    selected_emails = {row.lead_email.lower() for row in filtered_rows}
    interested_only = args.tag == "interested"
    try_result = None
    send_emails: set[str] = set()

    if not args.send_only:
        print(f"\nRunning Grok (regenerate={args.regenerate})…")

        def on_try_progress(email: str, index: int, total: int) -> None:
            print(f"  try {index}/{total} — {email}", flush=True)

        try_result = bulk_try_agent(
            instantly_client,
            config,
            pending_rows,
            selected_emails,
            campaign_id,
            on_progress=on_try_progress,
            regenerate_existing=args.regenerate,
            interested_only=interested_only,
        )
        _print_bulk_result("Grok", try_result)
        send_emails = set(try_result.succeeded)
        send_emails |= _emails_with_drafts(campaign_id, selected_emails)
    else:
        send_emails = _emails_with_drafts(campaign_id, selected_emails)
        missing = selected_emails - send_emails
        if missing:
            print(f"\nSend-only: {len(missing)} lead(s) have no draft and will be skipped.")

    if args.try_only:
        print("\nTry-only — skipping send.")
        failed = len(try_result.failed) if try_result else 0
        return 1 if failed else 0

    if not send_emails:
        print("\nNo drafts available to send.")
        failed = len(try_result.failed) if try_result else 0
        return 1 if failed else 0

    print(f"\nSending {len(send_emails)} draft(s)…")

    def on_send_progress(email: str, index: int, total: int) -> None:
        print(f"  send {index}/{total} — {email}", flush=True)

    send_result = bulk_send(
        instantly_client,
        campaign_id,
        pending_rows,
        send_emails,
        target_type=_target_type_from_config(config),
        on_progress=on_send_progress,
    )
    _print_bulk_result("Send", send_result)

    try_failed = len(try_result.failed) if try_result else 0
    if try_failed or send_result.failed:
        return 1
    return 0


def main() -> None:
    # pnpm/npm may forward a bare `--` when using `pnpm run script -- --flags`.
    sys.argv = [sys.argv[0], *[arg for arg in sys.argv[1:] if arg != "--"]]

    parser = argparse.ArgumentParser(
        description="Fetch pending Instantly replies, run Grok, and send drafts.",
    )
    parser.add_argument(
        "--campaign-name",
        required=True,
        help='Instantly campaign name (e.g. "Biggy Agency 3")',
    )
    parser.add_argument(
        "--max-leads",
        type=int,
        default=200,
        help="Max pending leads to fetch (default: 200)",
    )
    parser.add_argument(
        "--tag",
        default="interested",
        choices=["all", "interested", "not_interested", "no_show", "lead"],
        help="Tag filter for pending leads (default: interested)",
    )
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Re-run Grok even when a draft already exists",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List pending leads only; no Grok or send",
    )
    parser.add_argument(
        "--try-only",
        action="store_true",
        help="Generate Grok drafts only; skip send",
    )
    parser.add_argument(
        "--send-only",
        action="store_true",
        help="Send existing drafts only; skip Grok",
    )
    args = parser.parse_args()
    raise SystemExit(run(args))


if __name__ == "__main__":
    main()
