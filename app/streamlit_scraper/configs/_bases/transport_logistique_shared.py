"""Shared settings for Transport, Logistique & Déménagement B2B sub-niches."""

from configs._bases.common import (
    ENRICH_SETTINGS,
    EXCLUDE_DOMAINS,
    EXPANSION_LOCATIONS,
    LOCATIONS,
    OUTSCRAPER_SETTINGS,
    TARGET_SETTINGS,
)

NICHE_GROUP = "transport_logistique"
NICHE_GROUP_LABEL = "Transport, Logistique & Déménagement B2B"

ENRICH_HARD_EXCLUDED = [
    "VTC",
    "taxi",
    "livraison de repas",
    "coursier vélo",
    "déménagement particulier uniquement",
    "auto-entrepreneur",
    "location voiture",
]

ENRICH_SOFT_EXCLUDED = [
    "formation transport",
    "logiciel TMS",
    "annonces d'emploi",
    "comparateur déménagement",
]

SIBLING_EXCLUDES = {
    "routier": ["transport routier", "flotte", "affrètement", "messagerie", "transporteur PL"],
    "logistique": ["logistique régionale", "entreposage", "entrepôt", "supply chain", "3PL"],
    "demenagement": ["déménagement d'entreprises", "déménagement entreprise", "transfert industriel"],
}

PAPPERS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 10,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 20,
    "PAPPERS_NAF_PREFIXES": [
        "49.39",
        "49.41",
        "49.42",
        "52.10",
        "52.29",
    ],
}

NICHE_METADATA = {
    "angle": "Acquisition prospects B2B, SEA géolocalisé, vidéo institutionnelle de preuve de capacité.",
    "valeur_client": "",
    "effectif_cible": "20 à 100+ salariés",
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
