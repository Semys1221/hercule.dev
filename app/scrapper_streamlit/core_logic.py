"""Outscraper pipeline — config-driven scrape, filter, CSV export."""

from __future__ import annotations

import asyncio
import csv
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
from typing import Any, Callable

import httpx
import pandas as pd
import urllib3

from category_filter import (
    detect_service_from_taxonomy,
    format_category_display,
    taxonomy_fields,
    taxonomy_text,
)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

LIB_DIR = os.path.dirname(os.path.abspath(__file__))
ENRICH_DIR = os.path.join(os.path.dirname(LIB_DIR), "streamlit_enrich")


@dataclass(frozen=True)
class OutputPaths:
    out_dir: str
    csv: str
    raw_jsonl: str
    filter_audit: str
    enrich_audit: str
    metrics: str
    scrape_state: str
    workspace_cache: str


def output_paths(preset: str = "biggy_agency") -> OutputPaths:
    out_dir = os.path.join(LIB_DIR, "output", preset)
    os.makedirs(out_dir, exist_ok=True)
    return OutputPaths(
        out_dir=out_dir,
        csv=os.path.join(out_dir, "outscraper_leads.csv"),
        raw_jsonl=os.path.join(out_dir, "outscraper_raw.jsonl"),
        filter_audit=os.path.join(out_dir, "filter_audit.csv"),
        enrich_audit=os.path.join(out_dir, "enrich_audit.csv"),
        metrics=os.path.join(out_dir, "scrape_metrics.jsonl"),
        scrape_state=os.path.join(out_dir, "scrape_state.json"),
        workspace_cache=os.path.join(out_dir, "workspace_emails.json"),
    )


_default_paths = output_paths("biggy_agency")
_active = _default_paths


def activate_output_paths(preset: str = "biggy_agency") -> OutputPaths:
    global _active
    _active = output_paths(preset)
    return _active


# Backward-compatible exports (biggy_agency default paths)
OUT_DIR = _default_paths.out_dir
CSV_OUTPUT_PATH = _default_paths.csv
RAW_JSONL_PATH = _default_paths.raw_jsonl
FILTER_AUDIT_PATH = _default_paths.filter_audit
ENRICH_AUDIT_PATH = _default_paths.enrich_audit
METRICS_PATH = _default_paths.metrics

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

_BACKOFF_BASE = 2.0
_MAX_RETRIES = 4
_HTTP_TIMEOUT = httpx.Timeout(10.0, read=60.0)
_OUTSCRAPER_CLOUD = "https://api.outscraper.cloud"
_OUTSCRAPER_LEGACY = "https://api.outscraper.com"
_CSV_COLUMNS = ["Email", "Company", "Website", "Service", "City", "Type", "Category", "Subtypes"]
_FILTER_AUDIT_COLUMNS = ["Email", "Company", "Category", "Verdict", "Reason"]
_ENRICH_AUDIT_COLUMNS = [
    "Email",
    "Company",
    "Website",
    "Statut_Lead",
    "Mots_Inclus_Trouvés",
    "Hard_Exclus_Trouvés",
    "Soft_Exclus_Trouvés",
    "Mots_Exclus_Trouvés",
    "Enrich_Reason",
]


@dataclass
class OutscraperSettings:
    batch_size: int = 500
    concurrency: int = 6
    limit_per_query: int = 20
    poll_initial_s: float = 45.0
    poll_interval_s: float = 5.0
    poll_slow_s: float = 10.0
    poll_timeout_s: float = 480.0
    total_limit_buffer: int = 8


@dataclass
class InflightBatch:
    batch_index: int
    task_id: str
    submitted_at: float
    last_polled_at: float = 0.0

    def to_state(self) -> dict[str, Any]:
        return {
            "batch_index": self.batch_index,
            "task_id": self.task_id,
            "submitted_at": self.submitted_at,
        }

    @classmethod
    def from_state(cls, data: dict[str, Any]) -> InflightBatch:
        return cls(
            batch_index=int(data["batch_index"]),
            task_id=str(data["task_id"]),
            submitted_at=float(data.get("submitted_at", time.time())),
        )


def outscraper_settings(config: dict) -> OutscraperSettings:
    return OutscraperSettings(
        batch_size=max(int(config.get("OUTSCRAPER_BATCH_SIZE", 500)), 1),
        concurrency=max(int(config.get("OUTSCRAPER_CONCURRENCY", 6)), 1),
        limit_per_query=max(int(config.get("OUTSCRAPER_LIMIT_PER_QUERY", 20)), 1),
        poll_initial_s=float(config.get("OUTSCRAPER_POLL_INITIAL_S", 45)),
        poll_interval_s=float(config.get("OUTSCRAPER_POLL_INTERVAL_S", 5)),
        poll_slow_s=float(config.get("OUTSCRAPER_POLL_SLOW_S", 10)),
        poll_timeout_s=float(config.get("OUTSCRAPER_POLL_TIMEOUT_S", 480)),
        total_limit_buffer=max(int(config.get("OUTSCRAPER_TOTAL_LIMIT_BUFFER", 8)), 1),
    )


def chunk_batches(queries: list[str], batch_size: int) -> list[list[str]]:
    return [queries[i : i + batch_size] for i in range(0, len(queries), batch_size)]


def compute_total_limit(target: int, progress: int, buffer: int) -> int | None:
    remaining = target - progress
    if remaining <= 0:
        return None
    return remaining * buffer


def _target_mode(config: dict) -> str:
    from scrape_state import target_mode

    return target_mode(config)


def _progress_value(
    *,
    target_mode: str,
    leads_saved: int,
    instantly_pushed: int,
) -> int:
    if target_mode == "instantly_pushed":
        return instantly_pushed
    return leads_saved


def _is_target_reached(
    *,
    target: int,
    target_mode: str,
    leads_saved: int,
    instantly_pushed: int,
) -> bool:
    return _progress_value(
        target_mode=target_mode,
        leads_saved=leads_saved,
        instantly_pushed=instantly_pushed,
    ) >= target


def _query_pass_lists(config: dict, query_pass: int) -> tuple[list[str], list[str]]:
    if query_pass <= 0:
        return list(config.get("KEYWORDS") or []), list(config.get("LOCATIONS") or [])
    return (
        list(config.get("EXPANSION_KEYWORDS") or []),
        list(config.get("EXPANSION_LOCATIONS") or []),
    )


def max_query_passes(config: dict) -> int:
    has_expansion = bool(config.get("EXPANSION_KEYWORDS") and config.get("EXPANSION_LOCATIONS"))
    return 1 if has_expansion else 0


def build_queries(config: dict, query_pass: int = 0) -> list[str]:
    keywords, locations = _query_pass_lists(config, query_pass)
    if not keywords or not locations:
        return []
    return [f"{kw} in {loc}, France" for kw in keywords for loc in locations]


def _normalize_web(raw: str) -> str:
    web = raw.lower().strip()
    for prefix in ("https://", "http://", "www."):
        if web.startswith(prefix):
            web = web[len(prefix) :]
    return web.rstrip("/")


def _root_domain(web: str) -> str:
    """Extract registrable hostname from normalized website (no scheme/path)."""
    if not web:
        return ""
    host = web.split("/")[0].split(":")[0].strip().lower()
    return host.removeprefix("www.")


def _company_dedup_key(web: str, email: str) -> str:
    root = _root_domain(web)
    if root:
        return root
    if "@" in email:
        return email.split("@", 1)[1]
    return ""


def _business_website(b: dict[str, Any]) -> str:
    return str(b.get("website") or b.get("site") or "").strip()


def _extract_email(business: dict[str, Any]) -> str:
    extracted: list[str] = []
    single = business.get("email")
    if isinstance(single, str) and "@" in single:
        return single.strip().lower()

    emails_field = business.get("emails")
    if emails_field:
        if isinstance(emails_field, list):
            for item in emails_field:
                if isinstance(item, dict) and item.get("value"):
                    extracted.append(str(item["value"]).strip().lower())
                elif isinstance(item, str):
                    extracted.append(item.strip().lower())
        elif isinstance(emails_field, str):
            if "@" in emails_field:
                extracted.append(emails_field.strip().lower())

    for em in extracted:
        if em and "@" in em:
            return em

    for i in range(1, 10):
        em = business.get(f"email_{i}")
        if em and isinstance(em, str) and "@" in em:
            return em.strip().lower()
    return ""


class OutscraperClient:
    """Async HTTP client for Outscraper Google Maps Search."""

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={"X-API-KEY": api_key, "Accept": "application/json"},
            verify=False,
            timeout=_HTTP_TIMEOUT,
        )
        self.qps_delay = 0.05

    async def aclose(self) -> None:
        await self.client.aclose()

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> httpx.Response | None:
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = await self.client.request(method, url, **kwargs)
                if response.status_code == 429:
                    retry_after = int(
                        response.headers.get("Retry-After", str(_BACKOFF_BASE * attempt))
                    )
                    await asyncio.sleep(retry_after)
                    continue
                if response.status_code >= 500:
                    await asyncio.sleep(_BACKOFF_BASE**attempt)
                    continue
                if response.status_code < 300:
                    return response
                if response.status_code == 400:
                    try:
                        error_msg = response.json().get("errorMessage", "")
                        if "Too many requests" in error_msg:
                            await asyncio.sleep(_BACKOFF_BASE**attempt)
                            continue
                    except Exception:
                        pass
                response.raise_for_status()
                return response
            except httpx.TimeoutException:
                await asyncio.sleep(_BACKOFF_BASE**attempt)
            except httpx.HTTPError:
                return None
        return None

    def _parse_task_id(self, data: dict[str, Any]) -> str | None:
        task_id = data.get("id")
        if task_id and data.get("status") in ("Pending", "Success"):
            return str(task_id)
        return None

    async def send_async_tasks(
        self,
        queries: list[str],
        limit: int,
        *,
        total_limit: int | None = None,
    ) -> str | None:
        payload: dict[str, Any] = {
            "query": queries,
            "limit": limit,
            "async": True,
            "dropDuplicates": True,
            "language": "fr",
            "region": "FR",
            "extractContacts": True,
        }
        if total_limit is not None:
            payload["totalLimit"] = total_limit

        endpoint = f"{_OUTSCRAPER_CLOUD}/google-maps-search"
        response = await self._request_with_retry("POST", endpoint, json=payload)
        if response is not None:
            try:
                task_id = self._parse_task_id(response.json())
                if task_id:
                    await asyncio.sleep(self.qps_delay)
                    return task_id
            except ValueError:
                pass

        return await self._send_async_tasks_legacy(queries, limit)

    async def _send_async_tasks_legacy(self, queries: list[str], limit: int) -> str | None:
        endpoint = f"{_OUTSCRAPER_LEGACY}/maps/search-v2"
        params: list[tuple[str, str | int | bool]] = [
            ("limit", limit),
            ("async", "true"),
            ("dropDuplicates", "true"),
            ("language", "fr"),
            ("region", "FR"),
            ("extractContacts", "true"),
        ]
        params.extend(("query", q) for q in queries)
        response = await self._request_with_retry("GET", endpoint, params=params)
        if response is None:
            return None
        try:
            task_id = self._parse_task_id(response.json())
            await asyncio.sleep(self.qps_delay)
            return task_id
        except ValueError:
            return None

    async def check_task_status(self, task_id: str) -> list | None:
        endpoint = f"{_OUTSCRAPER_CLOUD}/requests/{task_id}"
        response = await self._request_with_retry("GET", endpoint)
        if response is None:
            return None
        try:
            data = response.json()
            status = data.get("status")
            if status == "Success":
                raw_data = data.get("data")
                if raw_data is None:
                    return []
                if not isinstance(raw_data, list):
                    return [raw_data] if isinstance(raw_data, dict) else []
                return raw_data
            if status == "Pending":
                return None
            return []
        except ValueError:
            return None
        finally:
            await asyncio.sleep(self.qps_delay)

    async def cancel_task(self, task_id: str) -> bool:
        """Terminate an async Outscraper request (DELETE /requests/{id})."""
        for base in (_OUTSCRAPER_CLOUD, _OUTSCRAPER_LEGACY):
            endpoint = f"{base}/requests/{task_id}"
            response = await self._request_with_retry("DELETE", endpoint)
            if response is not None:
                await asyncio.sleep(self.qps_delay)
                return True
        return False

    async def list_running_requests(self) -> list[str]:
        """Return task IDs for in-flight Outscraper requests on this API key."""
        ids: list[str] = []
        for base in (_OUTSCRAPER_CLOUD, _OUTSCRAPER_LEGACY):
            endpoint = f"{base}/requests"
            response = await self._request_with_retry(
                "GET", endpoint, params={"type": "running", "pageSize": 100}
            )
            if response is None:
                continue
            try:
                data = response.json()
                items = data if isinstance(data, list) else data.get("data", [])
                for item in items:
                    if isinstance(item, dict) and item.get("id"):
                        ids.append(str(item["id"]))
                if ids:
                    break
            except ValueError:
                continue
            await asyncio.sleep(self.qps_delay)
        return ids


async def abort_outscraper_jobs(
    api_key: str,
    known_task_ids: list[str] | None = None,
    *,
    also_account_running: bool = True,
    log_cb: Callable[[str], None] | None = None,
) -> int:
    """Cancel Outscraper jobs before clearing local checkpoint (keeps task IDs)."""
    if not api_key:
        return 0

    def _log(msg: str) -> None:
        if log_cb:
            log_cb(msg)

    to_cancel: set[str] = {tid for tid in (known_task_ids or []) if tid}
    client = OutscraperClient(api_key)
    cancelled = 0
    try:
        if also_account_running:
            running = await client.list_running_requests()
            to_cancel.update(running)

        if not to_cancel:
            _log("No Outscraper jobs to cancel.")
            return 0

        _log(f"Cancelling {len(to_cancel)} Outscraper job(s)...")
        for task_id in sorted(to_cancel):
            if await client.cancel_task(task_id):
                cancelled += 1
                _log(f"Cancelled Outscraper task [{task_id}].")
            else:
                _log(f"Could not cancel Outscraper task [{task_id}] (may already be done).")
    finally:
        await client.aclose()

    _log(f"Outscraper cancel complete — {cancelled}/{len(to_cancel)} terminated.")
    return cancelled


def _collect_known_task_ids() -> list[str]:
    from scrape_state import load_scrape_state

    state = load_scrape_state(_active.scrape_state)
    if not state:
        return []
    ids: list[str] = []
    for item in state.get("inflight_tasks") or []:
        if isinstance(item, dict) and item.get("task_id"):
            ids.append(str(item["task_id"]))
    return ids


def _poll_interval_for_job(job: InflightBatch, settings: OutscraperSettings, now: float) -> float | None:
    elapsed = now - job.submitted_at
    if elapsed < settings.poll_initial_s:
        return None
    if elapsed >= settings.poll_timeout_s:
        return settings.poll_interval_s
    slow_after = 240.0
    interval = settings.poll_slow_s if elapsed >= slow_after else settings.poll_interval_s
    if job.last_polled_at and (now - job.last_polled_at) < interval:
        return None
    return interval


def _seconds_until_next_poll(
    jobs: list[InflightBatch],
    settings: OutscraperSettings,
    now: float,
) -> float:
    if not jobs:
        return settings.poll_interval_s
    waits: list[float] = []
    for job in jobs:
        elapsed = now - job.submitted_at
        if elapsed >= settings.poll_timeout_s:
            continue
        if elapsed < settings.poll_initial_s:
            waits.append(settings.poll_initial_s - elapsed)
            continue
        slow_after = 240.0
        interval = settings.poll_slow_s if elapsed >= slow_after else settings.poll_interval_s
        if job.last_polled_at:
            since_poll = now - job.last_polled_at
            if since_poll < interval:
                waits.append(interval - since_poll)
        else:
            waits.append(0.0)
    return min(waits) if waits else settings.poll_interval_s


async def _poll_once(
    client: OutscraperClient,
    job: InflightBatch,
    settings: OutscraperSettings,
) -> tuple[str, list | None]:
    """Poll a task once. Returns (status, results) where status is pending|success|failed."""
    now = time.time()
    elapsed = now - job.submitted_at
    if elapsed >= settings.poll_timeout_s:
        return "failed", []

    if _poll_interval_for_job(job, settings, now) is None:
        return "pending", None

    job.last_polled_at = now
    results = await client.check_task_status(job.task_id)
    if results is None:
        return "pending", None
    return "success", results


async def _poll_until_ready(
    client: OutscraperClient,
    job: InflightBatch,
    settings: OutscraperSettings,
    log_cb: Callable[[str], None],
) -> list | None:
    while True:
        status, results = await _poll_once(client, job, settings)
        if status == "success":
            return results
        if status == "failed":
            log_cb(f"Task [{job.task_id}] timed out after {int(time.time() - job.submitted_at)}s.")
            return []
        await asyncio.sleep(_seconds_until_next_poll([job], settings, time.time()))

def _append_lead_row(row: dict[str, str]) -> None:
    write_header = not os.path.exists(_active.csv) or os.path.getsize(_active.csv) == 0
    with open(_active.csv, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=_CSV_COLUMNS)
        if write_header:
            writer.writeheader()
        writer.writerow({col: row.get(col, "") for col in _CSV_COLUMNS})


def _append_raw_business(business: dict[str, Any]) -> None:
    with open(_active.raw_jsonl, "a", encoding="utf-8") as f:
        f.write(json.dumps(business, ensure_ascii=False) + "\n")


def _append_filter_audit_row(row: dict[str, str]) -> None:
    write_header = not os.path.exists(_active.filter_audit) or os.path.getsize(_active.filter_audit) == 0
    with open(_active.filter_audit, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=_FILTER_AUDIT_COLUMNS)
        if write_header:
            writer.writeheader()
        writer.writerow({col: row.get(col, "") for col in _FILTER_AUDIT_COLUMNS})


def _append_enrich_audit_row(row: dict[str, str]) -> None:
    write_header = not os.path.exists(_active.enrich_audit) or os.path.getsize(_active.enrich_audit) == 0
    with open(_active.enrich_audit, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=_ENRICH_AUDIT_COLUMNS)
        if write_header:
            writer.writeheader()
        writer.writerow({col: row.get(col, "") for col in _ENRICH_AUDIT_COLUMNS})


def _enrich_settings(config: dict) -> dict[str, Any]:
    hard = list(config.get("ENRICH_HARD_EXCLUDED_KEYWORDS") or [])
    soft = list(config.get("ENRICH_SOFT_EXCLUDED_KEYWORDS") or [])
    legacy_excluded = list(config.get("ENRICH_EXCLUDED_KEYWORDS") or [])
    if not hard and not soft and legacy_excluded:
        hard = legacy_excluded
    return {
        "enabled": bool(config.get("ENRICH_ENABLED", True)),
        "batch_size": max(int(config.get("ENRICH_BATCH_SIZE", 50)), 1),
        "concurrency": max(int(config.get("ENRICH_CONCURRENCY", 10)), 1),
        "timeout_ms": max(int(config.get("ENRICH_TIMEOUT_MS", 15000)), 1000),
        "included": list(config.get("ENRICH_INCLUDED_KEYWORDS") or []),
        "hard_excluded": hard,
        "soft_excluded": soft,
    }


async def _run_enrich_batch(
    pending_scraped: list[dict[str, str]],
    config: dict,
    *,
    log_cb: Callable[[str], None],
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    if ENRICH_DIR not in sys.path:
        sys.path.insert(0, ENRICH_DIR)
    from website_verifier import enrich_leads

    settings = _enrich_settings(config)
    batch = pending_scraped[: settings["batch_size"]]
    del pending_scraped[: len(batch)]

    valid, rejected = await enrich_leads(
        batch,
        url_column="Website",
        included=settings["included"],
        hard_excluded=settings["hard_excluded"],
        soft_excluded=settings["soft_excluded"],
        max_concurrent=settings["concurrency"],
        goto_timeout_ms=settings["timeout_ms"],
        log_cb=log_cb,
    )
    for row in rejected:
        _append_enrich_audit_row(row)
    return valid, rejected


async def _maybe_enrich_and_push(
    *,
    config: dict,
    pending_scraped: list[dict[str, str]],
    pending_instantly: list[dict[str, str]],
    instantly_enabled: bool,
    push_every: int,
    enrich_batch_size: int,
    enrich_enabled: bool,
    log_cb: Callable[[str], None],
    progress_cb: Callable[[float], None],
    metric_cb: Callable[[int, int, int], None],
    target: int,
    target_mode: str,
    leads_saved: int,
    leads_enriched_valid: int,
    leads_enriched_rejected: int,
    instantly_pushed: int,
    batches_total: int,
    last_completed: int,
    force_enrich: bool = False,
) -> tuple[int, int, int]:
    """Run enrich batch if buffer full; flush Instantly if buffer full. Returns updated counters."""
    while enrich_enabled and (len(pending_scraped) >= enrich_batch_size or force_enrich):
        if not pending_scraped:
            break
        force_enrich = False
        batch_n = min(len(pending_scraped), enrich_batch_size)
        log_cb(f"Enrich batch — {batch_n} scraped lead(s) queued for website check")
        valid, rejected = await _run_enrich_batch(pending_scraped, config, log_cb=log_cb)
        leads_enriched_valid += len(valid)
        leads_enriched_rejected += len(rejected)
        pending_instantly.extend(valid)
        log_cb(
            f"Enrich batch done — {len(valid)} valid, {len(rejected)} rejected "
            f"(totals: {leads_enriched_valid} valid / {leads_enriched_rejected} rejected)"
        )
        metric_cb(leads_saved, leads_enriched_valid, instantly_pushed)

    if not enrich_enabled and pending_scraped:
        pending_instantly.extend(pending_scraped)
        pending_scraped.clear()

    while instantly_enabled and len(pending_instantly) >= push_every:
        flush_stats = await _flush_instantly_buffer(
            pending_instantly,
            config,
            log_cb=log_cb,
            label=f"{instantly_pushed} pushed so far",
        )
        instantly_pushed += flush_stats["pushed"]
        metric_cb(leads_saved, leads_enriched_valid, instantly_pushed)
        if batches_total:
            progress_cb(
                min(instantly_pushed / target, 1.0)
                if target_mode == "instantly_pushed"
                else (last_completed + 1) / batches_total
            )
        log_cb(
            f"Instantly totals — pushed: {instantly_pushed}/{target}, "
            f"skipped (duplicate): {flush_stats['skipped_duplicate']}"
        )

    return leads_enriched_valid, leads_enriched_rejected, instantly_pushed


def _append_metrics(event: dict[str, Any]) -> None:
    event.setdefault("ts", time.time())
    with open(_active.metrics, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def _process_business(
    b: dict[str, Any],
    config: dict,
    *,
    seen_domain: set[str],
    seen_em: set[str],
) -> tuple[dict[str, str] | None, dict[str, str] | None]:
    """Return (lead_row, audit_row). Minimal scrape gates — website enrich filters later."""
    company = (b.get("name") or "").strip()
    category_display = format_category_display(b)
    email = _extract_email(b)
    web = _normalize_web(_business_website(b))

    if not email or not EMAIL_REGEX.match(email):
        audit = {
            "Email": email,
            "Company": company,
            "Category": category_display,
            "Verdict": "rejected",
            "Reason": "invalid or missing email",
        }
        return None, audit

    if not web:
        audit = {
            "Email": email,
            "Company": company,
            "Category": category_display,
            "Verdict": "rejected",
            "Reason": "missing website",
        }
        return None, audit

    if any(ex in web for ex in config["EXCLUDE_DOMAINS"]):
        audit = {
            "Email": email,
            "Company": company,
            "Category": category_display,
            "Verdict": "rejected",
            "Reason": "excluded domain",
        }
        return None, audit

    company_key = _company_dedup_key(web, email)
    if company_key in seen_domain or email in seen_em:
        audit = {
            "Email": email,
            "Company": company,
            "Category": category_display,
            "Verdict": "rejected",
            "Reason": "duplicate company (domain) or email",
        }
        return None, audit

    tax = taxonomy_text(b)
    service = detect_service_from_taxonomy(tax)
    fields = taxonomy_fields(b)
    row = {
        "Email": email,
        "Company": company,
        "Website": web,
        "Service": service,
        "City": (b.get("city") or "").strip(),
        "Type": fields["Type"],
        "Category": fields["Category"],
        "Subtypes": fields["Subtypes"],
    }
    audit = {
        "Email": email,
        "Company": company,
        "Category": category_display,
        "Verdict": "accepted",
        "Reason": "",
    }
    return row, audit


def _load_seen_from_csv() -> tuple[set[str], set[str]]:
    seen_em: set[str] = set()
    seen_domain: set[str] = set()
    if not os.path.isfile(_active.csv):
        return seen_em, seen_domain
    try:
        df = pd.read_csv(_active.csv)
        if df.empty:
            return seen_em, seen_domain
        for _, row in df.iterrows():
            email = str(row.get("Email") or "").strip().lower()
            web = _normalize_web(str(row.get("Website") or ""))
            if "@" in email:
                seen_em.add(email)
            company_key = _company_dedup_key(web, email)
            if company_key:
                seen_domain.add(company_key)
    except (OSError, pd.errors.EmptyDataError, ValueError):
        pass
    return seen_em, seen_domain


async def _flush_instantly_buffer(
    pending: list[dict[str, str]],
    config: dict,
    *,
    log_cb: Callable[[str], None],
    label: str = "",
) -> dict[str, int]:
    from instantly_client import push_leads_to_list

    if not pending:
        return {"pushed": 0, "skipped_duplicate": 0}

    if label:
        log_cb(f"Instantly flush ({label}) — {len(pending)} lead(s) in buffer")

    push_stats = await push_leads_to_list(
        config["INSTANTLY_API_KEY"],
        config["INSTANTLY_LIST_ID"],
        pending,
        log_cb=log_cb,
    )
    pending.clear()
    return {
        "pushed": push_stats["pushed"],
        "skipped_duplicate": push_stats["skipped_duplicate"],
    }


async def clear_local_leads(
    *,
    cancel_remote: bool = True,
    api_key: str = "",
    log_cb: Callable[[str], None] | None = None,
    preset: str = "biggy_agency",
) -> dict[str, int | bool]:
    """Remove local CSV/checkpoint; optionally cancel Outscraper jobs first."""
    from scrape_state import clear_scrape_state, count_csv_leads

    paths = activate_output_paths(preset)
    known_ids = _collect_known_task_ids()
    outscraper_cancelled = 0
    if cancel_remote and api_key:
        outscraper_cancelled = await abort_outscraper_jobs(
            api_key,
            known_ids,
            log_cb=log_cb,
        )

    lead_count = count_csv_leads(paths.csv)
    had_csv = os.path.isfile(paths.csv)
    had_state = os.path.isfile(paths.scrape_state)

    if had_csv:
        os.remove(paths.csv)
    if os.path.isfile(paths.raw_jsonl):
        os.remove(paths.raw_jsonl)
    if os.path.isfile(paths.enrich_audit):
        os.remove(paths.enrich_audit)
    clear_scrape_state(paths.scrape_state)

    return {
        "leads_removed": lead_count,
        "csv_cleared": had_csv,
        "state_cleared": had_state,
        "outscraper_cancelled": outscraper_cancelled,
    }


def _persist_run_state(
    run_state: dict[str, Any] | None,
    *,
    leads_saved: int,
    leads_enriched_valid: int = 0,
    leads_enriched_rejected: int = 0,
    instantly_pushed: int = 0,
    last_completed_batch_index: int,
    last_submitted_batch_index: int,
    inflight: dict[str, InflightBatch],
) -> None:
    if run_state is None:
        return
    from scrape_state import save_scrape_state

    run_state["leads_saved"] = leads_saved
    run_state["leads_enriched_valid"] = leads_enriched_valid
    run_state["leads_enriched_rejected"] = leads_enriched_rejected
    run_state["instantly_pushed"] = instantly_pushed
    run_state["last_completed_batch_index"] = last_completed_batch_index
    run_state["last_submitted_batch_index"] = last_submitted_batch_index
    run_state["inflight_tasks"] = [job.to_state() for job in inflight.values()]
    run_state["status"] = "running"
    save_scrape_state(run_state, path=_active.scrape_state)


async def _process_batch_results(
    results: list,
    config: dict,
    *,
    seen_domain: set[str],
    seen_em: set[str],
    target: int,
    target_mode: str,
    leads_saved: int,
    leads_enriched_valid: int,
    leads_enriched_rejected: int,
    pending_scraped: list[dict[str, str]],
    pending_instantly: list[dict[str, str]],
    instantly_enabled: bool,
    push_every: int,
    enrich_enabled: bool,
    enrich_batch_size: int,
    log_cb: Callable[[str], None],
    progress_cb: Callable[[float], None],
    metric_cb: Callable[[int, int, int], None],
    instantly_pushed: int,
    batches_total: int,
    last_completed: int,
) -> tuple[int, int, int, int, bool]:
    log_cb("Applying scrape gates (email, website, dedup)...")
    raw_places = 0
    with_email = 0
    accepted = 0
    rejected = 0
    started = time.time()
    target_reached = False

    for query_result in results:
        b_list = query_result if isinstance(query_result, list) else [query_result]
        for b in b_list:
            if not b or not isinstance(b, dict):
                continue

            raw_places += 1
            _append_raw_business(b)
            row, audit = _process_business(b, config, seen_domain=seen_domain, seen_em=seen_em)
            if _extract_email(b):
                with_email += 1
            if audit:
                if audit["Verdict"] == "accepted":
                    accepted += 1
                else:
                    rejected += 1
                    _append_filter_audit_row(audit)
            if not row:
                continue

            seen_domain.add(_company_dedup_key(row["Website"], row["Email"]))
            seen_em.add(row["Email"])
            _append_lead_row(row)
            pending_scraped.append(row)
            leads_saved += 1
            metric_cb(leads_saved, leads_enriched_valid, instantly_pushed)

            (
                leads_enriched_valid,
                leads_enriched_rejected,
                instantly_pushed,
            ) = await _maybe_enrich_and_push(
                config=config,
                pending_scraped=pending_scraped,
                pending_instantly=pending_instantly,
                instantly_enabled=instantly_enabled,
                push_every=push_every,
                enrich_batch_size=enrich_batch_size,
                enrich_enabled=enrich_enabled,
                log_cb=log_cb,
                progress_cb=progress_cb,
                metric_cb=metric_cb,
                target=target,
                target_mode=target_mode,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                batches_total=batches_total,
                last_completed=last_completed,
            )

            if _is_target_reached(
                target=target,
                target_mode=target_mode,
                leads_saved=leads_saved,
                instantly_pushed=instantly_pushed,
            ):
                target_reached = True
                break
        if target_reached:
            break

    _append_metrics(
        {
            "event": "batch_complete",
            "raw_places": raw_places,
            "with_email": with_email,
            "accepted": accepted,
            "rejected": rejected,
            "leads_saved": leads_saved,
            "leads_enriched_valid": leads_enriched_valid,
            "leads_enriched_rejected": leads_enriched_rejected,
            "instantly_pushed": instantly_pushed,
            "duration_s": round(time.time() - started, 1),
        }
    )
    log_cb(
        f"Scrape stats — places={raw_places}, emails={with_email}, "
        f"accepted={accepted}, rejected={rejected}, enriched_valid={leads_enriched_valid}"
    )
    return leads_saved, leads_enriched_valid, leads_enriched_rejected, instantly_pushed, target_reached


async def _run_concurrent_scrape(
    *,
    client: OutscraperClient,
    batches: list[list[str]],
    config: dict,
    settings: OutscraperSettings,
    target: int,
    target_mode: str,
    start_batch: int,
    run_state: dict[str, Any] | None,
    resume_inflight: list[InflightBatch],
    seen_domain: set[str],
    seen_em: set[str],
    leads_saved: int,
    leads_enriched_valid: int,
    leads_enriched_rejected: int,
    pending_scraped: list[dict[str, str]],
    pending_instantly: list[dict[str, str]],
    instantly_enabled: bool,
    push_every: int,
    enrich_enabled: bool,
    enrich_batch_size: int,
    log_cb: Callable[[str], None],
    progress_cb: Callable[[float], None],
    metric_cb: Callable[[int, int, int], None],
    instantly_pushed: int,
) -> tuple[int, int, int, int, int, bool]:
    inflight: dict[str, InflightBatch] = {job.task_id: job for job in resume_inflight}
    next_submit_idx = start_batch
    if run_state is not None:
        submitted = int(run_state.get("last_submitted_batch_index", start_batch - 1))
        next_submit_idx = max(next_submit_idx, submitted + 1)

    last_completed = start_batch - 1
    if run_state is not None:
        last_completed = int(run_state.get("last_completed_batch_index", start_batch - 1))

    if resume_inflight:
        log_cb(f"Resuming poll for {len(resume_inflight)} in-flight Outscraper task(s).")

    last_inflight_log = 0.0
    last_logged_inflight_count = -1
    target_reached = False

    def _progress() -> int:
        return _progress_value(
            target_mode=target_mode,
            leads_saved=leads_saved,
            instantly_pushed=instantly_pushed,
        )

    while not target_reached and _progress() < target and (
        next_submit_idx < len(batches) or inflight
    ):
        while (
            len(inflight) < settings.concurrency
            and next_submit_idx < len(batches)
            and _progress() < target
            and not target_reached
        ):
            batch = batches[next_submit_idx]
            total_limit = compute_total_limit(target, _progress(), settings.total_limit_buffer)
            log_cb(
                f"Sending batch {next_submit_idx + 1}/{len(batches)} "
                f"({len(batch)} queries, in-flight {len(inflight)}/{settings.concurrency})..."
            )
            task_id = await client.send_async_tasks(
                batch,
                settings.limit_per_query,
                total_limit=total_limit,
            )
            if task_id:
                inflight[task_id] = InflightBatch(
                    batch_index=next_submit_idx,
                    task_id=task_id,
                    submitted_at=time.time(),
                )
                log_cb(f"Task [{task_id}] submitted.")
            else:
                log_cb(f"Failed to submit batch {next_submit_idx + 1}.")

            _persist_run_state(
                run_state,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                last_completed_batch_index=last_completed,
                last_submitted_batch_index=next_submit_idx,
                inflight=inflight,
            )
            next_submit_idx += 1

        if not inflight:
            break

        if target_mode == "instantly_pushed":
            progress_cb(min(instantly_pushed / target, 1.0) if target else 0.0)
        else:
            progress_cb((last_completed + 1) / len(batches) if batches else 0.0)

        now = time.time()
        if (
            now - last_inflight_log >= 30.0
            or len(inflight) != last_logged_inflight_count
        ):
            log_cb(f"In-flight: {len(inflight)}/{settings.concurrency}")
            last_logged_inflight_count = len(inflight)
            last_inflight_log = now

        now = time.time()
        ready_jobs = [
            job
            for job in inflight.values()
            if _poll_interval_for_job(job, settings, now) is not None
            or now - job.submitted_at >= settings.poll_timeout_s
        ]
        if not ready_jobs:
            await asyncio.sleep(_seconds_until_next_poll(list(inflight.values()), settings, now))
            continue

        completed_jobs: list[tuple[InflightBatch, list | None]] = []
        for job in ready_jobs:
            if job.task_id not in inflight:
                continue
            status, results = await _poll_once(client, job, settings)
            if status == "pending":
                continue
            if status == "failed":
                log_cb(
                    f"Task [{job.task_id}] timed out after "
                    f"{int(time.time() - job.submitted_at)}s."
                )
                results = []
            completed_jobs.append((job, results))

        for job, results in completed_jobs:
            inflight.pop(job.task_id, None)

            if not results:
                log_cb(f"Batch {job.batch_index + 1} returned no results.")
                last_completed = max(last_completed, job.batch_index)
                _persist_run_state(
                    run_state,
                    leads_saved=leads_saved,
                    leads_enriched_valid=leads_enriched_valid,
                    leads_enriched_rejected=leads_enriched_rejected,
                    instantly_pushed=instantly_pushed,
                    last_completed_batch_index=last_completed,
                    last_submitted_batch_index=max(
                        next_submit_idx - 1,
                        int(run_state.get("last_submitted_batch_index", -1))
                        if run_state
                        else -1,
                    ),
                    inflight=inflight,
                )
                continue

            (
                leads_saved,
                leads_enriched_valid,
                leads_enriched_rejected,
                instantly_pushed,
                batch_target_reached,
            ) = await _process_batch_results(
                results,
                config,
                seen_domain=seen_domain,
                seen_em=seen_em,
                target=target,
                target_mode=target_mode,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                pending_scraped=pending_scraped,
                pending_instantly=pending_instantly,
                instantly_enabled=instantly_enabled,
                push_every=push_every,
                enrich_enabled=enrich_enabled,
                enrich_batch_size=enrich_batch_size,
                log_cb=log_cb,
                progress_cb=progress_cb,
                metric_cb=metric_cb,
                instantly_pushed=instantly_pushed,
                batches_total=len(batches),
                last_completed=job.batch_index,
            )
            last_completed = max(last_completed, job.batch_index)
            log_cb(
                f"Batch {job.batch_index + 1} processed. "
                f"Scraped: {leads_saved} | Enriched: {leads_enriched_valid} | "
                f"Instantly: {instantly_pushed}/{target}"
            )

            _persist_run_state(
                run_state,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                last_completed_batch_index=last_completed,
                last_submitted_batch_index=max(
                    next_submit_idx - 1,
                    int(run_state.get("last_submitted_batch_index", -1)) if run_state else -1,
                ),
                inflight=inflight,
            )

            if batch_target_reached:
                target_reached = True
                break

    if inflight and target_reached:
        for job in list(inflight.values()):
            if await client.cancel_task(job.task_id):
                log_cb(f"Target reached — cancelled Outscraper task [{job.task_id}].")
        inflight.clear()
        _persist_run_state(
            run_state,
            leads_saved=leads_saved,
            leads_enriched_valid=leads_enriched_valid,
            leads_enriched_rejected=leads_enriched_rejected,
            instantly_pushed=instantly_pushed,
            last_completed_batch_index=last_completed,
            last_submitted_batch_index=max(
                next_submit_idx - 1,
                int(run_state.get("last_submitted_batch_index", -1)) if run_state else -1,
            ),
            inflight=inflight,
        )

    pass_complete = bool(batches) and last_completed >= len(batches) - 1 and not inflight
    return (
        leads_saved,
        leads_enriched_valid,
        leads_enriched_rejected,
        instantly_pushed,
        last_completed,
        pass_complete or target_reached,
    )


async def run_scraper_pipeline(
    config: dict,
    log_cb: Callable[[str], None],
    progress_cb: Callable[[float], None],
    metric_cb: Callable[[int, int, int], None],
    *,
    dry_run: bool = False,
    push_to_instantly: bool = False,
    resume: bool = False,
    reset: bool = False,
    preset: str = "biggy_agency",
) -> dict[str, Any]:
    from scrape_state import (
        build_config_fingerprint,
        load_scrape_state,
        mark_scrape_completed,
        mark_scrape_incomplete,
        new_scrape_state,
        save_scrape_state,
        target_mode,
    )

    paths = activate_output_paths(preset)
    settings = outscraper_settings(config)
    mode = target_mode(config)
    target = int(config["TARGET_LEADS"])
    fingerprint = build_config_fingerprint(config)

    if reset:
        await clear_local_leads(
            cancel_remote=True,
            api_key=config.get("OUTSCRAPER_API_KEY", ""),
            log_cb=log_cb,
            preset=preset,
        )
        resume = False

    summary: dict[str, Any] = {
        "dry_run": dry_run,
        "target": target,
        "target_mode": mode,
        "keywords": len(config["KEYWORDS"]),
        "locations": len(config["LOCATIONS"]),
        "queries_total": 0,
        "batches_total": 0,
        "batch_size": settings.batch_size,
        "concurrency": settings.concurrency,
        "limit_per_query": settings.limit_per_query,
        "leads_saved": 0,
        "leads_enriched_valid": 0,
        "leads_enriched_rejected": 0,
        "instantly_pushed": 0,
        "instantly_skipped_duplicate": 0,
        "query_passes_run": 0,
        "resumed": resume,
        "preset": preset,
    }

    pass0_queries = build_queries(config, 0)
    pass1_queries = build_queries(config, 1) if max_query_passes(config) >= 1 else []
    log_cb(
        f"Config: passe 0 = {len(pass0_queries)} queries, "
        f"passe 1 = {len(pass1_queries)} queries "
        f"(batch {settings.batch_size}, concurrency {settings.concurrency})"
    )
    log_cb(
        f"Outscraper: limit/query={settings.limit_per_query}, "
        f"poll initial={settings.poll_initial_s}s, timeout={settings.poll_timeout_s}s"
    )
    log_cb(f"Target: {target} ({mode}) — output: {paths.out_dir}")
    enrich_cfg = _enrich_settings(config)
    if enrich_cfg["enabled"]:
        log_cb(
            f"Website enrich enabled — batch {enrich_cfg['batch_size']}, "
            f"concurrency {enrich_cfg['concurrency']}, timeout {enrich_cfg['timeout_ms']}ms"
        )
    else:
        log_cb("Website enrich disabled — scraped leads go directly to Instantly push")

    for sample in pass0_queries[:3]:
        log_cb(f"  sample query: {sample}")

    if dry_run:
        if not config.get("OUTSCRAPER_API_KEY"):
            log_cb("WARNING: OUTSCRAPER_API_KEY is missing")
        else:
            log_cb("OUTSCRAPER_API_KEY present (dry-run — no API calls)")
        if mode == "instantly_pushed":
            if push_to_instantly and config.get("INSTANTLY_API_KEY") and config.get("INSTANTLY_LIST_ID"):
                log_cb("Instantly push enabled — target metric is instantly_pushed")
            else:
                log_cb("WARNING: TARGET_MODE=instantly_pushed requires Instantly keys + push")
        log_cb("Dry-run complete — zero Outscraper requests made.")
        summary["queries_total"] = len(pass0_queries) + len(pass1_queries)
        progress_cb(1.0)
        return summary

    if not config.get("OUTSCRAPER_API_KEY"):
        raise SystemExit("OUTSCRAPER_API_KEY is required for live scrape")

    if mode == "instantly_pushed":
        if not push_to_instantly:
            push_to_instantly = True
            log_cb("Auto-enabling Instantly push (target metric = instantly_pushed).")
        if not config.get("INSTANTLY_API_KEY") or not config.get("INSTANTLY_LIST_ID"):
            raise SystemExit(
                "TARGET_MODE=instantly_pushed requires INSTANTLY_API_KEY and INSTANTLY_LIST_ID"
            )

    from scrape_state import detect_recoverable_run

    existing_state = load_scrape_state(paths.scrape_state)
    if resume:
        if existing_state and existing_state.get("config_fingerprint") != fingerprint:
            raise SystemExit(
                "Cannot resume — config changed since last run. Use reset/start fresh."
            )
        if existing_state and existing_state.get("push_to_instantly") and not push_to_instantly:
            push_to_instantly = True
            log_cb("Resuming with auto-push (enabled in saved run).")
    elif not reset:
        leftover = detect_recoverable_run(
            config,
            paths.csv,
            state_path=paths.scrape_state,
        )
        if leftover.has_leftover_work:
            hint = leftover.message or (
                "Incomplete scrape detected — use resume=True or reset=True."
            )
            raise SystemExit(hint)

    seen_em, seen_domain = _load_seen_from_csv()
    leads_saved = len(seen_em)
    if leads_saved:
        log_cb(f"Loaded {leads_saved} existing lead(s) from CSV for dedup.")

    instantly_enabled = push_to_instantly and bool(
        config.get("INSTANTLY_API_KEY") and config.get("INSTANTLY_LIST_ID")
    )
    if instantly_enabled:
        from instantly_client import fetch_workspace_emails

        log_cb("Loading Instantly workspace emails for duplicate skip...")
        workspace_emails = fetch_workspace_emails(
            config["INSTANTLY_API_KEY"],
            cache_path=paths.workspace_cache,
            on_progress=lambda n: log_cb(f"  workspace index: {n} emails loaded..."),
        )
        before = len(seen_em)
        seen_em.update(workspace_emails)
        log_cb(
            f"Instantly workspace dedup — {len(seen_em) - before} new email(s) added to skip set "
            f"({len(seen_em)} total)."
        )

    query_pass = 0
    start_batch = 0
    resume_inflight: list[InflightBatch] = []
    run_state: dict[str, Any] | None = None
    instantly_pushed = 0
    instantly_skipped = 0
    leads_enriched_valid = 0
    leads_enriched_rejected = 0

    if resume and existing_state:
        if existing_state.get("config_fingerprint") != fingerprint:
            raise SystemExit(
                "Cannot resume — config changed since last run. Use reset/start fresh."
            )
        query_pass = int(existing_state.get("query_pass", 0))
        instantly_pushed = int(existing_state.get("instantly_pushed", 0))
        instantly_skipped = int(existing_state.get("instantly_skipped_duplicate", 0))
        leads_enriched_valid = int(existing_state.get("leads_enriched_valid", 0))
        leads_enriched_rejected = int(existing_state.get("leads_enriched_rejected", 0))
        start_batch = int(existing_state.get("last_completed_batch_index", -1)) + 1
        for item in existing_state.get("inflight_tasks") or []:
            if isinstance(item, dict) and item.get("task_id"):
                resume_inflight.append(InflightBatch.from_state(item))
        run_state = existing_state
        run_state["status"] = "running"
        run_state["push_to_instantly"] = push_to_instantly
        save_scrape_state(run_state, path=_active.scrape_state)
        progress = instantly_pushed if mode == "instantly_pushed" else leads_saved
        log_cb(
            f"Resuming pass {query_pass + 1}, batch {start_batch + 1} "
            f"({progress}/{target} {mode})."
        )
    elif resume:
        if leads_saved == 0:
            raise SystemExit("Nothing to resume — no scrape state or CSV leads found.")
        run_state = new_scrape_state(
            config,
            preset=preset,
            push_to_instantly=push_to_instantly,
            queries_total=len(pass0_queries),
            batches_total=0,
            leads_saved=leads_saved,
            instantly_pushed=0,
            query_pass=0,
            last_completed_batch_index=-1,
        )
        save_scrape_state(run_state, path=_active.scrape_state)
        log_cb(f"Resuming from CSV without checkpoint ({leads_saved} leads in CSV).")
    else:
        run_state = new_scrape_state(
            config,
            preset=preset,
            push_to_instantly=push_to_instantly,
            queries_total=len(pass0_queries),
            batches_total=0,
            leads_saved=leads_saved,
            instantly_pushed=0,
            query_pass=0,
            last_completed_batch_index=-1,
        )
        save_scrape_state(run_state, path=_active.scrape_state)
        log_cb(f"Starting engine — target {target} ({mode}).")

    pending_scraped: list[dict[str, str]] = []
    pending_instantly: list[dict[str, str]] = []
    push_every = max(int(config.get("INSTANTLY_PUSH_EVERY", 100)), 1)
    enrich_enabled = enrich_cfg["enabled"]
    enrich_batch_size = enrich_cfg["batch_size"]
    out_client = OutscraperClient(config["OUTSCRAPER_API_KEY"])
    max_pass = max_query_passes(config)
    total_queries = 0
    total_batches = 0

    try:
        if instantly_enabled:
            log_cb(f"Instantly push enabled — flush every {push_every} enriched lead(s)")

        metric_cb(leads_saved, leads_enriched_valid, instantly_pushed)

        initial_resume = resume
        while query_pass <= max_pass:
            queries = build_queries(config, query_pass)
            if not queries:
                break

            batches = chunk_batches(queries, settings.batch_size)
            total_queries += len(queries)
            total_batches += len(batches)

            if run_state is not None:
                run_state["query_pass"] = query_pass
                run_state["queries_total"] = len(queries)
                run_state["batches_total"] = len(batches)
                save_scrape_state(run_state, path=_active.scrape_state)

            if query_pass > 0:
                log_cb(
                    f"Starting expansion pass {query_pass + 1}/{max_pass + 1} — "
                    f"{len(queries)} queries, {len(batches)} batches."
                )

            if _is_target_reached(
                target=target,
                target_mode=mode,
                leads_saved=leads_saved,
                instantly_pushed=instantly_pushed,
            ):
                break

            if initial_resume and query_pass == int(run_state.get("query_pass", 0) if run_state else 0):
                pass_start_batch = start_batch
                pass_resume_inflight = resume_inflight
                initial_resume = False
            else:
                pass_start_batch = 0
                pass_resume_inflight = []
                if run_state is not None and query_pass > 0:
                    run_state["last_completed_batch_index"] = -1
                    run_state["last_submitted_batch_index"] = -1
                    run_state["inflight_tasks"] = []
                    save_scrape_state(run_state, path=_active.scrape_state)

            (
                leads_saved,
                leads_enriched_valid,
                leads_enriched_rejected,
                instantly_pushed,
                _last_batch_idx,
                pass_done,
            ) = await _run_concurrent_scrape(
                client=out_client,
                batches=batches,
                config=config,
                settings=settings,
                target=target,
                target_mode=mode,
                start_batch=pass_start_batch,
                run_state=run_state,
                resume_inflight=pass_resume_inflight,
                seen_domain=seen_domain,
                seen_em=seen_em,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                pending_scraped=pending_scraped,
                pending_instantly=pending_instantly,
                instantly_enabled=instantly_enabled,
                push_every=push_every,
                enrich_enabled=enrich_enabled,
                enrich_batch_size=enrich_batch_size,
                log_cb=log_cb,
                progress_cb=progress_cb,
                metric_cb=metric_cb,
                instantly_pushed=instantly_pushed,
            )

            summary["query_passes_run"] = query_pass + 1

            if _is_target_reached(
                target=target,
                target_mode=mode,
                leads_saved=leads_saved,
                instantly_pushed=instantly_pushed,
            ):
                log_cb(
                    f"Target reached — "
                    f"{instantly_pushed if mode == 'instantly_pushed' else leads_saved}/{target}."
                )
                break

            if pass_done and query_pass < max_pass:
                query_pass += 1
                continue

            if query_pass >= max_pass:
                log_cb("All query passes exhausted.")
            break

    finally:
        await out_client.aclose()

    if enrich_enabled and pending_scraped:
        log_cb(f"Final enrich flush — {len(pending_scraped)} scraped lead(s) remaining")
        (
            leads_enriched_valid,
            leads_enriched_rejected,
            instantly_pushed,
        ) = await _maybe_enrich_and_push(
            config=config,
            pending_scraped=pending_scraped,
            pending_instantly=pending_instantly,
            instantly_enabled=instantly_enabled,
            push_every=push_every,
            enrich_batch_size=enrich_batch_size,
            enrich_enabled=enrich_enabled,
            log_cb=log_cb,
            progress_cb=progress_cb,
            metric_cb=metric_cb,
            target=target,
            target_mode=mode,
            leads_saved=leads_saved,
            leads_enriched_valid=leads_enriched_valid,
            leads_enriched_rejected=leads_enriched_rejected,
            instantly_pushed=instantly_pushed,
            batches_total=total_batches,
            last_completed=-1,
            force_enrich=True,
        )

    if instantly_enabled and pending_instantly:
        flush_stats = await _flush_instantly_buffer(
            pending_instantly,
            config,
            log_cb=log_cb,
            label="final remainder",
        )
        instantly_pushed += flush_stats["pushed"]
        instantly_skipped += flush_stats["skipped_duplicate"]
        metric_cb(leads_saved, leads_enriched_valid, instantly_pushed)
        log_cb(
            f"Instantly final flush — pushed: {instantly_pushed}/{target}, "
            f"skipped (duplicate): {instantly_skipped}"
        )

    summary["leads_saved"] = leads_saved
    summary["leads_enriched_valid"] = leads_enriched_valid
    summary["leads_enriched_rejected"] = leads_enriched_rejected
    summary["instantly_pushed"] = instantly_pushed
    summary["instantly_skipped_duplicate"] = instantly_skipped
    summary["queries_total"] = total_queries
    summary["batches_total"] = total_batches

    target_reached = _is_target_reached(
        target=target,
        target_mode=mode,
        leads_saved=leads_saved,
        instantly_pushed=instantly_pushed,
    )
    progress_cb(min(instantly_pushed / target, 1.0) if mode == "instantly_pushed" and target else 1.0)

    if run_state is not None:
        run_state["instantly_skipped_duplicate"] = instantly_skipped
        run_state["leads_enriched_valid"] = leads_enriched_valid
        run_state["leads_enriched_rejected"] = leads_enriched_rejected
        if target_reached:
            mark_scrape_completed(
                run_state,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                path=paths.scrape_state,
            )
            log_cb(
                f"Pipeline complete. Instantly pushed: {instantly_pushed}/{target} "
                f"(scraped: {leads_saved}, enriched valid: {leads_enriched_valid})."
            )
        elif run_state.get("inflight_tasks"):
            run_state["leads_saved"] = leads_saved
            run_state["instantly_pushed"] = instantly_pushed
            run_state["status"] = "running"
            save_scrape_state(run_state, path=_active.scrape_state)
            log_cb(
                f"Pipeline paused. Instantly: {instantly_pushed}/{target}, "
                f"scraped: {leads_saved}, enriched valid: {leads_enriched_valid} (resume to continue)."
            )
        else:
            mark_scrape_incomplete(
                run_state,
                leads_saved=leads_saved,
                leads_enriched_valid=leads_enriched_valid,
                leads_enriched_rejected=leads_enriched_rejected,
                instantly_pushed=instantly_pushed,
                path=paths.scrape_state,
            )
            log_cb(
                f"Query space exhausted — Instantly: {instantly_pushed}/{target}, "
                f"scraped: {leads_saved}, enriched valid: {leads_enriched_valid}. "
                f"Expand keywords/locations or relax enrich keywords."
            )
    else:
        log_cb(
            f"Pipeline complete. Scraped: {leads_saved}, "
            f"enriched valid: {leads_enriched_valid}, Instantly: {instantly_pushed}."
        )

    return summary


async def run_filter_audit(
    config: dict,
    log_cb: Callable[[str], None],
    *,
    batches: int = 1,
    preset: str = "biggy_agency",
) -> dict[str, Any]:
    """Fetch N Outscraper batches and write filter_audit.csv without saving leads."""
    if not config.get("OUTSCRAPER_API_KEY"):
        raise SystemExit("OUTSCRAPER_API_KEY is required for filter-audit")

    paths = activate_output_paths(preset)
    settings = outscraper_settings(config)

    if os.path.isfile(paths.filter_audit):
        os.remove(paths.filter_audit)

    queries = build_queries(config)
    all_batches = chunk_batches(queries, settings.batch_size)
    batch_count = min(max(batches, 1), len(all_batches))

    log_cb(
        f"Filter audit — {batch_count} batch(es), batch size {settings.batch_size}, "
        f"scrape gates (email, website, dedup)"
    )
    out_client = OutscraperClient(config["OUTSCRAPER_API_KEY"])
    seen_em: set[str] = set()
    seen_domain: set[str] = set()
    accepted = 0
    rejected = 0

    try:
        for idx in range(batch_count):
            batch = all_batches[idx]
            log_cb(f"Sending audit batch {idx + 1}/{batch_count} to Outscraper...")
            task_id = await out_client.send_async_tasks(
                batch,
                settings.limit_per_query,
            )
            if not task_id:
                log_cb(f"Failed to submit batch {idx + 1}.")
                continue

            job = InflightBatch(
                batch_index=idx,
                task_id=task_id,
                submitted_at=time.time(),
            )
            results = await _poll_until_ready(out_client, job, settings, log_cb)
            if not results:
                log_cb(f"Batch {idx + 1} returned no results.")
                continue

            for query_result in results:
                b_list = query_result if isinstance(query_result, list) else [query_result]
                for b in b_list:
                    if not b or not isinstance(b, dict):
                        continue
                    row, audit = _process_business(
                        b, config, seen_domain=seen_domain, seen_em=seen_em
                    )
                    if audit:
                        _append_filter_audit_row(audit)
                        if audit["Verdict"] == "accepted":
                            accepted += 1
                            if row:
                                seen_domain.add(
                                    _company_dedup_key(row["Website"], row["Email"])
                                )
                                seen_em.add(row["Email"])
                        else:
                            rejected += 1
    finally:
        await out_client.aclose()

    total = accepted + rejected
    rate = (accepted / total * 100) if total else 0.0
    log_cb(
        f"Filter audit complete — {accepted} accepted, {rejected} rejected "
        f"({rate:.1f}% acceptance) → {paths.filter_audit}"
    )
    return {
        "batches_run": batch_count,
        "accepted": accepted,
        "rejected": rejected,
        "total": total,
        "acceptance_rate": rate,
        "audit_path": paths.filter_audit,
    }
