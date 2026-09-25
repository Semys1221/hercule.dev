#!/usr/bin/env python3
"""Seed bypass E1–E3 for Restaurants DCE campaign from doc/instantly/subsequences/restaurants.md."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_SUBSEQUENCE_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_subsequence"
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"
_BACKEND_DIR = _REPO_ROOT / "lib" / "backend"
CAMPAIGN_ID = "e4f11e76-717e-4be9-a6ad-c7f0a331afb7"
CAMPAIGN_ID_V2 = "2102110d-1491-4bd0-aa24-cfd29e9a0218"
CAMPAIGN_NAME = "Hercule — Restaurants indépendants (France) — Interested"
CAMPAIGN_NAME_V2 = "Restaurants (DCE) (V2) — Interested"
ELIGIBILITY_URL = "https://www.hercule.dev/reservation/restaurant.html"
ELIGIBILITY_CTA = f'<a href="{ELIGIBILITY_URL}">Vérifier mon éligibilité</a>'
OPT_OUT = "<br/><br/><i>Répondez non si vous ne souhaitez plus de messages.</i>"
SUBJECT = "Re: votre message"
E1_WEBHOOK_DELAY_MS = 5 * 60 * 1000

E1_BODY = f"""<p>Merci pour votre réponse.<br/><br/>Vous pouvez vérifier votre éligibilité au dispositif via le lien ci-dessous.<br/><br/>{ELIGIBILITY_CTA}</p>"""

E2_BODY = f"""<p>Bonjour,<br/><br/>Je reviens vers vous suite à mon message sur les places restantes pour de nouveaux établissements.<br/><br/>Il nous reste actuellement 3 créneaux pour de nouveaux établissements.<br/><br/>Vous pouvez simplement vérifier si votre restaurant est éligible ici :<br/>{ELIGIBILITY_CTA}<br/><br/>Bien à vous,<br/>Béatrice Meyer</p>"""

E3_BODY = f"""<p>Bonjour,<br/><br/>Dernier message de mon côté.<br/><br/>Il nous reste actuellement 3 créneaux pour de nouveaux établissements.<br/><br/>Vous pouvez simplement vérifier si votre restaurant est éligible ici :<br/>{ELIGIBILITY_CTA}{OPT_OUT}<br/><br/>Bien à vous,<br/>Béatrice Meyer</p>"""


def main() -> None:
    if str(_REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(_REPO_ROOT))
    for path in (_BACKEND_DIR, _SCRAPER_DIR, _SUBSEQUENCE_DIR):
        if str(path) not in sys.path:
            sys.path.insert(0, str(path))

    load_dotenv(_REPO_ROOT / ".env")

    parser = argparse.ArgumentParser(description="Seed Restaurants DCE bypass templates")
    parser.add_argument("--campaign-id", default=CAMPAIGN_ID)
    parser.add_argument(
        "--e2-e3-only",
        action="store_true",
        help="Only clone E2/E3 from primary campaign (skip E1 overwrite)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    campaign_id = args.campaign_id.strip()
    campaign_name = (
        CAMPAIGN_NAME_V2 if campaign_id == CAMPAIGN_ID_V2 else CAMPAIGN_NAME
    )

    if args.dry_run:
        print(f"DRY RUN would seed E1–E3 for {campaign_id}")
        return

    from config import webhook_public_url, webhook_secret
    from onboarding import initialize_campaign
    from shared.instantly_client import InstantlyClient, get_api_key
    from supabase_repo import clone_templates, get_config, save_config, save_template

    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("INSTANTLY_API_KEY is required")

    secret = webhook_secret()
    if not secret:
        raise RuntimeError("INSTANTLY_BYPASS_WEBHOOK_SECRET / CRON_SECRET required")

    client = InstantlyClient(api_key)
    initialize_campaign(
        client,
        campaign_id=campaign_id,
        campaign_name=campaign_name,
        target_url=webhook_public_url(),
        secret=secret,
    )

    if campaign_id == CAMPAIGN_ID_V2:
        clone_templates(
            CAMPAIGN_ID,
            campaign_id,
            keys=("interested_email2", "interested_email3"),
            overwrite_blank_only=True,
        )

    if not args.e2_e3_only:
        save_template(
            campaign_id,
            "interested_email1",
            SUBJECT,
            E1_BODY,
            sync_bootstrap_default=True,
        )

    if campaign_id == CAMPAIGN_ID:
        for key, body in (
            ("interested_email2", E2_BODY),
            ("interested_email3", E3_BODY),
        ):
            save_template(
                campaign_id,
                key,
                SUBJECT,
                body,
                sync_bootstrap_default=False,
            )
    elif not args.e2_e3_only and campaign_id != CAMPAIGN_ID_V2:
        for key, body in (
            ("interested_email2", E2_BODY),
            ("interested_email3", E3_BODY),
        ):
            save_template(
                campaign_id,
                key,
                SUBJECT,
                body,
                sync_bootstrap_default=False,
            )

    existing = get_config(campaign_id) or {"campaign_id": campaign_id}
    save_config(
        {
            **existing,
            "campaign_id": campaign_id,
            "e1_webhook_delay_ms": E1_WEBHOOK_DELAY_MS,
        }
    )

    print(f"Seeded Restaurants DCE bypass for {campaign_id}")


if __name__ == "__main__":
    main()
