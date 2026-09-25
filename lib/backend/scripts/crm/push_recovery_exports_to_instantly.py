#!/usr/bin/env python3
"""Upload lead-recovery niche CSVs (Instantly export format) to Instantly lists."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Callable

import httpx
import pandas as pd
from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_RECOVERY_DIR = _REPO_ROOT / ".lead-recovery-20260923"
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"
_CRM_SCRIPTS = _REPO_ROOT / "lib" / "backend" / "scripts" / "crm"

for path in (str(_SCRAPER_DIR), str(_CRM_SCRIPTS)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

from instantly_client import (  # noqa: E402
    PAGE_SIZE,
    InstantlyClient,
    _BULK_BATCH_SIZE,
    _lead_payload,
    _read_email,
    _upload_batch,
    ensure_lead_list,
)
from recovery_instantly_adapter import (  # noqa: E402
    enrich_payload_custom_variables,
    recovery_row_to_push_dict,
    resolve_email,
)

MAP_PATH = _RECOVERY_DIR / "recovery_upload_map.json"
MAP_RESOLVED_PATH = _RECOVERY_DIR / "recovery_upload_map.resolved.json"
REPORT_PATH = _RECOVERY_DIR / "upload_report.json"

UPLOAD_ORDER = [
    "sante_medical_1161.csv",
    "paramedical_1317.csv",
    "retail_autres_divers_1170.csv",
    "logiciel_marketing_agences_1242.csv",
    "btp_industrie_negoce_2476.csv",
    "recrutement_technique_backend_2247.csv",
    "recrutement_job_board_60j_2373.csv",
    "comptable_3175.csv",
    "restaurant_2000.csv",
    "architectes_deco_10157.csv",
]

TERRASSEMENT_FILE = "terrassement_vrd_france_4470.csv"
DEFAULT_BATCH_CONCURRENCY = 8


def _log(msg: str) -> None:
    print(msg, flush=True)


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"Invalid manifest: {path}")
    return data


def save_manifest(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def ordered_files(manifest: dict[str, Any], only: str | None) -> list[str]:
    if only:
        if only not in manifest:
            raise SystemExit(f"Unknown file in manifest: {only}")
        return [only]
    names = [name for name in UPLOAD_ORDER if name in manifest]
    for name in manifest:
        if name not in names and name != TERRASSEMENT_FILE:
            names.append(name)
    return names


def read_csv_rows(csv_path: Path) -> tuple[int, list[dict[str, str]]]:
    df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
    total_rows = len(df)
    seen: set[str] = set()
    rows: list[dict[str, str]] = []
    source = csv_path.name
    for _, series in df.iterrows():
        raw = series.to_dict()
        row = recovery_row_to_push_dict(raw, source_file=source)
        email = row.get("Email", "")
        if not email or "@" not in email:
            continue
        if email in seen:
            continue
        seen.add(email)
        rows.append(row)
    return total_rows, rows


def dry_run_manifest(manifest: dict[str, Any], only: str | None) -> dict[str, Any]:
    summary: dict[str, Any] = {"files": {}, "total_unique_emails": 0}
    files_to_scan = list(manifest.keys())
    if only:
        files_to_scan = [only]
    for name in files_to_scan:
        entry = manifest[name]
        csv_path = _RECOVERY_DIR / name
        if not csv_path.is_file():
            summary["files"][name] = {"error": "csv_not_found"}
            continue
        total_rows, rows = read_csv_rows(csv_path)
        summary["files"][name] = {
            "mode": entry.get("mode", "upload"),
            "csv_rows": total_rows,
            "unique_emails": len(rows),
            "invalid_or_duplicate_in_file": total_rows - len(rows),
        }
        summary["total_unique_emails"] += len(rows)
    return summary


def resolve_list_ids(
    api_key: str,
    manifest: dict[str, Any],
    *,
    create_lists: bool,
    scope_files: list[str] | None = None,
) -> dict[str, Any]:
    resolved = json.loads(json.dumps(manifest))
    for name, entry in resolved.items():
        if scope_files is not None and name not in scope_files:
            continue
        if entry.get("mode") == "verify_only":
            continue
        list_id = _as_str(entry.get("list_id"))
        create_name = _as_str(entry.get("create_list_name"))
        if list_id:
            continue
        if not create_name:
            raise SystemExit(f"{name}: missing list_id and create_list_name")
        if not create_lists:
            raise SystemExit(
                f"{name}: list_id missing — re-run with --create-lists to provision "
                f'"{create_name}"'
            )
        created = ensure_lead_list(api_key, create_name)
        entry["list_id"] = created["id"]
        _log(f"List ready: {create_name} → {created['id']}")
    return resolved


def _as_str(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in ("none", "null"):
        return ""
    return text


def fetch_list_emails(api_key: str, list_id: str) -> set[str]:
    client = InstantlyClient(api_key)
    emails: set[str] = set()
    starting_after: str | None = None
    previous_cursor: str | None = None
    for _page in range(500):
        body: dict[str, Any] = {"list_id": list_id.strip(), "limit": PAGE_SIZE}
        if starting_after:
            body["starting_after"] = starting_after
        page = client._fetch("/leads/list", method="POST", body=body)
        items = page.get("items") or [] if isinstance(page, dict) else []
        if not items:
            break
        for item in items:
            email = _read_email(item)
            if email:
                emails.add(email)
        next_cursor = page.get("next_starting_after") if isinstance(page, dict) else None
        if not next_cursor:
            last_email = _read_email(items[-1])
            next_cursor = last_email or items[-1].get("id")
        if len(items) < PAGE_SIZE or not next_cursor:
            break
        next_cursor = str(next_cursor)
        if next_cursor == previous_cursor:
            break
        previous_cursor = next_cursor
        starting_after = next_cursor
    return emails


def verify_terrassement(api_key: str, manifest: dict[str, Any]) -> dict[str, Any]:
    entry = manifest.get(TERRASSEMENT_FILE)
    if not entry:
        raise SystemExit(f"Manifest missing {TERRASSEMENT_FILE}")
    list_id = _as_str(entry.get("list_id"))
    csv_path = _RECOVERY_DIR / TERRASSEMENT_FILE
    _, csv_rows = read_csv_rows(csv_path)
    csv_emails = {r["Email"] for r in csv_rows}
    _log(f"Fetching Instantly list {list_id} ({len(csv_emails)} emails in CSV)...")
    api_emails = fetch_list_emails(api_key, list_id)
    only_csv = csv_emails - api_emails
    only_api = api_emails - csv_emails
    result = {
        "list_id": list_id,
        "csv_unique": len(csv_emails),
        "api_unique": len(api_emails),
        "only_in_csv": len(only_csv),
        "only_in_api": len(only_api),
        "match": len(only_csv) == 0 and len(only_api) == 0,
    }
    if not result["match"]:
        mismatch_rate = (len(only_csv) + len(only_api)) / max(len(csv_emails), 1)
        result["mismatch_rate"] = mismatch_rate
        if mismatch_rate > 0.001:
            result["ok"] = False
        else:
            result["ok"] = True
    else:
        result["ok"] = True
    return result


async def push_leads_throttled(
    api_key: str,
    list_id: str,
    rows: list[dict[str, str]],
    *,
    skip_if_in_campaign: bool,
    skip_if_in_list: bool,
    concurrency: int,
    log_cb: Callable[[str], None] | None = None,
) -> dict[str, int]:
    to_upload: list[dict[str, Any]] = []
    for row in rows:
        email = row.get("Email", "")
        if not email or "@" not in email:
            continue
        payload = _lead_payload(row, list_id)
        enrich_payload_custom_variables(payload, row)
        to_upload.append(payload)

    attempted = len(to_upload)
    if log_cb:
        log_cb(f"Instantly upload: {attempted} candidate(s), concurrency={concurrency}")

    if not attempted:
        return {
            "attempted": 0,
            "pushed": 0,
            "skipped_duplicate": 0,
            "failed": 0,
        }

    batches = [
        to_upload[i : i + _BULK_BATCH_SIZE]
        for i in range(0, len(to_upload), _BULK_BATCH_SIZE)
    ]
    sem = asyncio.Semaphore(max(concurrency, 1))
    pushed = 0
    skipped = 0
    failed = 0

    async with httpx.AsyncClient(timeout=30.0) as client:

        async def run_batch(batch: list[dict[str, Any]]) -> dict[str, int]:
            async with sem:
                return await _upload_batch(
                    client,
                    api_key=api_key,
                    list_id=list_id,
                    batch=batch,
                    skip_if_in_campaign=skip_if_in_campaign,
                    skip_if_in_list=skip_if_in_list,
                    log_cb=None,
                )

        results = await asyncio.gather(*[run_batch(batch) for batch in batches])

    for stats in results:
        pushed += stats["pushed"]
        skipped += stats["skipped_duplicate"]
        failed += stats["failed"]

    if log_cb:
        log_cb(
            f"Instantly done: {pushed} uploaded, "
            f"{skipped} skipped (duplicate), {failed} failed"
        )

    return {
        "attempted": attempted,
        "pushed": pushed,
        "skipped_duplicate": skipped,
        "failed": failed,
    }


async def upload_file(
    api_key: str,
    name: str,
    entry: dict[str, Any],
) -> dict[str, Any]:
    csv_path = _RECOVERY_DIR / name
    if not csv_path.is_file():
        return {"file": name, "error": "csv_not_found"}

    list_id = _as_str(entry.get("list_id"))
    if not list_id:
        return {"file": name, "error": "missing_list_id"}

    fallback_note = ""
    primary_list_id = list_id

    skip_list = bool(entry.get("skip_if_in_list", True))
    skip_campaign = bool(entry.get("skip_if_in_campaign", True))

    total_rows, rows = read_csv_rows(csv_path)
    started = time.time()
    stats = await push_leads_throttled(
        api_key,
        list_id,
        rows,
        skip_if_in_campaign=skip_campaign,
        skip_if_in_list=skip_list,
        concurrency=DEFAULT_BATCH_CONCURRENCY,
        log_cb=_log,
    )
    if (
        entry.get("fallback_list_if_forbidden")
        and stats["pushed"] == 0
        and stats["skipped_duplicate"] == 0
        and stats["failed"] > 0
    ):
        create_name = _as_str(entry.get("create_list_name"))
        if create_name:
            created = ensure_lead_list(api_key, create_name)
            list_id = _as_str(created.get("id"))
            fallback_note = f"fallback_from={primary_list_id};fallback_list={list_id}"
            _log(
                f"Upload to {primary_list_id} failed; "
                f"retrying on {create_name} → {list_id}"
            )
            stats = await push_leads_throttled(
                api_key,
                list_id,
                rows,
                skip_if_in_campaign=skip_campaign,
                skip_if_in_list=skip_list,
                concurrency=DEFAULT_BATCH_CONCURRENCY,
                log_cb=_log,
            )
    duration_s = round(time.time() - started, 2)
    result = {
        "file": name,
        "list_id": list_id,
        "csv_rows": total_rows,
        "unique_emails": len(rows),
        "duration_s": duration_s,
        **stats,
    }
    if fallback_note:
        result["note"] = fallback_note
    return result


def merge_report(existing: dict[str, Any], updates: list[dict[str, Any]]) -> dict[str, Any]:
    by_file = {item["file"]: item for item in existing.get("runs", []) if "file" in item}
    for item in updates:
        by_file[item["file"]] = item
    return {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "runs": list(by_file.values()),
    }


async def run_uploads(
    api_key: str,
    manifest: dict[str, Any],
    files: list[str],
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for name in files:
        entry = manifest.get(name)
        if not entry or entry.get("mode") != "upload":
            continue
        _log(f"\n=== {name} → {entry.get('list_id')} ===")
        results.append(await upload_file(api_key, name, entry))
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Count emails only")
    parser.add_argument("--only", metavar="FILE", help="Single CSV from manifest")
    parser.add_argument(
        "--create-lists",
        action="store_true",
        help="Create missing lead lists from create_list_name",
    )
    parser.add_argument(
        "--verify-terrassement",
        action="store_true",
        help="Compare terrassement CSV vs prod list emails",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=MAP_PATH,
        help=f"Manifest path (default: {MAP_PATH})",
    )
    args = parser.parse_args()

    manifest_path = args.manifest
    manifest = load_manifest(manifest_path)
    if MAP_RESOLVED_PATH.is_file():
        resolved = load_manifest(MAP_RESOLVED_PATH)
        for name, entry in resolved.items():
            list_id = _as_str(entry.get("list_id"))
            if list_id and name in manifest:
                manifest[name]["list_id"] = list_id

    if args.dry_run:
        summary = dry_run_manifest(manifest, args.only)
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        return

    api_key = os.getenv("INSTANTLY_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("INSTANTLY_API_KEY is required")

    if args.verify_terrassement:
        result = verify_terrassement(api_key, manifest)
        print(json.dumps(result, indent=2))
        if not result.get("ok"):
            raise SystemExit(1)
        return

    files = ordered_files(manifest, args.only)
    manifest = resolve_list_ids(
        api_key,
        manifest,
        create_lists=args.create_lists,
        scope_files=files,
    )
    new_ids = {
        name: entry
        for name in files
        for entry in [manifest.get(name, {})]
        if _as_str(entry.get("list_id"))
    }
    if new_ids and args.create_lists:
        base = (
            load_manifest(MAP_RESOLVED_PATH)
            if MAP_RESOLVED_PATH.is_file()
            else load_manifest(manifest_path)
        )
        for name, entry in new_ids.items():
            base[name]["list_id"] = _as_str(entry.get("list_id"))
        save_manifest(MAP_RESOLVED_PATH, base)

    results = asyncio.run(run_uploads(api_key, manifest, files))

    prior: dict[str, Any] = {}
    if REPORT_PATH.is_file():
        with REPORT_PATH.open(encoding="utf-8") as fh:
            prior = json.load(fh)
    report = merge_report(prior, results)
    save_manifest(REPORT_PATH, report)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
