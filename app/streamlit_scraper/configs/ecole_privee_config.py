"""Formation — École privée scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.formation_cfa_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "ecole_privee"
PRESET_LABEL = "Formation — École privée"
SUBNICHE_LABEL = "École privée"

_LIST_ID = "2c467657-91a0-463f-b1f9-ab57c50f56be"
_CAMPAIGN_ID = "cfdb3e09-dddf-4129-89f0-3fde6dcf5ef8"
_SUBSEQUENCE_ID = "b80d960d-b326-4b8b-aafe-a257fb023a97"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["continue"],
    *SIBLING_EXCLUDES["cfa"],
]

ECOLE_PRIVEE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="École privée",
    service_rules=[
    {"label": "École privée", "keywords": ["école supérieure", "école privée", "RNCP"]},
],
    keywords=[
    "école supérieure privée",
    "école privée",
    "école de commerce privée",
    "école d'ingénieurs privée",
    "campus privé",
],
    expansion_keywords=[
    "titre RNCP",
    "JPO école",
    "école d'ingénieurs privée",
    "campus privé",
],
    enrich_included=[
    "école supérieure",
    "école privée",
    "RNCP",
    "titre professionnel",
    "JPO",
    "campus",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = ECOLE_PRIVEE_CONFIG
