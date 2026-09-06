"""BTP — Rénovation énergétique scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.btp_reno_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "btp_reno_energie"
PRESET_LABEL = "BTP — Rénovation énergétique"
SUBNICHE_LABEL = "Rénovation énergétique"

_LIST_ID = "10662691-bd35-4806-ad8c-1beb81540f57"
_CAMPAIGN_ID = "3acdf169-34da-4cd2-b50d-ff3dd67e64c8"
_SUBSEQUENCE_ID = "469b2b11-7088-4236-9009-8c3ff6a9a4cd"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["menuiserie"],
    *SIBLING_EXCLUDES["promotion"],
]

BTP_RENO_ENERGIE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Rénovation énergétique",
    service_rules=[
    {"label": "Pompe à chaleur", "keywords": ["pompe à chaleur", "PAC", "installateur CVC", "climatisation"]},
    {"label": "Isolation", "keywords": ["isolation thermique", "ITE", "ITE isolation"]},
    {"label": "Rénovation globale", "keywords": ["rénovation globale", "rénovation énergétique", "MaPrimeRénov", "audit énergétique"]},
],
    keywords=[
    "installateur pompe à chaleur",
    "isolation thermique",
    "rénovation énergétique",
    "entreprise isolation ITE",
    "installateur CVC",
    "rénovation globale",
],
    expansion_keywords=[
    "PAC air eau",
    "MaPrimeRénov entreprise",
    "audit énergétique",
    "ITE façade",
    "rénovation BBC",
    "installateur climatisation",
],
    enrich_included=[
    "pompe à chaleur",
    "isolation thermique",
    "rénovation énergétique",
    "rénovation globale",
    "ITE",
    "installateur CVC",
    "chauffage",
    "climatisation",
    "MaPrimeRénov",
    "audit énergétique",
    "second œuvre",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = BTP_RENO_ENERGIE_CONFIG
