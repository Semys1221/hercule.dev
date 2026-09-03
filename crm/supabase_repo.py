"""Supabase CRUD for agence / entreprise link-tracking tables."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Literal

from supabase import Client, create_client

from config import require_supabase
from slug import generate_unique_slug

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


def find_by_link(client: Client, slug: str) -> tuple[LeadCategory, dict[str, Any]] | None:
    for table in TABLES:
        res = (
            client.table(table)
            .select("*")
            .eq("link", slug)
            .limit(1)
            .execute()
        )
        if res.data:
            return table, res.data[0]
    return None


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


def insert_lead(
    client: Client,
    *,
    category: LeadCategory,
    email: str,
    link: str,
    instantly_lead_id: str | None = None,
    instantly_campaign_id: str | None = None,
    first_name: str | None = None,
    company: str | None = None,
    statut: LeadStatut = "NOTBOOKED",
    calendly_questions: dict[str, Any] | None = None,
    scheduled_at: str | None = None,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "email": normalize_email(email),
        "statut": "MEETING_BOOKED" if statut == "BOOKED" else statut,
        "link": link,
        "instantly_lead_id": instantly_lead_id,
        "instantly_campaign_id": instantly_campaign_id,
        "first_name": first_name,
        "company": company,
        "calendly_questions": calendly_questions or {},
        "scheduled_at": scheduled_at,
    }
    res = client.table(category).insert(row).select("*").execute()
    if not res.data:
        raise RuntimeError(f"Failed to insert lead into {category}")
    return res.data[0]


def insert_leads_batch(
    client: Client,
    *,
    category: LeadCategory,
    rows: list[dict[str, Any]],
    batch_size: int = 100,
) -> list[dict[str, Any]]:
    inserted: list[dict[str, Any]] = []
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        res = client.table(category).insert(chunk).select("*").execute()
        inserted.extend(res.data or [])
    return inserted


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
    statut: LeadStatut = "NOTBOOKED",
    calendly_questions: dict[str, Any] | None = None,
    scheduled_at: str | None = None,
) -> dict[str, Any]:
    normalized = normalize_email(email)
    existing = find_by_email(client, normalized)
    if existing:
        raise ValueError(f"Email already exists in {existing[0]}: {normalized}")
    slug = link.strip() if link and link.strip() else generate_unique_slug(client)
    if find_by_link(client, slug):
        raise ValueError(f"Slug already exists: {slug}")
    return insert_lead(
        client,
        category=category,
        email=normalized,
        link=slug,
        instantly_lead_id=instantly_lead_id,
        instantly_campaign_id=instantly_campaign_id,
        first_name=first_name,
        company=company,
        statut=statut,
        calendly_questions=calendly_questions,
        scheduled_at=scheduled_at,
    )
