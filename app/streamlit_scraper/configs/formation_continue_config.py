"""Formation — Continue scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.formation_cfa_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "formation_continue"
PRESET_LABEL = "Formation — Continue"
SUBNICHE_LABEL = "Formation continue"

_LIST_ID = "6d4e8863-da2e-4f54-956e-08a49787443a"
_CAMPAIGN_ID = "f2bc6216-a505-4bd7-bdc2-03c452cb04b2"
_SUBSEQUENCE_ID = "47360356-8789-4d5d-a874-7a17031e2ad1"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["ecole"],
    *SIBLING_EXCLUDES["cfa"],
]

FORMATION_CONTINUE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Formation continue",
    service_rules=[
    {"label": "Formation continue", "keywords": ["centre de formation", "formation continue", "organisme de formation", "Qualiopi"]},
],
    keywords=[
    "centre de formation continue",
    "organisme de formation B2B",
    "organisme de formation",
    "centre de formation professionnelle",
    "organisme Qualiopi",
],
    expansion_keywords=[
    "OF Qualiopi",
    "formation professionnelle continue",
    "organisme OPCO",
    "formation B2B",
],
    enrich_included=[
    "centre de formation",
    "formation continue",
    "organisme de formation",
    "Qualiopi",
    "OPCO",
    "formation B2B",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = FORMATION_CONTINUE_CONFIG
