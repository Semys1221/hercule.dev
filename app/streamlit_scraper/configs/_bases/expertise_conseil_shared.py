"""Shared settings for Expertise Comptable & Conseil sub-niches."""

from configs._bases.common import (
    ENRICH_SETTINGS,
    EXCLUDE_DOMAINS,
    EXPANSION_LOCATIONS,
    LOCATIONS,
    OUTSCRAPER_SETTINGS,
    TARGET_SETTINGS,
)

NICHE_GROUP = "expertise_conseil"
NICHE_GROUP_LABEL = "Expertise Comptable & Conseil"

ENRICH_HARD_EXCLUDED = [
    "logiciel comptable",
    "agence immobilière",
    "notaire",
    "avocat",
    "assurance auto",
    "auto-entrepreneur",
    "centre de formation",
    "agence de communication",
]

ENRICH_SOFT_EXCLUDED = [
    "ERP",
    "Sage",
    "Cegid",
    "banque",
    "crédit consommation",
    "stage comptabilité",
]

SIBLING_EXCLUDES = {
    "comptable": ["expertise comptable", "expert-comptable", "cabinet comptable", "fiduciaire", "Cerfrance"],
    "gestion": ["conseil de gestion", "conseil en gestion", "pilotage"],
    "audit_patrimoine": ["audit financier", "commissaire aux comptes", "gestion de patrimoine B2B"],
}

PAPPERS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 10,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 20,
    "PAPPERS_NAF_PREFIXES": [
        "66.30",
        "69.10",
        "69.20",
        "70.22",
    ],
}

NICHE_METADATA = {
    "angle": "Inbound marketing, organisation de webinaires, livres blancs, refonte d'image / positionnement haut de gamme.",
    "valeur_client": "",
    "effectif_cible": "10 à 40 collaborateurs",
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
