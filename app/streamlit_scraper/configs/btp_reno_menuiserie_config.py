"""BTP — Menuiserie scraper preset — static rules; secrets come from config_loader."""

from configs._bases.build_config import build_subniche_config
from configs._bases.btp_reno_shared import (
    ENRICH_HARD_EXCLUDED,
    ENRICH_SOFT_EXCLUDED,
    NICHE_GROUP,
    NICHE_GROUP_LABEL,
    SHARED_CONFIG,
    SIBLING_EXCLUDES,
)

PRESET_ID = "btp_reno_menuiserie"
PRESET_LABEL = "BTP — Menuiserie"
SUBNICHE_LABEL = "Menuiserie"

_LIST_ID = "81eda31c-77b3-4ab9-bae8-4ecbbf7e3f1f"
_CAMPAIGN_ID = "9706a4a0-7661-4f7d-84bc-c2a6a19c0366"
_SUBSEQUENCE_ID = "63589e63-1163-43a1-a21f-82c25b65f66f"

_HARD_EXCLUDED = [
    *ENRICH_HARD_EXCLUDED,
    *SIBLING_EXCLUDES["energie"],
    *SIBLING_EXCLUDES["promotion"],
]

BTP_RENO_MENUISERIE_CONFIG = build_subniche_config(
    SHARED_CONFIG,
    list_id=_LIST_ID,
    campaign_id=_CAMPAIGN_ID,
    subsequence_id=_SUBSEQUENCE_ID,
    service_default="Menuiserie",
    service_rules=[
    {"label": "Menuiserie extérieure", "keywords": ["menuiserie extérieure", "fenêtres", "menuiserie aluminium"]},
    {"label": "Menuiserie industrielle", "keywords": ["menuiserie industrielle", "fenêtres industrielles"]},
],
    keywords=[
    "menuiserie industrielle",
    "menuiserie extérieure",
    "fenêtres industrielles",
    "entreprise second œuvre",
    "menuiserie aluminium",
    "châssis aluminium",
],
    expansion_keywords=[
    "menuiserie aluminium",
    "fenêtres PVC professionnel",
    "menuiserie PVC alu",
    "pose menuiserie B2B",
    "fabricant menuiseries",
],
    enrich_included=[
    "menuiserie industrielle",
    "menuiserie extérieure",
    "fenêtres",
    "menuiserie aluminium",
    "châssis",
    "second œuvre",
],
    enrich_hard_excluded=_HARD_EXCLUDED,
    enrich_soft_excluded=ENRICH_SOFT_EXCLUDED,
    subniche_label=SUBNICHE_LABEL,
)

CONFIG = BTP_RENO_MENUISERIE_CONFIG
