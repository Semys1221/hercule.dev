"""BTP — Promotion immobilière scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.btp_reno_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "btp_reno_promotion"
PRESET_LABEL = "BTP — Promotion immobilière"
SUBNICHE_LABEL = "Promotion immobilière"

_LIST_ID = "bd48575d-cdca-4e2e-90d7-a43303739c3d"
_CAMPAIGN_ID = "fce9bd25-40b6-460c-8535-27bd3b587a6d"
_SUBSEQUENCE_ID = "aed4d266-0329-418b-9b1a-100891a3333a"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["energie"],
    *SIBLING_EXCLUDES["menuiserie"],
]

BTP_RENO_PROMOTION_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Promotion immobilière",
    service_rules=[
    {"label": "Promotion immobilière", "keywords": ["promoteur régional", "promotion immobilière", "promoteur immobilier"]},
],
    keywords=[
    "promoteur régional",
    "promotion immobilière",
    "promoteur immobilier régional",
    "promoteur logements",
    "lotisseur régional",
],
    expansion_keywords=[
    "promoteur immobilier régional",
    "promotion logements neufs",
    "aménageur lotisseur",
    "programme immobilier neuf",
],
    enrich_included=[
    "promoteur régional",
    "promotion immobilière",
    "promoteur immobilier",
    "programme neuf",
    "lotissement",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = BTP_RENO_PROMOTION_CONFIG
