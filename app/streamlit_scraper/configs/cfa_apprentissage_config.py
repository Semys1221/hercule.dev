"""Formation — CFA scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.formation_cfa_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "cfa_apprentissage"
PRESET_LABEL = "Formation — CFA"
SUBNICHE_LABEL = "CFA & Apprentissage"

_LIST_ID = "fac55830-d53a-4eba-bb5f-f9929f31db1a"
_CAMPAIGN_ID = "0451870b-7c36-4756-a3b2-bc9406d86fae"
_SUBSEQUENCE_ID = "58435bb2-5775-42d2-99bd-b91262ce26a3"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["continue"],
    *SIBLING_EXCLUDES["ecole"],
]

CFA_APPRENTISSAGE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="CFA",
    service_rules=[
    {"label": "CFA", "keywords": ["CFA", "apprentissage", "alternance"]},
],
    keywords=[
    "CFA régional",
    "CFA apprentissage",
    "formation en alternance",
    "centre de formation apprentissage",
],
    expansion_keywords=[
    "CFA d'entreprise",
    "apprentissage",
    "alternance professionnelle",
],
    enrich_included=[
    "CFA",
    "apprentissage",
    "alternance",
    "centre de formation",
    "formation professionnelle",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = CFA_APPRENTISSAGE_CONFIG
