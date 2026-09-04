"""Instantly API v2 — lead list upload with native duplicate skip flags."""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import Any, Callable

import httpx
import pandas as pd
import requests

INSTANTLY_API_BASE = "https://api.instantly.ai/api/v2"
PAGE_SIZE = 100
_MAX_RETRIES = 5
_HTTP_TIMEOUT = (10, 60)
_BULK_BATCH_SIZE = 100

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_CACHE_PATH = os.path.join(_LIB_DIR, "output", "workspace_emails.json")
WORKSPACE_CACHE_TTL_S = 6 * 3600
CSV_COLUMNS = [
    "Email",
    "Company",
    "Website",
    "Service",
    "City",
    "Type",
    "Category",
    "Subtypes",
    "Siret",
    "Siren",
    "Effectif",
    "TrancheEffectif",
    "Naf",
    "FormeJuridique",
    "AnneeCreation",
    "ChiffreAffaires",
]
_REQUIRED_CSV_COLUMNS = ["Email", "Company", "Website", "Service", "City"]


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _read_email(lead: dict[str, Any]) -> str:
    email = lead.get("email")
    if isinstance(email, str) and "@" in email:
        return _normalize_email(email)
    payload = lead.get("payload")
    if isinstance(payload, dict):
        nested = payload.get("email")
        if isinstance(nested, str) and "@" in nested:
            return _normalize_email(nested)
    return ""


class InstantlyClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key.strip()
        self.session = requests.Session()

    def _fetch(
        self,
        endpoint: str,
        *,
        method: str = "GET",
        body: dict[str, Any] | None = None,
        attempt: int = 0,
    ) -> Any:
        url = f"{INSTANTLY_API_BASE}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        response = self.session.request(
            method,
            url,
            headers=headers,
            json=body,
            timeout=_HTTP_TIMEOUT,
        )

        text = response.text or ""
        data: Any = None
        if text:
            try:
                data = response.json()
            except ValueError:
                data = text

        if response.status_code == 429 and attempt < _MAX_RETRIES:
            retry_after = response.headers.get("Retry-After", "65")
            try:
                wait_s = int(retry_after)
            except ValueError:
                wait_s = 65
            time.sleep(max(wait_s, 1))
            return self._fetch(endpoint, method=method, body=body, attempt=attempt + 1)

        if not response.ok:
            detail = data if isinstance(data, str) else json.dumps(data)
            raise RuntimeError(
                f"Instantly API {response.status_code} on {endpoint}: {detail}"
            )

        return data

    def fetch_workspace_emails(
        self,
        *,
        on_progress: Callable[[int], None] | None = None,
        max_pages: int = 500,
    ) -> set[str]:
        """Return all distinct contact emails already present in the workspace."""
        emails: set[str] = set()
        starting_after: str | None = None
        previous_cursor: str | None = None

        for _page in range(max_pages):
            body: dict[str, Any] = {
                "limit": PAGE_SIZE,
                "distinct_contacts": True,
            }
            if starting_after:
                body["starting_after"] = starting_after

            page = self._fetch("/leads/list", method="POST", body=body)
            items = page.get("items") or []
            if not items:
                break

            for item in items:
                email = _read_email(item)
                if email:
                    emails.add(email)

            if on_progress:
                on_progress(len(emails))

            next_cursor = page.get("next_starting_after")
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

    def list_all_lead_lists(self) -> list[dict[str, Any]]:
        return self._paginate_collection("/lead-lists")

    def list_all_campaigns(self) -> list[dict[str, Any]]:
        return self._paginate_collection("/campaigns")

    def create_lead_list(self, name: str) -> dict[str, Any]:
        data = self._fetch("/lead-lists", method="POST", body={"name": name})
        if not isinstance(data, dict) or not data.get("id"):
            raise RuntimeError(f"Instantly create lead list returned no id: {data!r}")
        return data

    def create_campaign(self, name: str) -> dict[str, Any]:
        data = self._fetch(
            "/campaigns",
            method="POST",
            body={
                "name": name,
                "campaign_schedule": DEFAULT_CAMPAIGN_SCHEDULE,
            },
        )
        if not isinstance(data, dict) or not data.get("id"):
            raise RuntimeError(f"Instantly create campaign returned no id: {data!r}")
        return data

    def _paginate_collection(self, base: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        starting_after: str | None = None
        previous: str | None = None
        for _ in range(200):
            path = f"{base}?limit={PAGE_SIZE}"
            if starting_after:
                path += f"&starting_after={starting_after}"
            page = self._fetch(path, method="GET")
            page_items = page.get("items") or [] if isinstance(page, dict) else []
            items.extend(item for item in page_items if isinstance(item, dict))
            next_cursor = page.get("next_starting_after") if isinstance(page, dict) else None
            if not next_cursor and page_items:
                next_cursor = page_items[-1].get("id")
            if not next_cursor or len(page_items) < PAGE_SIZE:
                break
            next_cursor = str(next_cursor)
            if next_cursor == previous:
                break
            previous = next_cursor
            starting_after = next_cursor
        return items


DEFAULT_CAMPAIGN_SCHEDULE = {
    "schedules": [
        {
            "name": "Weekdays Paris",
            "timing": {"from": "09:00", "to": "17:00"},
            "days": {
                "0": True,
                "1": True,
                "2": True,
                "3": True,
                "4": True,
                "5": False,
                "6": False,
            },
            "timezone": "Africa/Ceuta",
        }
    ]
}


def instantly_resource_name(label: str) -> str:
    clean = (label or "").strip() or "Untitled"
    return f"Hercule — {clean}"


def _match_by_name(items: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    needle = name.strip().lower()
    for item in items:
        if str(item.get("name") or "").strip().lower() == needle:
            return item
    return None


def ensure_lead_list(api_key: str, name: str) -> dict[str, Any]:
    client = InstantlyClient(api_key)
    existing = _match_by_name(client.list_all_lead_lists(), name)
    if existing:
        return existing
    return client.create_lead_list(name)


def ensure_campaign(api_key: str, name: str) -> dict[str, Any]:
    client = InstantlyClient(api_key)
    existing = _match_by_name(client.list_all_campaigns(), name)
    if existing:
        return existing
    return client.create_campaign(name)


def load_workspace_email_cache(
    *,
    max_age_s: int = WORKSPACE_CACHE_TTL_S,
    cache_path: str | None = None,
) -> set[str] | None:
    path = cache_path or WORKSPACE_CACHE_PATH
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        saved_at = float(data.get("saved_at", 0))
        if saved_at <= 0 or time.time() - saved_at > max_age_s:
            return None
        raw = data.get("emails") or []
        return {str(email).strip().lower() for email in raw if "@" in str(email)}
    except (OSError, TypeError, ValueError, json.JSONDecodeError):
        return None


def save_workspace_email_cache(
    emails: set[str],
    *,
    cache_path: str | None = None,
) -> None:
    path = cache_path or WORKSPACE_CACHE_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    payload = {
        "saved_at": time.time(),
        "count": len(emails),
        "emails": sorted(emails),
    }
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    os.replace(tmp, path)


def clear_workspace_email_cache(*, cache_path: str | None = None) -> None:
    path = cache_path or WORKSPACE_CACHE_PATH
    if os.path.isfile(path):
        os.remove(path)


def fetch_workspace_emails(
    api_key: str,
    *,
    on_progress: Callable[[int], None] | None = None,
    use_cache: bool = True,
    cache_path: str | None = None,
) -> set[str]:
    if use_cache:
        cached = load_workspace_email_cache(cache_path=cache_path)
        if cached is not None:
            if on_progress:
                on_progress(len(cached))
            return cached
    emails = InstantlyClient(api_key).fetch_workspace_emails(on_progress=on_progress)
    save_workspace_email_cache(emails, cache_path=cache_path)
    return emails


def _read_job_id(data: Any) -> str | None:
    if isinstance(data, dict):
        job_id = data.get("id")
        if isinstance(job_id, str) and job_id.strip():
            return job_id.strip()
    return None


def _count_leads(client: InstantlyClient, scope: dict[str, str]) -> int:
    total = 0
    starting_after: str | None = None
    previous_cursor: str | None = None

    for _page in range(500):
        body: dict[str, Any] = {**scope, "limit": PAGE_SIZE}
        if starting_after:
            body["starting_after"] = starting_after

        page = client._fetch("/leads/list", method="POST", body=body)
        items = page.get("items") or []
        if not items:
            break

        total += len(items)
        next_cursor = page.get("next_starting_after")
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

    return total


def count_leads_in_list(api_key: str, list_id: str) -> int:
    return _count_leads(InstantlyClient(api_key), {"list_id": list_id.strip()})


def count_leads_in_campaign(api_key: str, campaign_id: str) -> int:
    return _count_leads(InstantlyClient(api_key), {"campaign": campaign_id.strip()})


def wait_for_background_job(
    api_key: str,
    job_id: str,
    *,
    poll_s: float = 3.0,
    timeout_s: float = 3600.0,
) -> None:
    client = InstantlyClient(api_key)
    started = time.time()
    while True:
        job = client._fetch(f"/background-jobs/{job_id}", method="GET")
        status = (job.get("status") or "").lower() if isinstance(job, dict) else ""
        if status == "success":
            return
        if status in ("failed", "cancelled"):
            raise RuntimeError(f"Background job {job_id} ended with status {status}")
        if time.time() - started > timeout_s:
            raise RuntimeError(f"Background job {job_id} timed out after {timeout_s}s")
        time.sleep(poll_s)


def bulk_delete_leads(
    api_key: str,
    *,
    list_id: str | None = None,
    campaign_id: str | None = None,
) -> str | None:
    payload: dict[str, str] = {}
    if list_id:
        payload["list_id"] = list_id.strip()
    if campaign_id:
        payload["campaign_id"] = campaign_id.strip()
    if not payload:
        raise ValueError("list_id or campaign_id required for bulk delete")

    client = InstantlyClient(api_key)
    result = client._fetch("/leads", method="DELETE", body=payload)
    return _read_job_id(result)


def _purge_leads(
    api_key: str,
    *,
    list_id: str | None = None,
    campaign_id: str | None = None,
    log_cb: Callable[[str], None] | None = None,
) -> int:
    label = f"list {list_id}" if list_id else f"campaign {campaign_id}"
    deleted_total = 0
    max_passes = 500

    for pass_num in range(1, max_passes + 1):
        before = (
            count_leads_in_list(api_key, list_id)
            if list_id
            else count_leads_in_campaign(api_key, campaign_id or "")
        )
        if before == 0:
            return deleted_total

        if log_cb:
            log_cb(f"Purge pass {pass_num}: {before} lead(s) remaining in {label}")

        job_id = bulk_delete_leads(
            api_key,
            list_id=list_id,
            campaign_id=campaign_id,
        )
        if job_id:
            wait_for_background_job(api_key, job_id)
        else:
            time.sleep(2)

        after = (
            count_leads_in_list(api_key, list_id)
            if list_id
            else count_leads_in_campaign(api_key, campaign_id or "")
        )
        deleted_total += max(before - after, 0)
        if after == 0:
            return deleted_total
        if after >= before:
            raise RuntimeError(
                f"Purge stalled for {label}: {before} before, {after} after pass {pass_num}"
            )
        time.sleep(0.8)

    remaining = (
        count_leads_in_list(api_key, list_id)
        if list_id
        else count_leads_in_campaign(api_key, campaign_id or "")
    )
    if remaining > 0:
        raise RuntimeError(f"{label} still has {remaining} leads after {max_passes} purge passes")
    return deleted_total


def purge_leads_from_list(
    api_key: str,
    list_id: str,
    *,
    log_cb: Callable[[str], None] | None = None,
) -> int:
    return _purge_leads(api_key, list_id=list_id, log_cb=log_cb)


def purge_leads_from_campaign(
    api_key: str,
    campaign_id: str,
    *,
    log_cb: Callable[[str], None] | None = None,
) -> int:
    return _purge_leads(api_key, campaign_id=campaign_id, log_cb=log_cb)


def get_remediation_counts(
    api_key: str,
    list_id: str,
    campaign_id: str,
) -> dict[str, int]:
    return {
        "list_leads": count_leads_in_list(api_key, list_id),
        "campaign_leads": count_leads_in_campaign(api_key, campaign_id),
    }


def csv_push_stats(csv_path: str) -> dict[str, int]:
    """Count valid CSV emails ready to push (Instantly handles duplicate skip)."""
    if not os.path.isfile(csv_path):
        return {"total": 0, "pending": 0}
    df = pd.read_csv(csv_path)
    if df.empty or "Email" not in df.columns:
        return {"total": 0, "pending": 0}
    emails = {
        _normalize_email(str(row))
        for row in df["Email"].dropna()
        if "@" in str(row)
    }
    total = len(emails)
    return {"total": total, "pending": total}


def _lead_payload(row: dict[str, str], list_id: str) -> dict[str, Any]:
    company = (row.get("Company") or "").strip()
    return {
        "email": row["Email"],
        "first_name": company.split()[0] if company else "",
        "company_name": company,
        "website": row.get("Website") or "",
        "list_id": list_id,
        "custom_variables": {
            "city": row.get("City") or "",
            "service": row.get("Service") or "",
            "type": row.get("Type") or "",
            "category": row.get("Category") or "",
            "subtypes": row.get("Subtypes") or "",
            "siret": row.get("Siret") or "",
            "siren": row.get("Siren") or "",
            "effectif": row.get("Effectif") or "",
            "naf": row.get("Naf") or "",
            "forme_juridique": row.get("FormeJuridique") or "",
            "annee_creation": row.get("AnneeCreation") or "",
            "chiffre_affaires": row.get("ChiffreAffaires") or "",
        },
    }


def _parse_add_response(data: Any, batch_size: int) -> dict[str, int]:
    if not isinstance(data, dict):
        return {
            "pushed": 0,
            "skipped_duplicate": 0,
            "failed": batch_size,
        }
    pushed = int(data.get("leads_uploaded") or 0)
    skipped = int(data.get("skipped_count") or 0)
    failed = max(batch_size - pushed - skipped, 0)
    return {
        "pushed": pushed,
        "skipped_duplicate": skipped,
        "failed": failed,
    }


async def _upload_batch(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    list_id: str,
    batch: list[dict[str, Any]],
    log_cb: Callable[[str], None] | None = None,
) -> dict[str, int]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    batch_size = len(batch)
    try:
        response = await client.post(
            f"{INSTANTLY_API_BASE}/leads/add",
            headers=headers,
            json={
                "list_id": list_id.strip(),
                "leads": batch,
                "skip_if_in_campaign": True,
                "skip_if_in_list": True,
            },
        )
        if response.status_code in (200, 201):
            data = response.json() if response.text else {}
            stats = _parse_add_response(data, batch_size)
            if log_cb:
                log_cb(
                    f"Instantly batch: {stats['pushed']} uploaded, "
                    f"{stats['skipped_duplicate']} skipped (duplicate)"
                )
            return stats
        if log_cb:
            log_cb(
                f"Instantly batch failed ({response.status_code}): "
                f"{response.text[:200]}"
            )
        return {"pushed": 0, "skipped_duplicate": 0, "failed": batch_size}
    except Exception as exc:
        if log_cb:
            log_cb(f"Instantly batch error: {exc}")
        return {"pushed": 0, "skipped_duplicate": 0, "failed": batch_size}


async def push_leads_to_list(
    api_key: str,
    list_id: str,
    leads: list[dict[str, str]],
    *,
    log_cb: Callable[[str], None] | None = None,
) -> dict[str, int]:
    """Upload leads to a list; Instantly skips duplicates via skip_if_in_* flags."""
    if not api_key or not list_id or not leads:
        return {
            "attempted": 0,
            "pushed": 0,
            "skipped_duplicate": 0,
            "failed": 0,
        }

    to_upload: list[dict[str, Any]] = []
    for row in leads:
        email = _normalize_email(row.get("Email", ""))
        if not email or "@" not in email:
            continue
        to_upload.append(_lead_payload({**row, "Email": email}, list_id))

    attempted = len(to_upload)
    if log_cb:
        log_cb(f"Instantly upload: {attempted} candidate(s)")

    if not to_upload:
        return {
            "attempted": 0,
            "pushed": 0,
            "skipped_duplicate": 0,
            "failed": 0,
        }

    batches = [
        to_upload[start : start + _BULK_BATCH_SIZE]
        for start in range(0, len(to_upload), _BULK_BATCH_SIZE)
    ]

    pushed = 0
    skipped = 0
    failed = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        results = await asyncio.gather(
            *[
                _upload_batch(
                    client,
                    api_key=api_key,
                    list_id=list_id,
                    batch=batch,
                    log_cb=log_cb,
                )
                for batch in batches
            ]
        )

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


async def push_csv_to_instantly(
    csv_path: str,
    api_key: str,
    list_id: str,
    *,
    log_cb: Callable[[str], None] | None = None,
) -> dict[str, int]:
    """Push all valid CSV rows to Instantly (native duplicate skip, no local state)."""
    if not os.path.isfile(csv_path):
        if log_cb:
            log_cb(f"CSV not found: {csv_path}")
        return {
            "attempted": 0,
            "pushed": 0,
            "skipped_duplicate": 0,
            "failed": 0,
        }

    df = pd.read_csv(csv_path)
    missing = [c for c in _REQUIRED_CSV_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {', '.join(missing)}")

    rows: list[dict[str, str]] = []
    for _, row in df.iterrows():
        email = _normalize_email(str(row.get("Email", "")))
        if not email or "@" not in email:
            continue
        rows.append(
            {
                "Email": email,
                "Company": str(row.get("Company", "") or "").strip(),
                "Website": str(row.get("Website", "") or "").strip(),
                "Service": str(row.get("Service", "") or "").strip(),
                "City": str(row.get("City", "") or "").strip(),
                "Type": str(row.get("Type", "") or "").strip(),
                "Category": str(row.get("Category", "") or "").strip(),
                "Subtypes": str(row.get("Subtypes", "") or "").strip(),
            }
        )

    if log_cb:
        log_cb(f"CSV: {len(df)} row(s), {len(rows)} to push")

    if not rows:
        return {
            "attempted": 0,
            "pushed": 0,
            "skipped_duplicate": 0,
            "failed": 0,
        }

    return await push_leads_to_list(api_key, list_id, rows, log_cb=log_cb)
