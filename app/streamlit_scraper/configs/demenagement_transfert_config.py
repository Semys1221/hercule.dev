"""Transport — Déménagement B2B scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.transport_logistique_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "demenagement_transfert"
PRESET_LABEL = "Transport — Déménagement B2B"
SUBNICHE_LABEL = "Déménagement & transfert"

_LIST_ID = "1d11b4c2-4671-49d8-9ed2-4ed0069ddf47"
_CAMPAIGN_ID = "3cab4a3a-7cdb-47cb-8729-ec7afbba03d3"
_SUBSEQUENCE_ID = "cdccfc3a-bac2-45c4-b4cd-bf723e29cf85"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["routier"],
    *SIBLING_EXCLUDES["logistique"],
]

DEMENAGEMENT_TRANSFERT_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Déménagement B2B",
    service_rules=[
    {"label": "Déménagement B2B", "keywords": ["déménagement d'entreprises", "déménagement entreprise"]},
    {"label": "Transfert industriel", "keywords": ["transfert industriel", "manutention industrielle"]},
],
    keywords=[
    "déménagement d'entreprises",
    "déménagement entreprise",
    "transfert industriel",
    "déménageur professionnel",
],
    expansion_keywords=[
    "manutention industrielle",
    "déménageur professionnel",
    "transfert machines industrielles",
],
    enrich_included=[
    "déménagement d'entreprises",
    "déménagement entreprise",
    "transfert industriel",
    "manutention industrielle",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = DEMENAGEMENT_TRANSFERT_CONFIG
