#!/usr/bin/env python3
"""Initialize Supabase bypass config + Agence web 2 E1–E3 templates and Instantly webhook."""

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

AGENCE_WEB_2_CAMPAIGN_ID = "6864f739-36ff-4406-89c5-9bee42b8fa21"
AGENCE_WEB_2_CAMPAIGN_NAME = "Agence web 2"


def seed_agence_web_2_bypass(
    *,
    campaign_id: str = AGENCE_WEB_2_CAMPAIGN_ID,
    campaign_name: str = AGENCE_WEB_2_CAMPAIGN_NAME,
) -> None:
    from config import webhook_public_url, webhook_secret
    from default_templates import AGENCE_WEB_2_TEMPLATE_BODIES
    from onboarding import derive_onboarding_status, initialize_campaign
    from shared.instantly_client import InstantlyClient, get_api_key
    from supabase_repo import get_config, list_templates, save_template

    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("INSTANTLY_API_KEY is required")

    secret = webhook_secret()
    if not secret:
        raise RuntimeError("INSTANTLY_BYPASS_WEBHOOK_SECRET / CRON_SECRET required")

    target_url = webhook_public_url()
    client = InstantlyClient(api_key)
    config = initialize_campaign(
        client,
        campaign_id=campaign_id,
        campaign_name=campaign_name,
        target_url=target_url,
        secret=secret,
    )

    for key, body_html in AGENCE_WEB_2_TEMPLATE_BODIES.items():
        save_template(
            campaign_id,
            key,
            "Re: question clients",
            body_html,
            sync_bootstrap_default=(key == "interested_email1"),
        )

    templates = list_templates(campaign_id)
    status = derive_onboarding_status(
        has_config=bool(config),
        has_webhook=bool(config.get("webhook_id")),
        copy_complete=all(
            str((row.get("body_html") or "")).strip()
            for row in templates
            if row.get("template_key") in ("interested_email1", "interested_email2", "interested_email3")
        ),
    )
    refreshed = get_config(campaign_id) or config
    print(f"Seeded bypass for {campaign_id} ({campaign_name})")
    print(f"  webhook_id: {refreshed.get('webhook_id')}")
    print(f"  onboarding_status: {status}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--campaign-id", default=AGENCE_WEB_2_CAMPAIGN_ID)
    parser.add_argument("--campaign-name", default=AGENCE_WEB_2_CAMPAIGN_NAME)
    args = parser.parse_args()
    seed_agence_web_2_bypass(
        campaign_id=args.campaign_id.strip(),
        campaign_name=args.campaign_name.strip(),
    )


if __name__ == "__main__":
    main()
