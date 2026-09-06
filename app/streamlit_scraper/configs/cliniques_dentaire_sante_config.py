"""Cliniques — Dentaire & Santé scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.cliniques_medical_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "cliniques_dentaire_sante"
PRESET_LABEL = "Cliniques — Dentaire & Santé"
SUBNICHE_LABEL = "Dentaire & Santé"

_LIST_ID = "f881301d-e53a-4af2-8116-5610366aca03"
_CAMPAIGN_ID = "80c7b2d6-d724-4d8f-a24c-9c14c78c31e5"
_SUBSEQUENCE_ID = "4d4054db-177d-4561-99d1-becb60a1e973"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["veto"],
    *SIBLING_EXCLUDES["imagerie"],
]

CLINIQUES_DENTAIRE_SANTE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Santé privée",
    service_rules=[
    {"label": "Dentaire", "keywords": ["clinique dentaire", "centre dentaire"]},
    {"label": "Pôle de santé", "keywords": ["pôle de santé", "cabinet multi-sites", "maison de santé"]},
],
    keywords=[
    "clinique dentaire",
    "pôle de santé privé",
    "cabinet multi-sites",
    "centre dentaire",
    "maison de santé pluridisciplinaire",
    "centre de santé",
],
    expansion_keywords=[
    "cabinet dentaire groupe",
    "pôle médical privé",
    "centre de chirurgie dentaire",
    "MSP pluriprofessionnelle",
],
    enrich_included=[
    "clinique dentaire",
    "centre dentaire",
    "pôle de santé",
    "cabinet multi-sites",
    "maison de santé",
    "praticiens",
    "chirurgie",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = CLINIQUES_DENTAIRE_SANTE_CONFIG
