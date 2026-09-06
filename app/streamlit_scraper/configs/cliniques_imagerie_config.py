"""Cliniques — Imagerie médicale scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.cliniques_medical_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "cliniques_imagerie"
PRESET_LABEL = "Cliniques — Imagerie médicale"
SUBNICHE_LABEL = "Imagerie médicale"

_LIST_ID = "9c72791a-bb86-4f1b-9d93-7b94fc0f79a7"
_CAMPAIGN_ID = "ef85d66c-b986-4fa7-8607-401b21ab1198"
_SUBSEQUENCE_ID = "79a2a915-8170-4d11-85b6-a708ce2596b4"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["veto"],
    *SIBLING_EXCLUDES["dentaire_sante"],
]

CLINIQUES_IMAGERIE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Imagerie médicale",
    service_rules=[
    {"label": "Imagerie médicale", "keywords": ["centre d'imagerie", "imagerie médicale", "scanner", "IRM"]},
],
    keywords=[
    "centre d'imagerie médicale",
    "imagerie médicale",
    "centre IRM",
    "centre scanner",
    "imagerie diagnostique",
],
    expansion_keywords=[
    "centre IRM",
    "imagerie diagnostique",
    "radiologie privée",
    "centre d'imagerie",
],
    enrich_included=[
    "centre d'imagerie",
    "imagerie médicale",
    "scanner",
    "IRM",
    "imagerie diagnostique",
    "radiologie",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = CLINIQUES_IMAGERIE_CONFIG
