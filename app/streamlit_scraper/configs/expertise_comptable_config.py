"""Expertise — Comptable scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.expertise_conseil_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "expertise_comptable"
PRESET_LABEL = "Expertise — Comptable"
SUBNICHE_LABEL = "Expertise comptable"

_LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c"
_CAMPAIGN_ID = "a32c814b-2c9c-4015-935d-da15bdea2373"
_SUBSEQUENCE_ID = "e2358943-266b-44a0-b883-cdd5c67ac495"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["gestion"],
    *SIBLING_EXCLUDES["audit_patrimoine"],
]

EXPERTISE_COMPTABLE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Expertise comptable",
    service_rules=[
    {"label": "Expertise comptable", "keywords": ["expertise comptable", "expert-comptable", "cabinet comptable", "fiduciaire"]},
],
    keywords=[
    "cabinet d'expertise comptable",
    "expert-comptable",
    "cabinet comptable",
    "fiduciaire",
    "expertise comptable PME",
    "cabinet social et fiscal",
],
    expansion_keywords=[
    "ECG",
    "Cerfrance",
    "externalisation comptable",
    "expert-comptable groupe",
    "réseau comptable régional",
],
    enrich_included=[
    "expertise comptable",
    "expert-comptable",
    "cabinet comptable",
    "fiduciaire",
    "social et fiscal",
    "liasse fiscale",
    "paie",
    "bilan",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = EXPERTISE_COMPTABLE_CONFIG
