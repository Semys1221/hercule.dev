"""URL-safe slug generation with cross-table uniqueness checks."""

from __future__ import annotations

import secrets
import string
from typing import Any
from urllib.parse import quote

from supabase import Client

from config import settings

_ALPHABET = string.ascii_letters + string.digits
_TABLES = ("agence", "entreprise")
_MAX_ATTEMPTS = 20

INSTANTLY_CANONICAL_KEYS = (
    "reservation_agence_link",
    "reservation_entreprise_link",
    "confirmation_agence_link",
    "statut",
)
INSTANTLY_DEPRECATED_KEYS = ("link", "confirm_link", "tracking_url")


def generate_slug() -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(6))


def slug_exists(client: Client, slug: str) -> bool:
    for table in _TABLES:
        res = (
            client.table(table)
            .select("id")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        if res.data:
            return True
    return False


def generate_unique_slug(client: Client) -> str:
    for _ in range(_MAX_ATTEMPTS):
        slug = generate_slug()
        if not slug_exists(client, slug):
            return slug
    raise RuntimeError(f"Cannot generate unique slug after {_MAX_ATTEMPTS} attempts")


def allocate_slugs(existing: set[str], count: int) -> list[str]:
    """Allocate unique slugs in memory without per-slug DB round-trips."""
    if count <= 0:
        return []
    allocated: list[str] = []
    reserved = set(existing)
    attempts = 0
    max_attempts = max(count * _MAX_ATTEMPTS, _MAX_ATTEMPTS)
    while len(allocated) < count:
        attempts += 1
        if attempts > max_attempts:
            raise RuntimeError(
                f"Cannot allocate {count} unique slugs after {max_attempts} attempts"
            )
        slug = generate_slug()
        if slug in reserved:
            continue
        reserved.add(slug)
        allocated.append(slug)
    return allocated


def lead_slug(row: dict[str, Any] | None) -> str:
    if not row:
        return ""
    return str(row.get("slug") or "").strip()


def build_tracking_url(base_url: str, slug: str) -> str:
    return f"{base_url.rstrip('/')}/{slug}"


def build_confirm_url(
    base_url: str, slug: str, email: str | None = None
) -> str:
    url = f"{base_url.rstrip('/')}/{slug}"
    if email:
        return f"{url}?email={quote(email.strip().lower())}"
    return url


def build_lead_urls(slug: str, email: str | None = None) -> dict[str, str]:
    trimmed = (email or "").strip()
    return {
        "reservation_agence_link": build_tracking_url(
            settings.tracking_base_url_agence, slug
        ),
        "reservation_entreprise_link": build_tracking_url(
            settings.tracking_base_url_entreprise, slug
        ),
        "confirmation_agence_link": build_confirm_url(
            settings.confirm_base_url, slug, trimmed or None
        ),
    }


def build_instantly_custom_variables(
    slug: str,
    email: str | None,
    statut: str,
) -> dict[str, str]:
    """Canonical Instantly custom_variables plus empty legacy keys (API merges)."""
    payload = {
        **build_lead_urls(slug, email),
        "statut": statut,
    }
    for key in INSTANTLY_DEPRECATED_KEYS:
        payload[key] = ""
    return payload
