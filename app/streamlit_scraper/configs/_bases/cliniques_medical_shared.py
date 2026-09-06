"""Shared settings for Cliniques Vétérinaires & Médical Privé sub-niches."""

from configs._bases.common import (
    ENRICH_SETTINGS,
    EXCLUDE_DOMAINS,
    EXPANSION_LOCATIONS,
    LOCATIONS,
    OUTSCRAPER_SETTINGS,
    TARGET_SETTINGS,
)

NICHE_GROUP = "cliniques_medical"
NICHE_GROUP_LABEL = "Cliniques Vétérinaires & Médical Privé"

ENRICH_HARD_EXCLUDED = [
    "toilettage",
    "animalerie",
    "refuge",
    "SPA",
    "mutuelle",
    "assurance santé",
    "laboratoire pharmaceutique",
    "pharmacie",
    "auto-entrepreneur",
]

ENRICH_SOFT_EXCLUDED = [
    "formation vétérinaire",
    "école vétérinaire",
    "fournitures médicales",
    "logiciel cabinet",
]

SIBLING_EXCLUDES = {
    "veto": ["groupe vétérinaire", "clinique vétérinaire", "hôpital vétérinaire", "clinique animalière"],
    "imagerie": ["centre d'imagerie", "imagerie médicale", "scanner", "IRM", "imagerie diagnostique"],
    "dentaire_sante": ["clinique dentaire", "centre dentaire", "pôle de santé", "cabinet multi-sites"],
}

PAPPERS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 10,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 20,
    "PAPPERS_NAF_PREFIXES": [
        "75.00",
        "86.10",
        "86.21",
        "86.22",
        "86.23",
        "86.90",
    ],
}

NICHE_METADATA = {
    "angle": "SEO local, marque employeur (recrutement praticiens), portail client / app mobile, community management.",
    "valeur_client": "",
    "effectif_cible": "8 à 30 salariés (seuil scraper >= 10)",
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
