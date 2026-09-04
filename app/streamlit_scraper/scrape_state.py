"""Disk-backed scrape run state for resume after interruption."""

from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import pandas as pd

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))


def scrape_state_path(preset: str = "biggy_agency") -> str:
    return os.path.join(_LIB_DIR, "output", preset, "scrape_state.json")


SCRAPE_STATE_PATH = scrape_state_path("biggy_agency")

STATE_VERSION = 3
STATUS_RUNNING = "running"
STATUS_COMPLETED = "completed"
STATUS_INCOMPLETE = "incomplete"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def target_mode(config: dict) -> str:
    return str(config.get("TARGET_MODE") or "csv_saved").strip()


def build_config_fingerprint(config: dict) -> str:
    """Stable hash of scrape-defining config fields (excludes TARGET_LEADS)."""
    parts = [
        "|".join(sorted(config.get("KEYWORDS", []))),
        "|".join(sorted(config.get("EXPANSION_KEYWORDS", []))),
        "|".join(sorted(config.get("LOCATIONS", []))),
        "|".join(sorted(config.get("EXPANSION_LOCATIONS", []))),
        "|".join(sorted(config.get("EXCLUDE_DOMAINS", []))),
        str(config.get("ENRICH_ENABLED", "")),
        str(config.get("ENRICH_BATCH_SIZE", "")),
        str(config.get("ENRICH_CONCURRENCY", "")),
        str(config.get("ENRICH_TIMEOUT_MS", "")),
        "|".join(sorted(config.get("ENRICH_INCLUDED_KEYWORDS", []))),
        "|".join(sorted(config.get("ENRICH_HARD_EXCLUDED_KEYWORDS", []))),
        "|".join(sorted(config.get("ENRICH_SOFT_EXCLUDED_KEYWORDS", []))),
        str(config.get("SERVICE_DEFAULT", "")),
        "|".join(
            f"{rule.get('label', '')}:{','.join(sorted(rule.get('keywords') or []))}"
            for rule in (config.get("SERVICE_RULES") or [])
            if isinstance(rule, dict)
        ),
        str(config.get("OUTSCRAPER_BATCH_SIZE", "")),
        target_mode(config),
        str(config.get("PAPPERS_ENABLED", "")),
        str(config.get("PAPPERS_MIN_EMPLOYEES", "")),
        str(config.get("PAPPERS_ON_UNKNOWN", "")),
        "|".join(sorted(str(item) for item in (config.get("PAPPERS_NAF_PREFIXES") or []))),
    ]
    payload = "\n".join(parts)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def count_csv_leads(csv_path: str) -> int:
    if not os.path.isfile(csv_path):
        return 0
    try:
        df = pd.read_csv(csv_path)
        if df.empty or "Email" not in df.columns:
            return 0
        return int(
            df["Email"]
            .dropna()
            .astype(str)
            .str.contains("@", regex=False)
            .sum()
        )
    except (OSError, pd.errors.EmptyDataError, ValueError):
        return 0


def load_scrape_state(path: str = SCRAPE_STATE_PATH) -> dict[str, Any] | None:
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return None


def save_scrape_state(state: dict[str, Any], path: str = SCRAPE_STATE_PATH) -> None:
    state["last_updated"] = _utc_now()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


def clear_scrape_state(path: str = SCRAPE_STATE_PATH) -> None:
    if os.path.isfile(path):
        os.remove(path)


def mark_scrape_completed(
    state: dict[str, Any],
    *,
    leads_saved: int,
    leads_enriched_valid: int = 0,
    leads_enriched_rejected: int = 0,
    instantly_pushed: int = 0,
    path: str = SCRAPE_STATE_PATH,
) -> None:
    state["status"] = STATUS_COMPLETED
    state["leads_saved"] = leads_saved
    state["leads_enriched_valid"] = leads_enriched_valid
    state["leads_enriched_rejected"] = leads_enriched_rejected
    state["instantly_pushed"] = instantly_pushed
    save_scrape_state(state, path)


def mark_scrape_incomplete(
    state: dict[str, Any],
    *,
    leads_saved: int,
    leads_enriched_valid: int = 0,
    leads_enriched_rejected: int = 0,
    instantly_pushed: int = 0,
    path: str = SCRAPE_STATE_PATH,
) -> None:
    state["status"] = STATUS_INCOMPLETE
    state["leads_saved"] = leads_saved
    state["leads_enriched_valid"] = leads_enriched_valid
    state["leads_enriched_rejected"] = leads_enriched_rejected
    state["instantly_pushed"] = instantly_pushed
    save_scrape_state(state, path)


def new_scrape_state(
    config: dict,
    *,
    preset: str = "biggy_agency",
    push_to_instantly: bool = False,
    queries_total: int,
    batches_total: int,
    leads_saved: int = 0,
    leads_enriched_valid: int = 0,
    leads_enriched_rejected: int = 0,
    instantly_pushed: int = 0,
    query_pass: int = 0,
    last_completed_batch_index: int = -1,
    last_submitted_batch_index: int = -1,
    inflight_tasks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    now = _utc_now()
    return {
        "version": STATE_VERSION,
        "status": STATUS_RUNNING,
        "preset": preset,
        "config_fingerprint": build_config_fingerprint(config),
        "target": int(config["TARGET_LEADS"]),
        "target_mode": target_mode(config),
        "push_to_instantly": push_to_instantly,
        "queries_total": queries_total,
        "batches_total": batches_total,
        "query_pass": query_pass,
        "last_completed_batch_index": last_completed_batch_index,
        "last_submitted_batch_index": last_submitted_batch_index,
        "inflight_tasks": inflight_tasks or [],
        "leads_saved": leads_saved,
        "leads_enriched_valid": leads_enriched_valid,
        "leads_enriched_rejected": leads_enriched_rejected,
        "instantly_pushed": instantly_pushed,
        "instantly_skipped_duplicate": 0,
        "started_at": now,
        "last_updated": now,
    }


def _inflight_count(state: dict[str, Any] | None) -> int:
    if not state:
        return 0
    tasks = state.get("inflight_tasks") or []
    return sum(
        1 for item in tasks if isinstance(item, dict) and item.get("task_id")
    )


def _progress_value(state: dict[str, Any] | None, config: dict, csv_path: str) -> int:
    mode = target_mode(config)
    if mode == "instantly_pushed" and state is not None:
        return int(state.get("instantly_pushed", 0))
    if mode == "instantly_pushed":
        return 0
    return count_csv_leads(csv_path)


@dataclass
class RecoverableRun:
    """Scrape recovery snapshot for UI/CLI."""

    has_leftover_work: bool = False
    can_resume: bool = False
    leads_saved: int = 0
    leads_enriched_valid: int = 0
    leads_enriched_rejected: int = 0
    instantly_pushed: int = 0
    target: int = 0
    target_mode: str = "csv_saved"
    batches_total: int = 0
    query_pass: int = 0
    last_completed_batch_index: int = -1
    pending_push: int = 0
    push_to_instantly: bool = False
    last_updated: str = ""
    has_checkpoint: bool = False
    config_mismatch: bool = False
    inflight_count: int = 0
    message: str = ""

    @property
    def progress(self) -> int:
        if self.target_mode == "instantly_pushed":
            return self.instantly_pushed
        return self.leads_saved

    @property
    def is_recoverable(self) -> bool:
        """Backward-compatible alias for can_resume."""
        return self.can_resume


def detect_recoverable_run(
    config: dict,
    csv_path: str,
    *,
    state_path: str = SCRAPE_STATE_PATH,
) -> RecoverableRun:
    from instantly_client import csv_push_stats

    leads_saved = count_csv_leads(csv_path)
    target = int(config.get("TARGET_LEADS", 0))
    mode = target_mode(config)
    push_stats = csv_push_stats(csv_path)
    pending_push = push_stats["pending"]
    fingerprint = build_config_fingerprint(config)
    state = load_scrape_state(state_path)
    inflight_count = _inflight_count(state)
    instantly_pushed = int(state.get("instantly_pushed", 0)) if state else 0
    leads_enriched_valid = int(state.get("leads_enriched_valid", 0)) if state else 0
    leads_enriched_rejected = int(state.get("leads_enriched_rejected", 0)) if state else 0
    progress = instantly_pushed if mode == "instantly_pushed" else leads_saved

    if progress >= target > 0:
        if state and state.get("status") not in (STATUS_COMPLETED, STATUS_INCOMPLETE):
            mark_scrape_completed(
                state,
                leads_saved=leads_saved,
                instantly_pushed=instantly_pushed,
                path=state_path,
            )
        if leads_saved > 0 or inflight_count > 0 or instantly_pushed > 0:
            return RecoverableRun(
                has_leftover_work=True,
                can_resume=False,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                target=target,
                target_mode=mode,
                inflight_count=inflight_count,
                pending_push=pending_push,
                message=(
                    "Target reached — abort and restart to scrape again from scratch."
                ),
            )
        return RecoverableRun(
            leads_saved=leads_saved,
            leads_enriched_valid=leads_enriched_valid,
            leads_enriched_rejected=leads_enriched_rejected,
            instantly_pushed=instantly_pushed,
            target=target,
            target_mode=mode,
        )

    config_mismatch = bool(
        state
        and state.get("config_fingerprint")
        and state["config_fingerprint"] != fingerprint
    )

    has_leftover_work = (
        leads_saved > 0
        or inflight_count > 0
        or instantly_pushed > 0
        or (state is not None and state.get("status") == STATUS_RUNNING)
    )

    if not has_leftover_work:
        return RecoverableRun(
            leads_saved=0,
            target=target,
            target_mode=mode,
        )

    if config_mismatch:
        return RecoverableRun(
            has_leftover_work=True,
            can_resume=False,
            leads_saved=leads_saved,
            leads_enriched_valid=leads_enriched_valid,
            leads_enriched_rejected=leads_enriched_rejected,
            instantly_pushed=instantly_pushed,
            target=target,
            target_mode=mode,
            config_mismatch=True,
            inflight_count=inflight_count,
            pending_push=pending_push,
            message=(
                "Saved run used a different config — abort Outscraper jobs and "
                "delete local leads before starting again."
            ),
        )

    if state:
        if state.get("status") in (STATUS_COMPLETED, STATUS_INCOMPLETE):
            return RecoverableRun(
                has_leftover_work=True,
                can_resume=False,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                target=target,
                target_mode=mode,
                inflight_count=inflight_count,
                pending_push=pending_push,
                message="Previous run finished — abort and restart for a new scrape.",
            )

        batches_total = int(state.get("batches_total", 0))
        last_batch = int(state.get("last_completed_batch_index", -1))
        saved_target = int(state.get("target", target))
        saved_mode = str(state.get("target_mode", mode))
        saved_progress = (
            int(state.get("instantly_pushed", 0))
            if saved_mode == "instantly_pushed"
            else leads_saved
        )
        return RecoverableRun(
            has_leftover_work=True,
            can_resume=saved_progress < saved_target,
            leads_saved=leads_saved,
            leads_enriched_valid=leads_enriched_valid,
            leads_enriched_rejected=leads_enriched_rejected,
            instantly_pushed=instantly_pushed,
            target=saved_target,
            target_mode=saved_mode,
            batches_total=batches_total,
            query_pass=int(state.get("query_pass", 0)),
            last_completed_batch_index=last_batch,
            pending_push=pending_push,
            push_to_instantly=bool(state.get("push_to_instantly", False)),
            last_updated=str(state.get("last_updated", "")),
            has_checkpoint=last_batch >= 0,
            inflight_count=inflight_count,
            message=(
                "No batch checkpoint yet — continue may re-fetch early batches "
                "(CSV dedup prevents duplicate rows)."
                if last_batch < 0
                else (
                    f"{inflight_count} Outscraper job(s) still in flight."
                    if inflight_count
                    else ""
                )
            ),
        )

    queries_total = len(config.get("KEYWORDS", [])) * len(config.get("LOCATIONS", []))
    batch_size = max(int(config.get("OUTSCRAPER_BATCH_SIZE", 500)), 1)
    batches_total = (queries_total + batch_size - 1) // batch_size if queries_total else 0
    return RecoverableRun(
        has_leftover_work=True,
        can_resume=True,
        leads_saved=leads_saved,
        leads_enriched_valid=leads_enriched_valid,
        leads_enriched_rejected=leads_enriched_rejected,
        instantly_pushed=instantly_pushed,
        target=target,
        target_mode=mode,
        batches_total=batches_total,
        last_completed_batch_index=-1,
        pending_push=pending_push,
        push_to_instantly=False,
        has_checkpoint=False,
        message=(
            "Interrupted run detected from CSV (no checkpoint file). "
            "Continue may re-fetch early batches — duplicates are skipped in CSV."
        ),
    )
