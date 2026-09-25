"""Map Instantly export CSV rows to scraper-style dicts for push_leads_to_list."""

from __future__ import annotations

from typing import Any

_EMPTY = frozenset({"", "nan", "none", "<na>"})


def _as_str(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in _EMPTY:
        return ""
    return text


def resolve_email(row: dict[str, Any]) -> str:
    for key in ("Email", "contact", "email"):
        raw = _as_str(row.get(key))
        if raw and "@" in raw:
            return raw.lower()
    return ""


def _first_nonempty(row: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = _as_str(row.get(key))
        if value:
            return value
    return ""


def recovery_row_to_push_dict(
    row: dict[str, Any],
    *,
    source_file: str = "",
) -> dict[str, str]:
    """Produce keys understood by instantly_client._lead_payload."""
    email = resolve_email(row)
    company = _first_nonempty(row, "companyName", "CompanyName", "Company")
    if not company:
        first = _first_nonempty(row, "First Name")
        last = _first_nonempty(row, "Last Name")
        company = f"{first} {last}".strip()

    niche = _first_nonempty(row, "niche", "assigned_niche", "Niche", "Category")

    return {
        "Email": email,
        "Company": company,
        "Website": _first_nonempty(row, "website", "company_domain", "Website"),
        "Service": _first_nonempty(row, "Service", "jobTitle", "category"),
        "Niche": niche,
        "Subniche": _first_nonempty(row, "Subniche", "subtypes", "Subtypes"),
        "City": _first_nonempty(row, "City", "city", "location"),
        "Type": _first_nonempty(row, "Type", "Site Type"),
        "Category": _first_nonempty(row, "Category", "category"),
        "Subtypes": _first_nonempty(row, "Subtypes", "subtypes"),
        "Siret": _first_nonempty(row, "Siret", "siret"),
        "Siren": _first_nonempty(row, "Siren", "siren"),
        "Effectif": _first_nonempty(row, "Effectif", "effectif"),
        "TrancheEffectif": _first_nonempty(row, "TrancheEffectif", "tranche_effectif"),
        "Naf": _first_nonempty(row, "Naf", "naf"),
        "FormeJuridique": _first_nonempty(row, "FormeJuridique", "forme_juridique"),
        "AnneeCreation": _first_nonempty(row, "AnneeCreation", "annee_creation"),
        "ChiffreAffaires": _first_nonempty(row, "ChiffreAffaires", "chiffre_affaires"),
        "TailleEntreprise": _first_nonempty(row, "TailleEntreprise", "taille_entreprise"),
        "LeadScore": _first_nonempty(row, "LeadScore", "lead_score", "b2b_maturity_score"),
        "recovery_source_file": source_file,
        "assigned_niche_recovery": _first_nonempty(row, "assigned_niche", "niche"),
    }


def enrich_payload_custom_variables(
    payload: dict[str, Any],
    row: dict[str, str],
) -> dict[str, Any]:
    """Add recovery-specific custom variables without changing scraper _lead_payload."""
    custom = dict(payload.get("custom_variables") or {})
    if row.get("recovery_source_file"):
        custom["recovery_source_file"] = row["recovery_source_file"]
    if row.get("assigned_niche_recovery"):
        custom["assigned_niche"] = row["assigned_niche_recovery"]
    payload["custom_variables"] = custom
    return payload
