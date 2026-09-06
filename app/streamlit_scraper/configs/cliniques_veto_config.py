"""Cliniques — Vétérinaire scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.cliniques_medical_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "cliniques_veto"
PRESET_LABEL = "Cliniques — Vétérinaire"
SUBNICHE_LABEL = "Vétérinaire"

_LIST_ID = "996caf64-f615-4cfb-a280-0855b1af7c3a"
_CAMPAIGN_ID = "b841ba6a-72b0-4618-b0af-83e56cd6b955"
_SUBSEQUENCE_ID = "d577f5de-3034-4dc8-8bb1-1c149506eb44"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["imagerie"],
    *SIBLING_EXCLUDES["dentaire_sante"],
]

CLINIQUES_VETO_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Vétérinaire",
    service_rules=[
    {"label": "Vétérinaire", "keywords": ["groupe vétérinaire", "clinique vétérinaire", "hôpital vétérinaire"]},
],
    keywords=[
    "groupe vétérinaire",
    "clinique vétérinaire",
    "hôpital vétérinaire",
    "réseau vétérinaire",
    "clinique animalière",
],
    expansion_keywords=[
    "réseau vétérinaire",
    "clinique animalière",
    "groupe vétérinaire régional",
    "centre vétérinaire",
],
    enrich_included=[
    "groupe vétérinaire",
    "clinique vétérinaire",
    "hôpital vétérinaire",
    "vétérinaire",
    "praticiens",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = CLINIQUES_VETO_CONFIG
