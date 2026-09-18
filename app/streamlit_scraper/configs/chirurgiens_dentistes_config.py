"""Chirurgiens-dentistes (France) scraper preset — Outscraper taxonomy gate only (fast path)."""

from french_cities import FRENCH_EXPANSION_LOCATIONS, FRENCH_LOCATIONS

PRESET_ID = "chirurgiens_dentistes"
PRESET_LABEL = "Chirurgiens-dentistes (France)"

_LIST_ID = "d97775c2-8708-40a6-9cb8-5844da8d2e0d"
_CAMPAIGN_ID = "0f0b450a-e550-461c-96f6-1a7681678d67"
_SUBSEQUENCE_ID = ""

CHIRURGIENS_DENTISTES_CONFIG = {
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
        "chirurgien-dentiste",
        "chirurgien dentiste",
        "cabinet dentaire",
        "dentiste",
        "soins dentaires",
        "orthodontie",
        "dental clinic",
        "dentist",
        "orthodontist",
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
    "SERVICE_DEFAULT": "Chirurgie dentaire",
    "SERVICE_RULES": [],
    "KEYWORDS": [
        "chirurgien dentiste",
        "cabinet dentaire",
        "dentiste",
    ],
    "EXPANSION_KEYWORDS": [
        "chirurgien-dentiste",
        "soins dentaires",
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
        "angle": "Lead gen pour cabinets de chirurgiens-dentistes",
        "valeur_client": "Prise de RDV avec des cabinets dentaires indépendants",
        "effectif_cible": "2+ salariés",
    },
}

CONFIG = CHIRURGIENS_DENTISTES_CONFIG
