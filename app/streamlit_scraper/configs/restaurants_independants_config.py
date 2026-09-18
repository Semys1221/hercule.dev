"""Restaurants indépendants (France) scraper preset — Outscraper taxonomy gate only (fast path)."""

from french_cities import FRENCH_EXPANSION_LOCATIONS, FRENCH_LOCATIONS

PRESET_ID = "restaurants_independants"
PRESET_LABEL = "Restaurants indépendants (France)"

_LIST_ID = "2f2cfd29-2214-4310-905b-0d28f9717666"
_CAMPAIGN_ID = "e4f11e76-717e-4be9-a6ad-c7f0a331afb7"
_SUBSEQUENCE_ID = ""

RESTAURANTS_INDEPENDANTS_CONFIG = {
    "OUTSCRAPER_API_KEY": "",
    "INSTANTLY_API_KEY": "",
    "INSTANTLY_LIST_ID": _LIST_ID,
    "INSTANTLY_CAMPAIGN_ID": _CAMPAIGN_ID,
    "INSTANTLY_SUBSEQUENCE_ID": _SUBSEQUENCE_ID,
    "INSTANTLY_DEDUP_LIST_IDS": [_LIST_ID],
    "INSTANTLY_DEDUP_CAMPAIGN_IDS": [_CAMPAIGN_ID],
    "INSTANTLY_SKIP_IF_IN_CAMPAIGN": False,
    "INSTANTLY_SKIP_IF_IN_LIST": False,
    "INSTANTLY_PUSH_EVERY": 50,
    "ENRICH_ENABLED": False,
    "OUTSCRAPER_FILTERS": ["only_with_website", "operational_only"],
    "TAXONOMY_GATE_ENABLED": True,
    "TAXONOMY_INCLUDED_KEYWORDS": [
        "restaurant",
        "brasserie",
        "bistrot",
        "restauration",
        "french restaurant",
        "restaurant traditionnel",
        "restaurant français",
        "gastronomique",
    ],
    "ENRICH_INCLUDED_KEYWORDS": [],
    "ENRICH_HARD_EXCLUDED_KEYWORDS": [],
    "ENRICH_SOFT_EXCLUDED_KEYWORDS": [],
    "OUTSCRAPER_BATCH_SIZE": 200,
    "OUTSCRAPER_CONCURRENCY": 16,
    "OUTSCRAPER_LIMIT_PER_QUERY": 50,
    "OUTSCRAPER_POLL_INITIAL_S": 10,
    "OUTSCRAPER_POLL_INTERVAL_S": 5,
    "OUTSCRAPER_POLL_SLOW_S": 10,
    "OUTSCRAPER_POLL_TIMEOUT_S": 300,
    "OUTSCRAPER_TOTAL_LIMIT_BUFFER": 8,
    "TARGET_LEADS": 5000,
    "TARGET_MODE": "instantly_pushed",
    "SERVICE_DEFAULT": "Restauration",
    "SERVICE_RULES": [],
    "KEYWORDS": [
        "restaurant",
        "restaurant traditionnel",
        "brasserie",
        "bistrot",
    ],
    "EXPANSION_KEYWORDS": [
        "restaurant gastronomique",
        "restaurant familial",
    ],
    "LOCATIONS": FRENCH_LOCATIONS,
    "EXPANSION_LOCATIONS": FRENCH_EXPANSION_LOCATIONS,
    "EXCLUDE_DOMAINS": [
        "duckduckgo.com",
        "google.com",
        "google.fr",
        "facebook.com",
        "instagram.com",
        "linkedin.com",
        "youtube.com",
        "pinterest.com",
        "tiktok.com",
        "societe.com",
        "pagesjaunes.fr",
    ],
    "PAPPERS_ENABLED": False,
    "NICHE_METADATA": {
        "angle": "Lead gen pour restaurants indépendants",
        "valeur_client": "Prise de RDV avec des restaurateurs indépendants",
        "effectif_cible": "indépendant / petite équipe",
    },
}

CONFIG = RESTAURANTS_INDEPENDANTS_CONFIG
