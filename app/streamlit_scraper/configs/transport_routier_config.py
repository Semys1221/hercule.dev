"""Transport — Routier scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.transport_logistique_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "transport_routier"
PRESET_LABEL = "Transport — Routier"
SUBNICHE_LABEL = "Transport routier"

_LIST_ID = "657d1146-38af-43c3-840c-f89fac88100a"
_CAMPAIGN_ID = "bb6c3957-e83d-45be-b520-44714a2782bb"
_SUBSEQUENCE_ID = "faac9f8b-4d0a-4003-a3f4-c5e30f9302f6"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["logistique"],
    *SIBLING_EXCLUDES["demenagement"],
]

TRANSPORT_ROUTIER_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Transport routier",
    service_rules=[
    {"label": "Transport routier", "keywords": ["transport routier", "flotte", "affrètement", "messagerie"]},
],
    keywords=[
    "flotte transport routier",
    "transporteur routier",
    "commissionnaire de transport",
    "messagerie palettes",
    "affréteur régional",
    "transport marchandises",
],
    expansion_keywords=[
    "transporteur PL",
    "groupage régional",
    "transport frigorifique",
    "livraison B2B",
],
    enrich_included=[
    "transport routier",
    "flotte",
    "messagerie",
    "affrètement",
    "commissionnaire de transport",
    "livraison B2B",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = TRANSPORT_ROUTIER_CONFIG
