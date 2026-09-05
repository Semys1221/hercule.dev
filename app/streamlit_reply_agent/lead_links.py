"""Resolve per-lead CTA links from Supabase and substitute prompt variables."""

from __future__ import annotations

from typing import Any, Literal

from supabase_repo import get_client

TargetType = Literal["buyer", "seller"]

FALLBACK_BUYER = "https://www.hercule.dev/reservation.html"
FALLBACK_SELLER = "https://www.hercule.dev/reservation-entreprise.html"

_LEAD_TABLES = ("agence", "entreprise")


def cta_link_column(target_type: TargetType) -> str:
    return (
        "reservation_agence_link"
        if target_type == "buyer"
        else "reservation_entreprise_link"
    )


def fallback_cta_link(target_type: TargetType) -> str:
    return FALLBACK_BUYER if target_type == "buyer" else FALLBACK_SELLER


def _find_lead_by_email(email: str) -> dict[str, Any] | None:
    normalized = email.strip().lower()
    client = get_client()
    for table in _LEAD_TABLES:
        resp = (
            client.table(table)
            .select("*")
            .eq("email", normalized)
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0]
    return None


def resolve_lead_cta_link(lead_email: str, target_type: TargetType) -> str:
    row = _find_lead_by_email(lead_email)
    column = cta_link_column(target_type)
    if row:
        value = str(row.get(column) or "").strip()
        if value:
            return value
    return fallback_cta_link(target_type)


def apply_prompt_link_variables(
    prompt: str,
    cta_link: str,
    target_type: TargetType,
) -> str:
    agence_link = cta_link if target_type == "buyer" else fallback_cta_link("buyer")
    entreprise_link = (
        cta_link if target_type == "seller" else fallback_cta_link("seller")
    )
    result = prompt
    for key, value in (
        ("reservation_agence_link", agence_link),
        ("reservation_entreprise_link", entreprise_link),
    ):
        result = result.replace(f"{{{{{key}}}}}", value)
        result = result.replace(f"{{{key}}}", value)
    return result
