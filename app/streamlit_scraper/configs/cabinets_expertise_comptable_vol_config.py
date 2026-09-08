"""Cabinets EC volume pipeline — Outscraper taxonomy gate only (no website enrich / effectif)."""

from french_cities import FRENCH_EXPANSION_LOCATIONS, FRENCH_LOCATIONS

PRESET_ID = "cabinets_expertise_comptable_vol"
PRESET_LABEL = "Cabinets EC vol (Outscraper taxonomy)"

_LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c"
_CAMPAIGN_ID = "a32c814b-2c9c-4015-935d-da15bdea2373"
_SUBSEQUENCE_ID = "e2358943-266b-44a0-b883-cdd5c67ac495"

CABINETS_EXPERTISE_COMPTABLE_VOL_CONFIG = {
    "OUTSCRAPER_API_KEY": "",
    "INSTANTLY_API_KEY": "",
    "INSTANTLY_LIST_ID": _LIST_ID,
    "INSTANTLY_CAMPAIGN_ID": _CAMPAIGN_ID,
    "INSTANTLY_SUBSEQUENCE_ID": _SUBSEQUENCE_ID,
    "INSTANTLY_DEDUP_LIST_IDS": [_LIST_ID],
    "INSTANTLY_DEDUP_CAMPAIGN_IDS": [],
    "INSTANTLY_SKIP_IF_IN_CAMPAIGN": False,
    "INSTANTLY_SKIP_IF_IN_LIST": True,
    "INSTANTLY_PUSH_EVERY": 50,
    "ENRICH_ENABLED": False,
    "OUTSCRAPER_FILTERS": ["only_with_website", "operational_only"],
    "ENRICH_INCLUDED_KEYWORDS": [],
    "ENRICH_HARD_EXCLUDED_KEYWORDS": [],
    "ENRICH_SOFT_EXCLUDED_KEYWORDS": [],
    "TAXONOMY_GATE_ENABLED": True,
    "TAXONOMY_INCLUDED_KEYWORDS": [
        "expert-comptable",
        "expert comptable",
        "expertise comptable",
        "cabinet d'expertise comptable",
        "cabinet comptable",
        "accounting firm",
        "chartered accountant",
        "comptable",
    ],
    "OUTSCRAPER_BATCH_SIZE": 200,
    "OUTSCRAPER_CONCURRENCY": 16,
    "OUTSCRAPER_LIMIT_PER_QUERY": 50,
    "OUTSCRAPER_POLL_INITIAL_S": 10,
    "OUTSCRAPER_POLL_INTERVAL_S": 5,
    "OUTSCRAPER_POLL_SLOW_S": 10,
    "OUTSCRAPER_POLL_TIMEOUT_S": 300,
    "OUTSCRAPER_TOTAL_LIMIT_BUFFER": 8,
    "TARGET_LEADS": 10000,
    "TARGET_MODE": "instantly_pushed_run",
    "SCRAPE_START_QUERY_PASS": 2,
    "SCRAPE_RELOAD_ENABLED": True,
    "SCRAPE_RELOAD_MAX_ROUNDS": 3,
    "SERVICE_DEFAULT": "Expertise comptable",
    "SERVICE_RULES": [],
    "KEYWORDS": [
        "expert comptable",
        "cabinet expertise comptable",
        "cabinet d'expertise comptable",
    ],
    "EXPANSION_KEYWORDS": [
        "expert-comptable",
        "commissaire aux comptes",
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
        "angle": "Lead gen pour cabinets d'expertise comptable",
        "valeur_client": "Prise de RDV avec des cabinets EC indépendants",
        "effectif_cible": "3+ salariés (qualif à la réponse)",
    },
}

CONFIG = CABINETS_EXPERTISE_COMPTABLE_VOL_CONFIG
