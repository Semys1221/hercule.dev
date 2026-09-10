#!/usr/bin/env python3
"""Audit comptable vs agence copy across Supabase, Instantly subsequence, cold campaign, Unibox."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SUBSEQUENCE_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRAPER_DIR = _REPO_ROOT / "app" / "streamlit_scraper"

for path in (str(_REPO_ROOT), str(_SUBSEQUENCE_DIR), str(_SCRAPER_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

load_dotenv(_REPO_ROOT / ".env")

COMPTABLE_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"

COMPTABLE_POSITIVE_MARKERS = (
    "cabinets partenaires",
    "proposer mon cabinet",
    "reprendre ces sujets en main",
    "au minimum 2 associes",
)

COMPTABLE_E1_MARKERS = COMPTABLE_POSITIVE_MARKERS + (
    "reservation_entreprise_link",
    "reservation-entreprise",
)

COMPTABLE_E2_MARKERS = (
    "contrat annuel en attente",
    "mensuellement",
    "proposer mon cabinet",
    "reservation_entreprise_link",
    "reservation-entreprise",
)

COMPTABLE_E3_MARKERS = (
    "cloturer nos echanges",
    "bonne continuation",
)

AGENCE_NEGATIVE_MARKERS = (
    "mandataires",
    "developpement marketing",
    "acquisition organique",
    "agences marketing",
    "mon agence est compatible",
    "audit de compatibilite de votre agence",
    "reservation_agence_link",
    "marketing digital",
)


def _normalize(text: str) -> str:
    from unibox_classify import normalize_email_text

    return normalize_email_text(text)


def _markers_for_layer(label: str) -> tuple[str, ...] | None:
    if label.endswith(":step0") or label.endswith("email1"):
        return COMPTABLE_E1_MARKERS
    if label.endswith(":step1") or label.endswith("email2"):
        return COMPTABLE_E2_MARKERS
    if label.endswith(":step2") or label.endswith("email3"):
        return COMPTABLE_E3_MARKERS
    return None


def audit_text(label: str, text: str, *, require_comptable_markers: bool = True) -> dict[str, Any]:
    normalized = _normalize(text)
    markers = _markers_for_layer(label) if require_comptable_markers else None
    missing_positive = (
        [m for m in markers if m not in normalized]
        if markers
        else []
    )
    if markers and "reservation_entreprise_link" in missing_positive:
        raw_lower = text.lower()
        if (
            "reservation_entreprise_link" in raw_lower
            or "reservation-entreprise" in normalized
        ):
            missing_positive = [
                m
                for m in missing_positive
                if m not in ("reservation_entreprise_link", "reservation-entreprise")
            ]
    found_negative = [m for m in AGENCE_NEGATIVE_MARKERS if m in normalized]
    ok = not missing_positive and not found_negative
    return {
        "layer": label,
        "ok": ok,
        "missing_positive": missing_positive,
        "found_negative": found_negative,
        "snippet": text[:240].replace("\n", " "),
    }


def _extract_instantly_bodies(data: dict[str, Any]) -> list[str]:
    bodies: list[str] = []
    for seq in data.get("sequences") or []:
        if not isinstance(seq, dict):
            continue
        for step in seq.get("steps") or []:
            if not isinstance(step, dict) or step.get("type") != "email":
                continue
            for variant in step.get("variants") or []:
                if isinstance(variant, dict):
                    body = str(variant.get("body") or "").strip()
                    if body:
                        bodies.append(body)
    return bodies


def audit_campaign(
    *,
    campaign_id: str,
    subsequence_id: str | None = None,
    unibox_sample: int = 5,
) -> dict[str, Any]:
    from instantly_client import get_campaign, list_subsequences
    from shared.instantly_client import FILTER_LEAD_INTERESTED, InstantlyClient, get_api_key
    from supabase_repo import list_templates
    from unibox_classify import extract_email_text, match_flows

    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("INSTANTLY_API_KEY is required")

    client = InstantlyClient(api_key)
    results: list[dict[str, Any]] = []

    for row in list_templates(campaign_id):
        key = str(row.get("template_key") or "")
        if key.startswith("interested_email"):
            body = str(row.get("body_html") or "")
            results.append(audit_text(f"supabase:{key}", body))

    if not results:
        results.append(
            {
                "layer": "supabase",
                "ok": False,
                "missing_positive": ["no templates"],
                "found_negative": [],
                "snippet": "",
            }
        )

    subs = list_subsequences(api_key, campaign_id)
    resolved_sub_id = subsequence_id or (str(subs[0]["id"]) if subs else "")
    if resolved_sub_id:
        sub = client._fetch(f"/subsequences/{resolved_sub_id}", method="GET")
        for index, body in enumerate(_extract_instantly_bodies(sub)):
            results.append(audit_text(f"instantly_subsequence:step{index}", body))
    else:
        results.append(
            {
                "layer": "instantly_subsequence",
                "ok": False,
                "missing_positive": ["no subsequence"],
                "found_negative": [],
                "snippet": "",
            }
        )

    campaign = get_campaign(api_key, campaign_id)
    for index, body in enumerate(_extract_instantly_bodies(campaign)[:3]):
        results.append(
            audit_text(
                f"instantly_cold:step{index}",
                body,
                require_comptable_markers=False,
            )
        )

    leads = client.list_leads_by_interest_filter(
        campaign_id=campaign_id,
        interest_filter=FILTER_LEAD_INTERESTED,
        max_leads=unibox_sample,
    )
    unibox_checks = 0
    for lead in leads:
        email = str(lead.get("email") or "").strip().lower()
        if not email:
            continue
        sent_items = client.list_emails(
            search=email,
            campaign_id=campaign_id,
            email_type="sent",
            limit=30,
        )
        for item in sent_items:
            text, _ = extract_email_text(item)
            if "interested_email1" not in match_flows(text, allowed_flows=["interested_email1"]):
                continue
            results.append(audit_text(f"unibox_e1:{email}", text))
            unibox_checks += 1
            break

    if unibox_checks == 0:
        results.append(
            {
                "layer": "unibox_e1",
                "ok": True,
                "missing_positive": [],
                "found_negative": [],
                "snippet": "no E1 sent samples in recent Interested leads",
            }
        )

    all_ok = all(r.get("ok") for r in results if r.get("layer") != "unibox_e1")
    return {
        "campaign_id": campaign_id,
        "subsequence_id": resolved_sub_id or None,
        "overall_ok": all_ok,
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--campaign-id", default=COMPTABLE_CAMPAIGN_ID)
    parser.add_argument("--subsequence-id", default="")
    parser.add_argument("--unibox-sample", type=int, default=5)
    args = parser.parse_args()

    report = audit_campaign(
        campaign_id=args.campaign_id.strip(),
        subsequence_id=args.subsequence_id.strip() or None,
        unibox_sample=args.unibox_sample,
    )
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["overall_ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
