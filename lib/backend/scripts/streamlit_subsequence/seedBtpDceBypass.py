#!/usr/bin/env python3
"""Seed bypass E1–E3 for BTP (DCE) campaign from doc/instantly/subsequences/btp.md."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[4]
_SUBSEQUENCE_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_subsequence"
_SCRAPER_DIR = _REPO_ROOT / "lib" / "backend" / "streamlit_scraper"
_BACKEND_DIR = _REPO_ROOT / "lib" / "backend"
CAMPAIGN_ID = "25dfdcd2-2d3c-45fb-a1ea-f262dbfaa24a"
CAMPAIGN_NAME = "BTP (DCE)"
BTP_CTA_URL = "https://www.hercule.dev/reservation/btp.html"
CALENDLY_CTA = f'<a href="{BTP_CTA_URL}">Choisir un créneau</a>'
OPT_OUT = "<br/><br/><i>Répondez non si vous ne souhaitez plus de messages.</i>"
SUBJECT = "Re: votre message"
E1_WEBHOOK_DELAY_MS = 5 * 60 * 1000

E1_BODY = f"""<p>L'étude prendra environ 20 minutes.<br/><br/>À l'issue, vous saurez directement s'il vous est possible de ne plus avoir à avancer vous-même les frais de vos chantiers.<br/><br/>Si c'est accessible à votre situation, nous vous expliquerons ensuite les possibilités adaptées.<br/><br/>Vous pouvez choisir directement un créneau ici : {CALENDLY_CTA}<br/><br/>Béatrice Meyer</p>"""

E2_BODY = f"""<p>Bonjour,<br/><br/>Une entreprise du BTP peut être rentable sur le papier tout en étant tendue en trésorerie à cause des délais de paiement et des charges à avancer sur chaque chantier.<br/><br/>C'est précisément ce que nous cherchons à clarifier : décalage clients, masse salariale, fournisseurs…<br/><br/>Si vous souhaitez que nous regardions votre situation, vous pouvez choisir un créneau ici : {CALENDLY_CTA}<br/><br/>Béatrice Meyer</p>"""

E3_BODY = f"""<p>Bonjour,<br/><br/>Dernier message de mon côté.<br/><br/>Si vous avancez encore plusieurs semaines de trésorerie avant d'être payé par vos clients, nous pouvons voir quels leviers sont réalistes pour votre entreprise.<br/><br/>Vous pouvez directement choisir un créneau ici : {CALENDLY_CTA}{OPT_OUT}<br/><br/>Béatrice Meyer</p>"""


def main() -> None:
    if str(_REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(_REPO_ROOT))
    for path in (_BACKEND_DIR, _SCRAPER_DIR, _SUBSEQUENCE_DIR):
        if str(path) not in sys.path:
            sys.path.insert(0, str(path))

    load_dotenv(_REPO_ROOT / ".env")

    parser = argparse.ArgumentParser(description="Seed BTP DCE bypass templates")
    parser.add_argument("--campaign-id", default=CAMPAIGN_ID)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    campaign_id = args.campaign_id.strip()

    if args.dry_run:
        print(f"DRY RUN would seed E1–E3 for {campaign_id}")
        return

    from config import webhook_public_url, webhook_secret
    from onboarding import initialize_campaign
    from shared.instantly_client import InstantlyClient, get_api_key
    from supabase_repo import get_config, save_config, save_template

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
        campaign_name=CAMPAIGN_NAME,
        target_url=webhook_public_url(),
        secret=secret,
    )

    for key, body in (
        ("interested_email1", E1_BODY),
        ("interested_email1_b2b", E1_BODY),
        ("interested_email2", E2_BODY),
        ("interested_email3", E3_BODY),
    ):
        save_template(
            campaign_id,
            key,
            SUBJECT,
            body,
            sync_bootstrap_default=key == "interested_email1",
        )

    existing = get_config(campaign_id) or {"campaign_id": campaign_id}
    save_config(
        {
            **existing,
            "campaign_id": campaign_id,
            "e1_webhook_delay_ms": E1_WEBHOOK_DELAY_MS,
        }
    )

    print(f"Seeded BTP DCE bypass for {campaign_id}")


if __name__ == "__main__":
    main()
