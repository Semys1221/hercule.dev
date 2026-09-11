"""Settings shared across all B2B niche sub-niche presets."""

from french_cities import FRENCH_EXPANSION_LOCATIONS, FRENCH_LOCATIONS

EXCLUDE_DOMAINS = [
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
]

OUTSCRAPER_SETTINGS = {
    "OUTSCRAPER_BATCH_SIZE": 200,
    "OUTSCRAPER_CONCURRENCY": 6,
    "OUTSCRAPER_LIMIT_PER_QUERY": 30,
    "OUTSCRAPER_POLL_INITIAL_S": 45,
    "OUTSCRAPER_POLL_INTERVAL_S": 5,
    "OUTSCRAPER_POLL_SLOW_S": 10,
    "OUTSCRAPER_POLL_TIMEOUT_S": 600,
    "OUTSCRAPER_TOTAL_LIMIT_BUFFER": 8,
    "OUTSCRAPER_FILTERS": [],
}

ENRICH_SETTINGS = {
    "ENRICH_ENABLED": True,
    "ENRICH_BATCH_SIZE": 50,
    "ENRICH_CONCURRENCY": 20,
    "ENRICH_TIMEOUT_MS": 10000,
}

TARGET_SETTINGS = {
    "TARGET_LEADS": 5_000,
    "TARGET_MODE": "instantly_pushed",
    "INSTANTLY_PUSH_EVERY": 100,
    "INSTANTLY_PROVISION_LINKS": False,
    "LINK_PROVISION_CATEGORY": "",
}

REGISTRY_SETTINGS = {
    "PAPPERS_ENABLED": True,
    "PAPPERS_MIN_EMPLOYEES": 3,
    "PAPPERS_MIN_SCORE": 55,
    "PAPPERS_SCORING_ENABLED": True,
    "PAPPERS_ON_UNKNOWN": "reject",
    "PAPPERS_CONCURRENCY": 50,
    "SIRENE_INDEX_ENABLED": True,
    "SIRENE_INDEX_PATH": "data/sirene.db",
    "REGISTRY_DEEP_ENRICH": False,
    "REJECT_HOLDINGS": True,
}

LOCATIONS = FRENCH_LOCATIONS
EXPANSION_LOCATIONS = FRENCH_EXPANSION_LOCATIONS
