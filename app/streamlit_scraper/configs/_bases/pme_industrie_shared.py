"""Shared settings for PME B2B & Industrie sub-niches."""

from configs._bases.common import (
    ENRICH_SETTINGS,
    EXCLUDE_DOMAINS,
    EXPANSION_LOCATIONS,
    LOCATIONS,
    OUTSCRAPER_SETTINGS,
    TARGET_SETTINGS,
)

NICHE_GROUP = "pme_industrie"
NICHE_GROUP_LABEL = "PME B2B & Industrie"

ENRICH_HARD_EXCLUDED = [
    "grande distribution",
    "e-commerce grand public",
    "auto-entrepreneur",
    "artisan",
    "réparation automobile",
    "garage",
    "bricolage",
]

ENRICH_SOFT_EXCLUDED = [
    "formation industrielle",
    "logiciel ERP",
    "intérim",
    "recrutement industrie",
]

SIBLING_EXCLUDES = {
    "aero": ["sous-traitance aéronautique", "aéronautique", "spatial"],
    "usinage": ["usinage", "CNC", "mécanique de précision", "tôlerie", "chaudronnerie"],
    "equipements": ["équipements industriels", "packaging industriel", "matériel médical", "emballage industriel"],
}

PAPPERS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 10,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 20,
    "PAPPERS_NAF_PREFIXES": [
        "22.22",
        "25.",
        "25.62",
        "27.",
        "28.",
        "30.30",
        "32.50",
        "33.12",
        "33.20",
    ],
}

NICHE_METADATA = {
    "angle": "Refonte vitrine haut de gamme, Inbound marketing, Social Selling LinkedIn, supports salons B2B.",
    "valeur_client": "Contrats jusqu'à plusieurs centaines de k€",
    "effectif_cible": "15 à 100+ salariés",
}

SHARED_CONFIG = {
    **OUTSCRAPER_SETTINGS,
    **ENRICH_SETTINGS,
    **TARGET_SETTINGS,
    "OUTSCRAPER_API_KEY": "",
    "INSTANTLY_API_KEY": "",
    "LOCATIONS": LOCATIONS,
    "EXPANSION_LOCATIONS": EXPANSION_LOCATIONS,
    "EXCLUDE_DOMAINS": EXCLUDE_DOMAINS,
    **PAPPERS,
    "NICHE_METADATA": NICHE_METADATA,
    "NICHE_GROUP": NICHE_GROUP,
    "NICHE_GROUP_LABEL": NICHE_GROUP_LABEL,
}
