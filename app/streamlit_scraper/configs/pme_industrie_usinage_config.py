"""PME Industrie — Usinage scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.pme_industrie_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "pme_industrie_usinage"
PRESET_LABEL = "PME Industrie — Usinage"
SUBNICHE_LABEL = "Usinage"

_LIST_ID = "80e81580-f65c-4bd5-8466-4be04ce8a27f"
_CAMPAIGN_ID = "63fd67ab-af9d-4603-8e1d-7597319c67a9"
_SUBSEQUENCE_ID = "535da633-44bf-43d6-99ea-126bfc734525"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["aero"],
    *SIBLING_EXCLUDES["equipements"],
]

PME_INDUSTRIE_USINAGE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Usinage",
    service_rules=[
    {"label": "Usinage CNC", "keywords": ["usinage", "CNC", "mécanique de précision"]},
    {"label": "Tôlerie", "keywords": ["tôlerie", "chaudronnerie"]},
],
    keywords=[
    "usinage",
    "mécanique de précision",
    "tôlerie industrielle",
    "machines-outils",
    "fabrication métallique",
    "atelier CNC",
],
    expansion_keywords=[
    "atelier CNC",
    "chaudronnerie industrielle",
    "usinage 5 axes",
    "outillage de précision",
],
    enrich_included=[
    "usinage",
    "CNC",
    "mécanique de précision",
    "tôlerie",
    "fabrication",
    "atelier",
    "industrie",
    "B2B",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = PME_INDUSTRIE_USINAGE_CONFIG
