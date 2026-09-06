"""Expertise — Conseil de gestion scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.expertise_conseil_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "conseil_gestion"
PRESET_LABEL = "Expertise — Conseil de gestion"
SUBNICHE_LABEL = "Conseil de gestion"

_LIST_ID = "eb3e0274-ffff-493c-a1a8-cb291f9762aa"
_CAMPAIGN_ID = "0129e4d4-339e-4cf3-a70b-db6790cfd74f"
_SUBSEQUENCE_ID = "dfd056f3-e5e8-455f-a8bf-90bb74c731c7"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["comptable"],
    *SIBLING_EXCLUDES["audit_patrimoine"],
]

CONSEIL_GESTION_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Conseil de gestion",
    service_rules=[
    {"label": "Conseil de gestion", "keywords": ["conseil de gestion", "conseil en gestion", "pilotage"]},
],
    keywords=[
    "conseil de gestion",
    "conseil en gestion",
    "cabinet conseil gestion",
    "pilotage entreprise",
    "conseil organisationnel",
],
    expansion_keywords=[
    "conseil juridique fiscal",
    "gestion paie",
    "pilotage PME",
    "conseil stratégique PME",
],
    enrich_included=[
    "conseil de gestion",
    "conseil en gestion",
    "pilotage",
    "organisation",
    "gestion",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = CONSEIL_GESTION_CONFIG
