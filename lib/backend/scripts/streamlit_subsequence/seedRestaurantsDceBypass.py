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
CAMPAIGN_NAME = "Hercule — Restaurants indépendants (France) — Interested"
CALENDLY = "https://calendly.com/jum-advisory/rentabilite-restaurant"
CTA = f'<a href="{CALENDLY}">Réserver un créneau</a>'
OPT_OUT = "<br/><br/><i>Répondez non si vous ne souhaitez plus de messages.</i>"
SUBJECT = "Re: votre message"

E1_BODY = f"""<p>Voici les précisions.<br/><br/>Notre accompagnement ajuste chaque semaine, pour votre restaurant, ces 3 points :<br/><br/><ul><li><strong>Vous achetez trop cher sans forcément le voir :</strong> nous négocions vos prix fournisseurs et le coût réel de vos plats.</li><li><strong>Vous vendez certains plats sans réellement gagner d'argent :</strong> nous recalculons leur coût réel afin d'identifier les prix à ajuster ou les plats à modifier.</li><li><strong>Votre personnel vous coûte peut-être plus qu'il ne devrait :</strong> nous analysons vos heures, vos plannings et vos coûts pour repérer ce qui pèse inutilement sur votre marge.</li></ul><br/>Les établissements éligibles peuvent généralement dégager jusqu'à 2 500 € de marge nette supplémentaire dès le premier mois.<br/><br/>Si vous souhaitez que nous analysions votre restaurant, vous pouvez choisir un créneau ici :<br/><a href="{CALENDLY}">{CALENDLY}</a></p>"""

E2_BODY = f"""<p>Bonjour,<br/><br/>Un restaurant peut bien fonctionner tout en perdant une partie de sa marge.<br/><br/>C'est précisément ce que nous cherchons à identifier.<br/><br/>Si vous souhaitez que nous regardions votre restaurant :<br/><a href="{CALENDLY}">{CALENDLY}</a><br/><br/>Béatrice Meyer</p>"""

E3_BODY = f"""<p>Bonjour,<br/><br/>Dernier message de mon côté.<br/><br/>Si vous avez le sentiment de beaucoup travailler pour un bénéfice qui reste trop faible, nous pouvons regarder où votre marge disparaît et ce qui peut être amélioré.<br/><br/>Vous pouvez directement choisir un créneau ici : {CTA}{OPT_OUT}<br/><br/>Béatrice Meyer</p>"""


def main() -> None:
    if str(_REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(_REPO_ROOT))
    for path in (_BACKEND_DIR, _SCRAPER_DIR, _SUBSEQUENCE_DIR):
        if str(path) not in sys.path:
            sys.path.insert(0, str(path))

    load_dotenv(_REPO_ROOT / ".env")

    parser = argparse.ArgumentParser(description="Seed Restaurants DCE bypass templates")
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
    from supabase_repo import save_template

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
        ("interested_email2", E2_BODY),
        ("interested_email3", E3_BODY),
    ):
        save_template(
            campaign_id,
            key,
            SUBJECT,
            body,
            sync_bootstrap_default=(key == "interested_email1"),
        )

    print(f"Seeded Restaurants DCE bypass for {campaign_id}")


if __name__ == "__main__":
    main()
