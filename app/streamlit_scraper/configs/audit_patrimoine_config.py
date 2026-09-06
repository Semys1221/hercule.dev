"""Expertise — Audit & Patrimoine scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.expertise_conseil_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "audit_patrimoine"
PRESET_LABEL = "Expertise — Audit & Patrimoine"
SUBNICHE_LABEL = "Audit & Patrimoine B2B"

_LIST_ID = "0d36a8cb-a95e-47be-88c6-fea2cd8414bd"
_CAMPAIGN_ID = "520fb240-bbce-4789-80f5-7df060174bb4"
_SUBSEQUENCE_ID = "2ae68fc6-403a-4b41-bd48-c97babae67d6"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["comptable"],
    *SIBLING_EXCLUDES["gestion"],
]

AUDIT_PATRIMOINE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Audit",
    service_rules=[
    {"label": "Audit", "keywords": ["audit financier", "commissaire aux comptes", "audit"]},
    {"label": "Patrimoine B2B", "keywords": ["gestion de patrimoine B2B", "patrimoine professionnel"]},
],
    keywords=[
    "audit financier régional",
    "commissaire aux comptes",
    "gestion de patrimoine B2B",
    "audit légal",
    "commissariat aux comptes",
],
    expansion_keywords=[
    "commissariat aux comptes",
    "audit légal",
    "patrimoine professionnel",
],
    enrich_included=[
    "audit financier",
    "commissaire aux comptes",
    "audit",
    "gestion de patrimoine B2B",
    "patrimoine professionnel",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = AUDIT_PATRIMOINE_CONFIG
