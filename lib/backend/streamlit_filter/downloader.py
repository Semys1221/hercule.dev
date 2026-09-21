"""Download Instantly leads and persist a local CSV backup with STATUS_FILTER."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Callable

import pandas as pd

# Prefer local re-export; fall back to shared if scraper shadows the name.
try:
    from instantly_client import fetch_leads_from_list, leads_to_dataframe
except ImportError:  # pragma: no cover
    import sys
    from pathlib import Path

    _root = Path(__file__).resolve().parents[3]
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))
    from shared.instantly_client import fetch_leads_from_list, leads_to_dataframe

from paths import output_dir

STATUS_NONE_YET = "none_yet"
STATUS_VALID = "valid"
STATUS_NON_VALID = "non_valid"

STATUS_FILTER_COL = "STATUS_FILTER"
NICHE_COL = "NICHE"
FILTER_REASON_COL = "FILTER_REASON"


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def _cv_get(cv: Any, *keys: str) -> str:
    if not isinstance(cv, dict):
        return ""
    for key in keys:
        value = cv.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def flatten_lead_row(row: dict[str, Any]) -> dict[str, Any]:
    """Flatten Instantly lead + custom_variables into a filter-friendly dict."""
    cv = row.get("custom_variables")
    if isinstance(cv, str) and cv.strip():
        try:
            cv = json.loads(cv)
        except json.JSONDecodeError:
            cv = {}
    if not isinstance(cv, dict):
        cv = {}

    niche_raw = (
        _cv_get(cv, "Niche", "niche", "NICHE")
        or str(row.get("Niche") or row.get("niche") or "").strip()
    )
    service = _cv_get(cv, "Service", "service") or str(row.get("Service") or "").strip()

    return {
        "instantly_lead_id": str(row.get("instantly_lead_id") or "").strip(),
        "email": str(row.get("email") or "").strip(),
        "first_name": str(row.get("first_name") or "").strip(),
        "last_name": str(row.get("last_name") or "").strip(),
        "company_name": str(row.get("company_name") or "").strip(),
        "website": str(row.get("website") or "").strip(),
        "phone": str(row.get("phone") or "").strip(),
        "personalization": str(row.get("personalization") or "").strip(),
        "Type": _cv_get(cv, "Type", "type"),
        "Category": _cv_get(cv, "Category", "category"),
        "Subtypes": _cv_get(cv, "Subtypes", "subtypes"),
        "City": _cv_get(cv, "City", "city"),
        "Service": service,
        "Niche_raw": niche_raw,
        "Subniche": _cv_get(cv, "Subniche", "subniche"),
        "Siret": _cv_get(cv, "Siret", "siret"),
        "Siren": _cv_get(cv, "Siren", "siren"),
        "Effectif": _cv_get(cv, "Effectif", "effectif"),
        "Naf": _cv_get(cv, "Naf", "naf"),
        "FormeJuridique": _cv_get(cv, "FormeJuridique", "forme_juridique"),
        "AnneeCreation": _cv_get(cv, "AnneeCreation", "annee_creation"),
        "ChiffreAffaires": _cv_get(cv, "ChiffreAffaires", "chiffre_affaires"),
        "TailleEntreprise": _cv_get(cv, "TailleEntreprise", "taille_entreprise"),
        "LeadScore": _cv_get(cv, "LeadScore", "lead_score"),
        "TrancheEffectif": _cv_get(cv, "TrancheEffectif", "tranche_effectif"),
        "custom_variables_json": json.dumps(cv, ensure_ascii=False),
        NICHE_COL: "",
        STATUS_FILTER_COL: STATUS_NONE_YET,
        FILTER_REASON_COL: "",
    }


def download_and_backup(
    list_id: str,
    *,
    max_leads: int | None = None,
    on_progress: Callable[[int], None] | None = None,
    prefix: str | None = None,
) -> tuple[pd.DataFrame, str]:
    """Fetch all leads from an Instantly list and write a raw backup CSV.

    Returns (flattened DataFrame with STATUS_FILTER=none_yet, csv_path).
    """
    leads = fetch_leads_from_list(
        list_id.strip(),
        max_leads=max_leads,
        on_progress=on_progress,
    )
    source_df = leads_to_dataframe(leads)
    rows = [flatten_lead_row(record) for record in source_df.to_dict(orient="records")]
    df = pd.DataFrame(rows)

    stamp = prefix or _timestamp()
    csv_path = os.path.join(output_dir(), f"raw_backup_{stamp}.csv")
    df.to_csv(csv_path, index=False)
    return df, csv_path


def load_backup_csv(csv_path: str) -> pd.DataFrame:
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(csv_path)
    df = pd.read_csv(csv_path, dtype=str).fillna("")
    if STATUS_FILTER_COL not in df.columns:
        df[STATUS_FILTER_COL] = STATUS_NONE_YET
    else:
        missing = df[STATUS_FILTER_COL].astype(str).str.strip() == ""
        df.loc[missing, STATUS_FILTER_COL] = STATUS_NONE_YET
    if NICHE_COL not in df.columns:
        df[NICHE_COL] = ""
    if FILTER_REASON_COL not in df.columns:
        df[FILTER_REASON_COL] = ""
    return df
