#!/usr/bin/env python3
"""Initialize Supabase bypass config + comptable E1–E3 templates for a campaign."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SUBSEQUENCE_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_SUBSEQUENCE_DIR) not in sys.path:
    sys.path.insert(0, str(_SUBSEQUENCE_DIR))

load_dotenv(_REPO_ROOT / ".env")

COMPTABLE_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"
COMPTABLE_CAMPAIGN_NAME = "Expertise Comptable"


def seed_comptable_bypass(
    *,
    campaign_id: str = COMPTABLE_CAMPAIGN_ID,
    campaign_name: str = COMPTABLE_CAMPAIGN_NAME,
) -> None:
    from config import webhook_public_url, webhook_secret
    from default_templates import COMPTABLE_TEMPLATE_BODIES
    from onboarding import initialize_campaign
    from shared.instantly_client import InstantlyClient, get_api_key
    from supabase_repo import save_template

    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("INSTANTLY_API_KEY is required")

    secret = webhook_secret()
    if not secret:
        raise RuntimeError("INSTANTLY_BYPASS_WEBHOOK_SECRET / CRON_SECRET required")

    target_url = webhook_public_url()
    client = InstantlyClient(api_key)
    initialize_campaign(
        client,
        campaign_id=campaign_id,
        campaign_name=campaign_name,
        target_url=target_url,
        secret=secret,
    )

    for key, body_html in COMPTABLE_TEMPLATE_BODIES.items():
        save_template(
            campaign_id,
            key,
            "",
            body_html,
            sync_bootstrap_default=(key == "interested_email1"),
        )

    print(f"Seeded bypass config + templates for {campaign_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--campaign-id", default=COMPTABLE_CAMPAIGN_ID)
    parser.add_argument("--campaign-name", default=COMPTABLE_CAMPAIGN_NAME)
    args = parser.parse_args()
    seed_comptable_bypass(
        campaign_id=args.campaign_id.strip(),
        campaign_name=args.campaign_name.strip(),
    )


if __name__ == "__main__":
    main()
