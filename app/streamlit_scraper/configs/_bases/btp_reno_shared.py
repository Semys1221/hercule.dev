"""Shared settings for BTP Second Œuvre & Rénovation sub-niches."""

from configs._bases.common import (
    ENRICH_SETTINGS,
    EXCLUDE_DOMAINS,
    EXPANSION_LOCATIONS,
    LOCATIONS,
    OUTSCRAPER_SETTINGS,
    TARGET_SETTINGS,
)

NICHE_GROUP = "btp_reno"
NICHE_GROUP_LABEL = "BTP Second Œuvre & Rénovation"

ENRICH_HARD_EXCLUDED = [
    "bricolage",
    "particulier",
    "auto-entrepreneur",
    "agence immobilière",
    "architecte d'intérieur",
    "décoration",
    "quincaillerie",
    "grande surface",
]

ENRICH_SOFT_EXCLUDED = [
    "formation BTP",
    "logiciel BTP",
    "location matériel",
    "négoce matériaux",
]

SIBLING_EXCLUDES = {
    "menuiserie": ["menuiserie industrielle", "menuiserie extérieure", "fenêtres", "menuiserie aluminium"],
    "promotion": ["promoteur régional", "promoteur immobilier", "promotion immobilière"],
    "energie": ["pompe à chaleur", "isolation thermique", "rénovation énergétique", "MaPrimeRénov", "PAC"],
}

PAPPERS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 10,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 20,
    "PAPPERS_NAF_PREFIXES": [
        "41.10",
        "41.20",
        "43.21",
        "43.22",
        "43.29",
        "43.32",
        "43.33",
        "43.91",
        "43.99",
        "33.20",
    ],
}

NICHE_METADATA = {
    "angle": "Génération de leads qualifiés (Google Ads / Meta Ads), refonte web conversion, e-réputation / avis clients.",
    "valeur_client": "10 000 € à 30 000 €",
    "effectif_cible": "10 à 50+ salariés",
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
