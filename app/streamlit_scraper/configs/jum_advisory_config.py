"""JUM Advisory outreach preset — static rules; secrets come from config_loader."""

PRESET_ID = "jum_advisory"
PRESET_LABEL = "JUM Advisory (outreach Béatrice Meyer)"

# One Instantly campaign + list per vertical (mirrors lib/admin/niches/jum-verticals.ts)
# Terrassement = BTP; TEMP - BTP list / BTP PME campaign are excluded.
JUM_VERTICALS = [
    {
        "key": "restaurant",
        "label": "Restaurant",
        "segment": "restaurant",
        "list_id": "8ad641e7-3456-42df-9281-2c11f97df1c5",
        "campaign_id": "e4f11e76-717e-4be9-a6ad-c7f0a331afb7",
        "list_name": "TEMP - RESTAURANT",
        "campaign_name": "Hercule — Restaurants indépendants (France)",
        "calendly_url": "https://calendly.com/jum-advisory/rendez-vous-comptable-restaurant",
    },
    {
        "key": "btp",
        "label": "Terrassement / BTP",
        "segment": "b2b",
        "list_id": "ef52cbe1-e6cb-4076-85bc-55ead03cb4bd",
        "campaign_id": "05bc06f8-4f60-4e6c-bae1-7afe30df38c7",
        "list_name": "TEMP - TERRASSEMENT",
        "campaign_name": "Hercule — Terrassement / VRD (France)",
        "calendly_url": "https://calendly.com/jum-advisory/rendez-vous-comptable-btp",
    },
    {
        "key": "dentiste",
        "label": "Dentiste",
        "segment": "dentiste",
        "list_id": "c4eb10d7-2285-4fc3-aa06-3230d2498d8e",
        "campaign_id": "0f0b450a-e550-461c-96f6-1a7681678d67",
        "list_name": "TEMP - DENTISTE",
        "campaign_name": "Hercule — Chirurgiens-dentistes (France)",
        "calendly_url": "https://calendly.com/jum-advisory/rendez-vous-comptable-dentiste",
    },
]

JUM_ADVISORY_CONFIG = {
    "OUTSCRAPER_API_KEY": "",
    "INSTANTLY_API_KEY": "",
    "INSTANTLY_LIST_ID": JUM_VERTICALS[0]["list_id"],
    "INSTANTLY_CAMPAIGN_ID": JUM_VERTICALS[0]["campaign_id"],
    "INSTANTLY_SUBSEQUENCE_ID": "",
    "INSTANTLY_PUSH_EVERY": 100,
    "INSTANTLY_PROVISION_LINKS": True,
    "LINK_PROVISION_CATEGORY": "jum",
    "ENRICH_ENABLED": False,
    "PRESET_ID": PRESET_ID,
    "PRESET_LABEL": PRESET_LABEL,
    "JUM_VERTICALS": JUM_VERTICALS,
    "NICHE_METADATA": {
        "angle": "Outreach secrétaire comptable JUM — restaurants, terrassement/BTP (B2B trésorerie), dentistes",
        "segments": ["restaurant", "b2b", "dentiste"],
        "verticals": ["restaurant", "btp", "dentiste"],
        "signature": "Béatrice Meyer — Secrétaire Comptable JUM — jum-advisory.com",
    },
    "KEYWORDS": [
        "restaurant",
        "terrassement",
        "btp",
        "expert-comptable",
        "cabinet comptable",
        "chirurgien-dentiste",
        "dirigeant",
    ],
    "LOCATIONS": ["France"],
    "TARGET_LEADS": 500,
    "SERVICE_DEFAULT": "Expertise comptable JUM",
}

CONFIG = JUM_ADVISORY_CONFIG
