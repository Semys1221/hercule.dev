"""Supabase CRUD for agence / entreprise link-tracking tables."""

from __future__ import annotations

import time
from functools import lru_cache
from typing import Any, Callable, Literal

from supabase import Client, create_client

from config import (
    require_supabase,
    supabase_batch_max_retries,
    supabase_insert_batch_size,
)
from slug import build_lead_urls, generate_unique_slug, lead_slug

LeadCategory = Literal["agence", "entreprise"]
LeadStatut = Literal[
    "NOTBOOKED",
    "CLICKED",
    "BOOKED",
    "MEETING_BOOKED",
    "CONFIRMED",
    "CANCELLED",
]
TABLES: tuple[LeadCategory, ...] = ("agence", "entreprise")

ChunkProgressCallback = Callable[[int, int], None]

_TRANSIENT_MARKERS = (
    "server disconnected",
    "connection reset",
    "connection aborted",
    "connection refused",
    "timeout",
    "timed out",
    "502",
    "503",
    "504",
    "broken pipe",
    "remote end closed",
)


class BatchInsertPartialError(Exception):
    """Some insert chunks succeeded before a fatal error on a later chunk."""

    def __init__(
        self,
        inserted: list[dict[str, Any]],
        remaining: list[dict[str, Any]],
        cause: Exception,
    ) -> None:
        super().__init__(str(cause))
        self.inserted = inserted
        self.remaining = remaining
        self.cause = cause


class BatchUpdatePartialError(Exception):
    """Some lead updates succeeded before others failed."""

    def __init__(
        self,
        updated: list[dict[str, Any]],
        remaining: list[tuple[str, dict[str, Any]]],
        cause: Exception,
    ) -> None:
        super().__init__(str(cause))
        self.updated = updated
        self.remaining = remaining
        self.cause = cause


def _is_transient_supabase_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(marker in msg for marker in _TRANSIENT_MARKERS)


def _is_unique_violation(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "23505" in msg or "duplicate key" in msg or "unique constraint" in msg

_EMAIL_INDEX_COLUMNS = (
    "id",
    "email",
    "slug",
    "statut",
    "reservation_agence_link",
    "reservation_entreprise_link",
    "confirmation_agence_link",
    "instantly_lead_id",
    "instantly_campaign_id",
    "first_name",
    "company",
)


def normalize_email(email: str) -> str:
    return email.strip().lower()


@lru_cache(maxsize=1)
def get_client() -> Client:
    url, key = require_supabase()
    return create_client(url, key)


def reset_client_cache() -> None:
    get_client.cache_clear()


def email_exists(client: Client, category: LeadCategory, email: str) -> bool:
    normalized = normalize_email(email)
    res = (
        client.table(category)
        .select("id")
        .eq("email", normalized)
        .limit(1)
        .execute()
    )
    return bool(res.data)


def find_by_slug(client: Client, slug: str) -> tuple[LeadCategory, dict[str, Any]] | None:
    for table in TABLES:
        res = (
            client.table(table)
            .select("*")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        if res.data:
            return table, res.data[0]
    return None


def find_by_link(client: Client, slug: str) -> tuple[LeadCategory, dict[str, Any]] | None:
    return find_by_slug(client, slug)


def find_by_email(client: Client, email: str) -> tuple[LeadCategory, dict[str, Any]] | None:
    normalized = normalize_email(email)
    for table in TABLES:
        res = (
            client.table(table)
            .select("*")
            .eq("email", normalized)
            .limit(1)
            .execute()
        )
        if res.data:
            return table, res.data[0]
    return None


def load_email_index(
    client: Client | None = None,
) -> dict[str, tuple[LeadCategory, dict[str, Any]]]:
    """Load all leads keyed by normalized email (2 Supabase queries)."""
    db = client or get_client()
    index: dict[str, tuple[LeadCategory, dict[str, Any]]] = {}
    columns = ",".join(_EMAIL_INDEX_COLUMNS)
    for table in TABLES:
        res = db.table(table).select(columns).execute()
        for row in res.data or []:
            email = normalize_email(str(row.get("email") or ""))
            if email:
                index[email] = (table, row)
    return index


def load_slug_set(client: Client | None = None) -> set[str]:
    """All slugs across agence + entreprise (2 Supabase queries)."""
    db = client or get_client()
    slugs: set[str] = set()
    for table in TABLES:
        res = db.table(table).select("slug").execute()
        for row in res.data or []:
            slug = str(row.get("slug") or "").strip()
            if slug:
                slugs.add(slug)
    return slugs


def build_refresh_patch(
    lead: dict[str, Any],
    *,
    instantly_lead_id: str | None = None,
    instantly_campaign_id: str | None = None,
) -> dict[str, Any]:
    slug = lead_slug(lead)
    email = normalize_email(str(lead.get("email") or ""))
    patch: dict[str, Any] = _url_fields(slug, email)
    if instantly_lead_id:
        patch["instantly_lead_id"] = instantly_lead_id
    if instantly_campaign_id:
        patch["instantly_campaign_id"] = instantly_campaign_id
    return patch


def build_insert_row(
    *,
    category: LeadCategory,
    email: str,
    slug: str,
    instantly_lead_id: str | None = None,
    instantly_campaign_id: str | None = None,
    first_name: str | None = None,
    company: str | None = None,
    statut: LeadStatut = "NOTBOOKED",
) -> dict[str, Any]:
    normalized = normalize_email(email)
    return {
        "email": normalized,
        "statut": "MEETING_BOOKED" if statut == "BOOKED" else statut,
        "slug": slug,
        **_url_fields(slug, normalized),
        "instantly_lead_id": instantly_lead_id,
        "instantly_campaign_id": instantly_campaign_id,
        "first_name": first_name,
        "company": company,
        "calendly_questions": {},
    }


def update_leads_batch(
    client: Client | None = None,
    *,
    category: LeadCategory,
    updates: list[tuple[str, dict[str, Any]]],
    max_workers: int = 4,
    batch_size: int | None = None,
    on_progress: ChunkProgressCallback | None = None,
) -> list[dict[str, Any]]:
    """Parallel updates in chunks with per-row retry; raises BatchUpdatePartialError if any fail."""
    if not updates:
        return []

    from concurrent.futures import ThreadPoolExecutor, as_completed

    effective_size = batch_size or supabase_insert_batch_size(len(updates))
    max_retries = supabase_batch_max_retries()
    workers = min(max_workers, effective_size, 8)
    updated: list[dict[str, Any]] = []
    failed_specs: list[tuple[str, dict[str, Any]]] = []
    last_cause: Exception | None = None
    total = len(updates)

    for start in range(0, total, effective_size):
        chunk = updates[start : start + effective_size]
        with ThreadPoolExecutor(max_workers=min(workers, len(chunk))) as pool:
            futures = {
                pool.submit(
                    _update_lead_resilient,
                    category,
                    lead_id,
                    patch,
                    max_retries=max_retries,
                    client=client,
                ): (lead_id, patch)
                for lead_id, patch in chunk
            }
            for future in as_completed(futures):
                spec = futures[future]
                try:
                    updated.append(future.result())
                except Exception as exc:
                    failed_specs.append(spec)
                    last_cause = exc

        if on_progress:
            on_progress(len(updated), total)

    if failed_specs:
        cause = last_cause or RuntimeError("One or more Supabase updates failed")
        raise BatchUpdatePartialError(updated, failed_specs, cause) from cause

    return updated


def _update_lead_resilient(
    category: LeadCategory,
    lead_id: str,
    patch: dict[str, Any],
    *,
    max_retries: int,
    client: Client | None,
) -> dict[str, Any]:
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        db = client or get_client()
        try:
            return update_lead(db, category=category, lead_id=lead_id, patch=patch)
        except Exception as exc:
            last_exc = exc
            if _is_transient_supabase_error(exc) and attempt < max_retries - 1:
                reset_client_cache()
                time.sleep(2**attempt)
                client = None
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError(f"Failed to update lead {lead_id}")


def list_all_leads(client: Client | None = None) -> list[dict[str, Any]]:
    db = client or get_client()
    rows: list[dict[str, Any]] = []
    for table in TABLES:
        res = (
            db.table(table)
            .select("*")
            .order("updated_at", desc=True)
            .execute()
        )
        for item in res.data or []:
            rows.append({**item, "category": table})
    rows.sort(key=lambda row: str(row.get("updated_at") or ""), reverse=True)
    return rows


def _url_fields(slug: str, email: str) -> dict[str, str]:
    return build_lead_urls(slug, email)


def insert_lead(
    client: Client,
    *,
    category: LeadCategory,
    email: str,
    slug: str,
    instantly_lead_id: str | None = None,
    instantly_campaign_id: str | None = None,
    first_name: str | None = None,
    company: str | None = None,
    statut: LeadStatut = "NOTBOOKED",
    calendly_questions: dict[str, Any] | None = None,
    scheduled_at: str | None = None,
    calendly_invitee_uri: str | None = None,
    calendly_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    normalized = normalize_email(email)
    row: dict[str, Any] = {
        "email": normalized,
        "statut": "MEETING_BOOKED" if statut == "BOOKED" else statut,
        "slug": slug,
        **_url_fields(slug, normalized),
        "instantly_lead_id": instantly_lead_id,
        "instantly_campaign_id": instantly_campaign_id,
        "first_name": first_name,
        "company": company,
        "calendly_questions": calendly_questions or {},
        "scheduled_at": scheduled_at,
        "calendly_invitee_uri": calendly_invitee_uri,
        "calendly_payload": calendly_payload,
    }
    res = client.table(category).insert(row).select("*").execute()
    if not res.data:
        raise RuntimeError(f"Failed to insert lead into {category}")
    return res.data[0]


def insert_leads_batch(
    client: Client | None = None,
    *,
    category: LeadCategory,
    rows: list[dict[str, Any]],
    batch_size: int | None = None,
    on_progress: ChunkProgressCallback | None = None,
) -> list[dict[str, Any]]:
    """Insert rows in chunks with retry; raises BatchInsertPartialError on partial failure."""
    if not rows:
        return []

    effective_size = batch_size or supabase_insert_batch_size(len(rows))
    max_retries = supabase_batch_max_retries()
    inserted: list[dict[str, Any]] = []
    total = len(rows)

    for start in range(0, total, effective_size):
        chunk = rows[start : start + effective_size]
        try:
            chunk_rows = _insert_chunk_resilient(
                category,
                chunk,
                max_retries=max_retries,
                client=client,
            )
        except Exception as exc:
            if inserted:
                raise BatchInsertPartialError(inserted, rows[start:], exc) from exc
            raise

        inserted.extend(chunk_rows)
        if on_progress:
            on_progress(len(inserted), total)

    return inserted


def _insert_chunk_resilient(
    category: LeadCategory,
    chunk: list[dict[str, Any]],
    *,
    max_retries: int,
    client: Client | None,
) -> list[dict[str, Any]]:
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        db = client or get_client()
        try:
            res = db.table(category).insert(chunk).select("*").execute()
            return list(res.data or [])
        except Exception as exc:
            last_exc = exc
            if _is_unique_violation(exc):
                return _insert_rows_individually(category, chunk, client=db)
            if _is_transient_supabase_error(exc) and attempt < max_retries - 1:
                reset_client_cache()
                time.sleep(2**attempt)
                client = None
                continue
            raise
    if last_exc:
        raise last_exc
    return []


def _insert_rows_individually(
    category: LeadCategory,
    rows: list[dict[str, Any]],
    *,
    client: Client | None = None,
) -> list[dict[str, Any]]:
    db = client or get_client()
    inserted: list[dict[str, Any]] = []
    for row in rows:
        try:
            res = db.table(category).insert(row).select("*").execute()
            inserted.extend(res.data or [])
        except Exception as exc:
            if not _is_unique_violation(exc):
                raise
            email = normalize_email(str(row.get("email") or ""))
            existing = find_by_email(db, email)
            if existing and existing[0] == category:
                inserted.append(existing[1])
            else:
                raise
    return inserted


def update_lead(
    client: Client,
    *,
    category: LeadCategory,
    lead_id: str,
    patch: dict[str, Any],
) -> dict[str, Any]:
    res = (
        client.table(category)
        .update(patch)
        .eq("id", lead_id)
        .select("*")
        .execute()
    )
    if not res.data:
        raise RuntimeError(f"Failed to update lead {lead_id} in {category}")
    return res.data[0]


def refresh_lead_urls(
    client: Client,
    *,
    category: LeadCategory,
    lead: dict[str, Any],
    instantly_lead_id: str | None = None,
    instantly_campaign_id: str | None = None,
) -> dict[str, Any]:
    slug = lead_slug(lead)
    email = normalize_email(str(lead.get("email") or ""))
    patch: dict[str, Any] = _url_fields(slug, email)
    if instantly_lead_id:
        patch["instantly_lead_id"] = instantly_lead_id
    if instantly_campaign_id:
        patch["instantly_campaign_id"] = instantly_campaign_id
    return update_lead(client, category=category, lead_id=lead["id"], patch=patch)


def provision_or_update_role_recovery_lead(
    client: Client,
    *,
    email: str,
    first_name: str | None = None,
    company: str | None = None,
    scheduled_at: str | None = None,
    calendly_invitee_uri: str | None = None,
    calendly_payload: dict[str, Any] | None = None,
    calendly_questions: dict[str, Any] | None = None,
    link: str | None = None,
    slug: str | None = None,
) -> dict[str, Any]:
    normalized = normalize_email(email)
    existing = find_by_email(client, normalized)
    resolved = (slug or link or "").strip() or None
    if not resolved:
        resolved = generate_unique_slug(client)

    patch: dict[str, Any] = {
        "statut": "MEETING_BOOKED",
        "first_name": first_name,
        "company": company,
        "scheduled_at": scheduled_at,
        "calendly_invitee_uri": calendly_invitee_uri,
        "calendly_payload": calendly_payload,
        "calendly_questions": calendly_questions or {},
        "slug": resolved,
        **_url_fields(resolved, normalized),
    }

    if existing:
        category, lead = existing
        if category != "agence":
            raise ValueError(f"Existing lead is in {category}, expected agence")
        return update_lead(client, category=category, lead_id=lead["id"], patch=patch)

    return insert_lead(
        client,
        category="agence",
        email=normalized,
        slug=resolved,
        first_name=first_name,
        company=company,
        statut="MEETING_BOOKED",
        calendly_questions=calendly_questions,
        scheduled_at=scheduled_at,
        calendly_invitee_uri=calendly_invitee_uri,
        calendly_payload=calendly_payload,
    )


def provision_lead(
    client: Client,
    *,
    category: LeadCategory,
    email: str,
    instantly_lead_id: str | None = None,
    instantly_campaign_id: str | None = None,
    first_name: str | None = None,
    company: str | None = None,
    link: str | None = None,
    slug: str | None = None,
    statut: LeadStatut = "NOTBOOKED",
    calendly_questions: dict[str, Any] | None = None,
    scheduled_at: str | None = None,
) -> dict[str, Any]:
    normalized = normalize_email(email)
    existing = find_by_email(client, normalized)
    if existing:
        raise ValueError(f"Email already exists in {existing[0]}: {normalized}")
    resolved = (slug or link or "").strip() or None
    if not resolved:
        resolved = generate_unique_slug(client)
    if find_by_slug(client, resolved):
        raise ValueError(f"Slug already exists: {resolved}")
    return insert_lead(
        client,
        category=category,
        email=normalized,
        slug=resolved,
        instantly_lead_id=instantly_lead_id,
        instantly_campaign_id=instantly_campaign_id,
        first_name=first_name,
        company=company,
        statut=statut,
        calendly_questions=calendly_questions,
        scheduled_at=scheduled_at,
    )
