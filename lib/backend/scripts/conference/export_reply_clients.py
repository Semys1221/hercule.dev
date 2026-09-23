#!/usr/bin/env python3
"""Export Instantly Not-interested + « non » replies into /conference case studies."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[4]
_BACKEND = _REPO_ROOT / "lib" / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from conference_clients.export_replies import (  # noqa: E402
    classify_campaigns,
    export_not_interested_non,
)
from conference_clients.logos import fetch_and_store_logo  # noqa: E402
from conference_clients.select import (  # noqa: E402
    public_firm,
    replace_failed_logos,
    select_from_export,
)
from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402

DEFAULT_TMP = _BACKEND / "tmp" / "conference-clients"
DEFAULT_LOGO_DIR = _REPO_ROOT / "public" / "conference" / "clients"
DEFAULT_JSON = _REPO_ROOT / "lib" / "conference" / "case-studies.json"


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _client() -> InstantlyClient:
    api_key = get_api_key()
    if not api_key:
        raise SystemExit("Error: INSTANTLY_API_KEY is not set")
    return InstantlyClient(api_key)


def cmd_export(args: argparse.Namespace) -> int:
    tmp = Path(args.out)
    tmp.mkdir(parents=True, exist_ok=True)
    client = _client()
    all_campaigns = client.list_all_campaigns()
    forced = {cid.strip() for cid in (args.campaign_id or []) if cid.strip()}
    if forced:
        by_id = {str(c.get("id") or ""): c for c in all_campaigns}
        scoped = []
        missing = []
        for campaign_id in forced:
            if campaign_id in by_id:
                scoped.append(by_id[campaign_id])
            else:
                missing.append(campaign_id)
        if missing:
            print(f"Warning: unknown campaign id(s): {', '.join(missing)}", file=sys.stderr)
        selected, skipped = classify_campaigns(scoped, forced_ids=forced)
    else:
        selected, skipped = classify_campaigns(all_campaigns)

    print(f"Campaigns selected: {len(selected)} (skipped {len(skipped)})", flush=True)
    rows, report = export_not_interested_non(
        client,
        campaigns=selected,
        max_leads=args.max_leads,
        skip_non_reply_check=args.skip_non_reply_check,
        on_progress=lambda email, campaign_name: print(
            f"  + {campaign_name}: {email}",
            flush=True,
        ),
    )
    report["skipped_campaigns"] = skipped
    report["exported_at"] = datetime.now(timezone.utc).isoformat()

    _write_json(tmp / "not_interested_non.json", rows)
    _write_json(tmp / "export_report.json", report)
    print(f"Accepted: {report['accepted']}")
    print(f"Rejected no « non » reply: {report['rejected_no_non_reply']}")
    print(f"Wrote {tmp / 'not_interested_non.json'}")
    print(f"Wrote {tmp / 'export_report.json'}")
    return 0


def _load_overrides(tmp: Path) -> tuple[list[str], list[str]]:
    path = tmp / "selection.json"
    if not path.exists():
        return [], []
    data = _read_json(path)
    return list(data.get("include_domains") or []), list(data.get("exclude_domains") or [])


def cmd_select(args: argparse.Namespace) -> int:
    tmp = Path(args.out)
    export_path = tmp / "not_interested_non.json"
    if not export_path.exists():
        print(f"Error: missing {export_path} — run export first", file=sys.stderr)
        return 1
    rows = _read_json(export_path)
    include, exclude = _load_overrides(tmp)
    split = select_from_export(rows, include_domains=include, exclude_domains=exclude)
    payload = {
        "include_domains": include,
        "exclude_domains": exclude,
        "chosen": split["chosen"],
        "pool": split["pool"],
        "quotas": split["quotas"],
        "rejected_no_website": split["rejected_no_website"],
        "rejected_denied": split["rejected_denied"],
    }
    _write_json(tmp / "selection.json", payload)
    quotas = split["quotas"]
    print(
        f"Chosen {quotas['accounting']} accounting / {quotas['brokerage']} brokerage "
        f"(available {quotas['accounting_available']}/{quotas['brokerage_available']})"
    )
    print(f"Wrote {tmp / 'selection.json'}")
    return 0


def cmd_logos(args: argparse.Namespace) -> int:
    tmp = Path(args.out)
    selection_path = tmp / "selection.json"
    if not selection_path.exists():
        print(f"Error: missing {selection_path} — run select first", file=sys.stderr)
        return 1
    selection = _read_json(selection_path)
    chosen = list(selection.get("chosen") or [])
    pool = list(selection.get("pool") or [])
    dest = Path(args.logo_dir)
    dest.mkdir(parents=True, exist_ok=True)

    failed: set[str] = set()
    logo_reasons: dict[str, str] = {}
    logos: dict[str, str] = dict(selection.get("logos") or {})

    for item in chosen:
        domain = item["domain"]
        path, reason = fetch_and_store_logo(item, dest)
        logo_reasons[domain] = reason
        print(f"  {item['name']} ({domain}): {reason}")
        if path:
            logos[domain] = path
        else:
            failed.add(domain)

    if failed:
        chosen, pool, dropped = replace_failed_logos(chosen, pool, failed)
        for item in dropped:
            print(f"  dropped (no logo): {item['name']} ({item['domain']})")
        for item in chosen:
            domain = item["domain"]
            if domain in logos:
                continue
            path, reason = fetch_and_store_logo(item, dest)
            logo_reasons[domain] = reason
            print(f"  replacement {item['name']} ({domain}): {reason}")
            if path:
                logos[domain] = path
            else:
                failed.add(domain)
        chosen = [c for c in chosen if c["domain"] in logos]

    selection["chosen"] = chosen
    selection["pool"] = pool
    selection["logos"] = logos
    selection["logo_reasons"] = logo_reasons
    _write_json(selection_path, selection)

    firms = [
        public_firm(item, logos[item["domain"]])
        for item in chosen
        if item["domain"] in logos
    ]
    json_path = Path(args.json_out)
    existing: dict[str, Any] = {}
    if json_path.exists():
        loaded = _read_json(json_path)
        if isinstance(loaded, dict):
            existing = loaded
    featured = dict(existing.get("featured") or {})
    held: set[str] = set()
    for category in ("accounting", "brokerage"):
        match = next((firm for firm in firms if firm["category"] == category), None)
        if match is None:
            continue
        held.add(match["slug"])
        block = dict(featured.get(category) or {})
        block["slug"] = match["slug"]
        featured[category] = block
    grid = [firm for firm in firms if firm["slug"] not in held]
    payload = {
        "featured": featured,
        "metrics": existing.get("metrics") or {},
        "firms": grid,
    }
    _write_json(json_path, payload)
    print(f"Wrote {len(grid)} grid firms to {args.json_out}")
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    code = cmd_export(args)
    if code != 0:
        return code
    code = cmd_select(args)
    if code != 0:
        return code
    return cmd_logos(args)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export Instantly Not-interested + « non » replies for /conference."
    )
    parser.add_argument(
        "command",
        choices=("export", "select", "logos", "build"),
        help="Pipeline step (build runs export → select → logos)",
    )
    parser.add_argument(
        "--campaign-id",
        action="append",
        default=[],
        help="Restrict to this Instantly campaign UUID (repeatable)",
    )
    parser.add_argument("--max-leads", type=int, default=2000)
    parser.add_argument(
        "--skip-non-reply-check",
        action="store_true",
        help="Debug only: keep every Not interested lead, skip the « non » body filter",
    )
    parser.add_argument("--out", type=Path, default=DEFAULT_TMP)
    parser.add_argument("--logo-dir", type=Path, default=DEFAULT_LOGO_DIR)
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "build" and args.skip_non_reply_check:
        print("Error: --skip-non-reply-check is not allowed with build", file=sys.stderr)
        return 1
    commands = {
        "export": cmd_export,
        "select": cmd_select,
        "logos": cmd_logos,
        "build": cmd_build,
    }
    return commands[args.command](args)


if __name__ == "__main__":
    raise SystemExit(main())
