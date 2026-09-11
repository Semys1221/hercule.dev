"""Load per-niche Instantly campaign IDs from Supabase with env fallback."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Literal

from config import _env, require_supabase
from supabase import create_client

Niche = Literal["agence", "comptable", "entreprise", "cif"]
NICHE_ORDER: tuple[Niche, ...] = ("agence", "comptable", "entreprise", "cif")

_CAMPAIGN_ENV: dict[Niche, str] = {
    "agence": "INSTANTLY_CAMPAIGN_ID_AGENCE",
    "comptable": "INSTANTLY_CAMPAIGN_ID_COMPTABLE",
    "entreprise": "INSTANTLY_CAMPAIGN_ID_ENTREPRISE",
    "cif": "INSTANTLY_CAMPAIGN_ID_CIF",
}


@dataclass(frozen=True)
class NicheCampaign:
    niche: Niche
    campaign_id: str
    source: Literal["database", "env"]


def _campaign_from_env(niche: Niche) -> str | None:
    primary = _env(_CAMPAIGN_ENV[niche])
    if primary:
        return primary.strip()
    if niche == "comptable":
        return _env("COMPTABLE_CAMPAIGN_ID").strip() or None
    if niche == "entreprise":
        return _env("LINK_PROVISIONING_CAMPAIGN_ID").strip() or None
    return None


def load_niche_campaigns() -> list[NicheCampaign]:
    """Return configured campaigns in search order (agence → comptable → entreprise)."""
    rows: dict[Niche, NicheCampaign] = {}

    try:
        url, key = require_supabase()
        client = create_client(url, key)
        response = (
            client.table("niche_outreach_config")
            .select("niche, instantly_campaign_id")
            .execute()
        )
        for item in response.data or []:
            niche = str(item.get("niche") or "").strip()
            campaign_id = str(item.get("instantly_campaign_id") or "").strip()
            if niche in NICHE_ORDER and campaign_id:
                rows[niche] = NicheCampaign(
                    niche=niche,
                    campaign_id=campaign_id,
                    source="database",
                )
    except Exception:
        pass

    for niche in NICHE_ORDER:
        if niche in rows:
            continue
        campaign_id = _campaign_from_env(niche)
        if campaign_id:
            rows[niche] = NicheCampaign(
                niche=niche,
                campaign_id=campaign_id,
                source="env",
            )

    return [rows[niche] for niche in NICHE_ORDER if niche in rows]
