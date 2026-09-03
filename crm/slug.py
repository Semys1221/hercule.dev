"""URL-safe slug generation with cross-table uniqueness checks."""

from __future__ import annotations

import secrets
import string

from supabase import Client

_ALPHABET = string.ascii_letters + string.digits
_TABLES = ("agence", "entreprise")
_MAX_ATTEMPTS = 20


def generate_slug() -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(6))


def slug_exists(client: Client, slug: str) -> bool:
    for table in _TABLES:
        res = (
            client.table(table)
            .select("id")
            .eq("link", slug)
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


def build_tracking_url(base_url: str, slug: str) -> str:
    return f"{base_url.rstrip('/')}/{slug}"


def build_confirm_url(
    base_url: str, slug: str, email: str | None = None
) -> str:
    url = f"{base_url.rstrip('/')}/{slug}"
    if email:
        from urllib.parse import quote

        return f"{url}?email={quote(email.strip().lower())}"
    return url
