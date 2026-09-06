"""Transport — Logistique scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.transport_logistique_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "logistique_entreposage"
PRESET_LABEL = "Transport — Logistique"
SUBNICHE_LABEL = "Logistique & entreposage"

_LIST_ID = "ca3cae64-c795-462f-bcdb-4503b7653948"
_CAMPAIGN_ID = "e5aceb77-537a-46f1-be23-bda58252ae46"
_SUBSEQUENCE_ID = "3f1f3daf-430a-4299-b88c-d5ee97f7ed6b"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["routier"],
    *SIBLING_EXCLUDES["demenagement"],
]

LOGISTIQUE_ENTREPOSAGE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Logistique",
    service_rules=[
    {"label": "Logistique", "keywords": ["logistique régionale", "entreposage", "entrepôt", "supply chain"]},
],
    keywords=[
    "logistique régionale",
    "entreposage logistique",
    "logistique B2B",
    "entrepôt logistique",
    "prestataire 3PL",
],
    expansion_keywords=[
    "entrepôt logistique",
    "prestataire 3PL",
    "supply chain",
    "logistique B2B",
],
    enrich_included=[
    "logistique régionale",
    "entreposage",
    "entrepôt",
    "supply chain",
    "logistique",
    "livraison B2B",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = LOGISTIQUE_ENTREPOSAGE_CONFIG
