#!/usr/bin/env python3
"""Initialize Supabase bypass config + JUM E1–E3 templates for a campaign.

Seeds interested_email1 with the vertical-specific body (restaurant / b2b / dentiste / medecin)
when --segment is provided; otherwise uses the generic interested_email1 body.
Also stores segment-keyed templates for reference.
"""

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

SEGMENT_TO_E1_KEY = {
    "restaurant": "interested_email1_restaurant",
    "b2b": "interested_email1_b2b",
    "dentiste": "interested_email1_dentiste",
    "medecin": "interested_email1_medecin",
    "kine": "interested_email1_kine",
    "avocat": "interested_email1_avocat",
    "architecte": "interested_email1_architecte",
    "veterinaire": "interested_email1_veterinaire",
}


def seed_jum_bypass(
    *,
    campaign_id: str,
    campaign_name: str = "JUM Advisory",
    segment: str | None = None,
) -> None:
    from config import webhook_public_url, webhook_secret
    from default_templates import JUM_TEMPLATE_BODIES
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

    e1_key = SEGMENT_TO_E1_KEY.get((segment or "").strip().lower())
    e1_body = (
        JUM_TEMPLATE_BODIES[e1_key]
        if e1_key and e1_key in JUM_TEMPLATE_BODIES
        else JUM_TEMPLATE_BODIES["interested_email1"]
    )

    # Primary E1 key used by the bypass handler
    save_template(
        campaign_id,
        "interested_email1",
        "Re: votre message",
        e1_body,
        sync_bootstrap_default=True,
    )

    for key, body_html in JUM_TEMPLATE_BODIES.items():
        if key == "interested_email1":
            continue
        save_template(
            campaign_id,
            key,
            "Re: votre message",
            body_html,
            sync_bootstrap_default=False,
        )

    print(
        f"Seeded JUM bypass templates for campaign {campaign_id}"
        + (f" (segment={segment})" if segment else "")
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed JUM bypass templates")
    parser.add_argument("--campaign-id", required=True)
    parser.add_argument("--campaign-name", default="JUM Advisory")
    parser.add_argument(
        "--segment",
        default=None,
        help="restaurant | b2b | dentiste | medecin — seeds interested_email1 with vertical copy",
    )
    args = parser.parse_args()
    seed_jum_bypass(
        campaign_id=args.campaign_id.strip(),
        campaign_name=args.campaign_name,
        segment=args.segment,
    )


if __name__ == "__main__":
    main()
