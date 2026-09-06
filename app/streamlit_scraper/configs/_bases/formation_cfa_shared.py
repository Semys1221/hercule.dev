"""Shared settings for Formation, Écoles Privées & CFA sub-niches."""

from configs._bases.common import (
    ENRICH_SETTINGS,
    EXCLUDE_DOMAINS,
    EXPANSION_LOCATIONS,
    LOCATIONS,
    OUTSCRAPER_SETTINGS,
    TARGET_SETTINGS,
)

NICHE_GROUP = "formation_cfa"
NICHE_GROUP_LABEL = "Formation, Écoles Privées & CFA"

ENRICH_HARD_EXCLUDED = [
    "auto-école",
    "soutien scolaire",
    "cours particuliers",
    "e-learning freelance",
    "MOOC gratuit",
    "université publique",
    "éducation nationale",
]

ENRICH_SOFT_EXCLUDED = [
    "logiciel LMS",
    "plateforme e-learning",
    "éditeur de contenus",
    "recrutement formateurs",
]

SIBLING_EXCLUDES = {
    "continue": ["centre de formation", "formation continue", "organisme de formation", "Qualiopi"],
    "ecole": ["école supérieure", "école privée", "RNCP", "école de commerce"],
    "cfa": ["CFA", "apprentissage", "alternance"],
}

PAPPERS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 10,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 20,
    "PAPPERS_NAF_PREFIXES": [
        "85.31",
        "85.32",
        "85.41",
        "85.42",
        "85.59",
    ],
}

NICHE_METADATA = {
    "angle": "Acquisition continue (Social/Google Ads), automatisation e-mailing / Nurturing, événements / JPO virtuelles.",
    "valeur_client": "",
    "effectif_cible": "10 à 50 salariés + vacataires",
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
