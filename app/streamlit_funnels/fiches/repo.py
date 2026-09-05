"""Supabase insert wrapper for onboarding fiches."""

from __future__ import annotations

from typing import Any

from slug import generate_unique_slug
from supabase_repo import find_by_email, get_client, insert_lead

from audiences import Audience
from fiches.profile_builder import build_default_profile, onboarding_timestamp


class DuplicateEmailError(Exception):
    pass


class OnboardingInsertError(Exception):
    pass


def create_onboarding_fiche(
    *,
    category: Audience,
    email: str,
    first_name: str,
    company: str,
    form_fields: dict[str, Any],
    profile_supported: bool = True,
) -> dict[str, Any]:
    client = get_client()
    if find_by_email(client, email):
        raise DuplicateEmailError(f"Un lead existe déjà pour {email.strip().lower()}")

    slug = generate_unique_slug(client)
    profile = build_default_profile(form_fields, category)
    now = onboarding_timestamp()

    try:
        if profile_supported:
            return insert_lead(
                client,
                category=category,
                email=email,
                slug=slug,
                first_name=first_name,
                company=company,
                statut="ONBOARDED",
                profile=profile,
                onboarding_completed_at=now,
            )
        return insert_lead(
            client,
            category=category,
            email=email,
            slug=slug,
            first_name=first_name,
            company=company,
            statut="NOTBOOKED",
        )
    except Exception as exc:
        raise OnboardingInsertError(str(exc)) from exc


def profile_columns_supported() -> bool:
    """Best-effort check whether onboarding profile columns exist."""
    client = get_client()
    try:
        resp = (
            client.table("agence")
            .select("profile, onboarding_completed_at")
            .limit(1)
            .execute()
        )
        return bool(resp.data is not None)
    except Exception:
        return False
