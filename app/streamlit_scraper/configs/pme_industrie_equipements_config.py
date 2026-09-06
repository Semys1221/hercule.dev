"""PME Industrie — Équipements scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.pme_industrie_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "pme_industrie_equipements"
PRESET_LABEL = "PME Industrie — Équipements"
SUBNICHE_LABEL = "Équipements"

_LIST_ID = "69d6c00a-6be4-45a1-86ea-00d5c994a1e7"
_CAMPAIGN_ID = "23cee2f0-f454-4ed9-974d-2de9a8425fd0"
_SUBSEQUENCE_ID = "638c9c8f-8798-48a5-93e6-eafc5ec00967"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["aero"],
    *SIBLING_EXCLUDES["usinage"],
]

PME_INDUSTRIE_EQUIPEMENTS_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Équipements",
    service_rules=[
    {"label": "Équipements industriels", "keywords": ["équipements industriels", "machines industrielles", "outillage"]},
    {"label": "Packaging", "keywords": ["packaging industriel", "emballage industriel"]},
    {"label": "Matériel médical", "keywords": ["matériel médical", "dispositif médical"]},
],
    keywords=[
    "équipements industriels",
    "packaging industriel",
    "matériel médical",
    "emballage industriel",
    "dispositif médical fabricant",
    "équipementier industriel",
],
    expansion_keywords=[
    "équipementier industriel",
    "emballage B2B",
    "industrie agroalimentaire équipement",
    "machines industrielles",
],
    enrich_included=[
    "équipements industriels",
    "packaging industriel",
    "matériel médical",
    "emballage industriel",
    "fabrication",
    "industrie",
    "B2B",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = PME_INDUSTRIE_EQUIPEMENTS_CONFIG
