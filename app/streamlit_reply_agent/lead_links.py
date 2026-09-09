"""Resolve per-lead CTA links from Supabase and substitute prompt variables."""

from __future__ import annotations

from typing import Any, Literal, TypedDict

from supabase_repo import get_client

TargetType = Literal["buyer", "seller"]

FALLBACK_BUYER = "https://www.hercule.dev/reservation.html"
FALLBACK_SELLER = "https://www.hercule.dev/reservation-entreprise.html"

_LEAD_TABLES = ("agence", "comptable", "entreprise")


class PromptLinks(TypedDict):
    primary: str
    agence_link: str
    entreprise_link: str
    comptable_link: str


def cta_link_column(target_type: TargetType) -> str:
    return (
        "reservation_agence_link"
        if target_type == "buyer"
        else "reservation_entreprise_link"
    )


def fallback_cta_link(target_type: TargetType) -> str:
    return FALLBACK_BUYER if target_type == "buyer" else FALLBACK_SELLER


def _find_lead_by_email(email: str) -> tuple[str | None, dict[str, Any] | None]:
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
            return table, resp.data[0]
    return None, None


def resolve_prompt_links(lead_email: str, target_type: TargetType) -> PromptLinks:
    category, row = _find_lead_by_email(lead_email)
    agence_link = fallback_cta_link("buyer")
    entreprise_link = fallback_cta_link("seller")
    comptable_link = entreprise_link

    if row:
        agence = str(row.get("reservation_agence_link") or "").strip()
        if agence:
            agence_link = agence
        entreprise = str(row.get("reservation_entreprise_link") or "").strip()
        if entreprise:
            entreprise_link = entreprise
        comptable = str(row.get("reservation_comptable_link") or "").strip()
        if comptable:
            comptable_link = comptable

    if category == "comptable":
        primary = comptable_link
    elif target_type == "buyer":
        primary = agence_link
    else:
        primary = entreprise_link

    return {
        "primary": primary,
        "agence_link": agence_link,
        "entreprise_link": entreprise_link,
        "comptable_link": comptable_link,
    }


def resolve_lead_cta_link(lead_email: str, target_type: TargetType) -> str:
    return resolve_prompt_links(lead_email, target_type)["primary"]


def apply_prompt_link_variables(
    prompt: str,
    cta_link: str,
    target_type: TargetType,
    links: PromptLinks | None = None,
) -> str:
    if links:
        agence_link = links["agence_link"]
        entreprise_link = links["entreprise_link"]
        comptable_link = links["comptable_link"]
    else:
        agence_link = cta_link if target_type == "buyer" else fallback_cta_link("buyer")
        entreprise_link = (
            cta_link if target_type == "seller" else fallback_cta_link("seller")
        )
        comptable_link = (
            cta_link
            if "reservation_comptable_link" in prompt
            else entreprise_link
        )

    result = prompt
    for key, value in (
        ("reservation_agence_link", agence_link),
        ("reservation_entreprise_link", entreprise_link),
        ("reservation_comptable_link", comptable_link),
    ):
        result = result.replace(f"{{{{{key}}}}}", value)
        result = result.replace(f"{{{key}}}", value)
    return result
