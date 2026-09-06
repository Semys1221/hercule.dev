"""PME Industrie — Aéronautique scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.pme_industrie_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "pme_industrie_aero"
PRESET_LABEL = "PME Industrie — Aéronautique"
SUBNICHE_LABEL = "Aéronautique"

_LIST_ID = "cd188019-1d57-4513-bcbe-3a57342c38f2"
_CAMPAIGN_ID = "c77224e5-2816-4c1a-8ab3-b7312ccc2893"
_SUBSEQUENCE_ID = "2fea46b7-f568-450d-9fa5-ee23887e08ca"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["usinage"],
    *SIBLING_EXCLUDES["equipements"],
]

PME_INDUSTRIE_AERO_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Aéronautique",
    service_rules=[
    {"label": "Aéronautique", "keywords": ["sous-traitance aéronautique", "aéronautique", "spatial"]},
],
    keywords=[
    "sous-traitance aéronautique",
    "équipementier aéronautique",
    "sous-traitant aéronautique",
    "usinage aéronautique",
    "mécanique aéronautique",
],
    expansion_keywords=[
    "sous-traitant aéronautique",
    "industrie spatiale",
    "équipement aéronautique",
    "tôlerie aéronautique",
],
    enrich_included=[
    "sous-traitance aéronautique",
    "aéronautique",
    "spatial",
    "équipementier aéronautique",
    "industrie",
    "B2B",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = PME_INDUSTRIE_AERO_CONFIG
