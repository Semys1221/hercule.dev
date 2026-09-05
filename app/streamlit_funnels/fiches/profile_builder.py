"""Build default profile JSON for onboarding fiches."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from audiences import Audience

AGENCE_TIMELINE = [
    "Activation de votre fiche",
    "Qualification des demandes",
    "Première proposition de mise en relation",
    "Rendez-vous planifié",
]

ENTREPRISE_TIMELINE = [
    "Qualification de votre besoin",
    "Recherche d'agence compatible",
    "Proposition d'agence",
    "Rendez-vous planifié",
]


def build_default_profile(form: dict[str, Any], category: Audience) -> dict[str, Any]:
    retraction = 4 if form.get("droit_retractation") else 0
    timeline = AGENCE_TIMELINE if category == "agence" else ENTREPRISE_TIMELINE
    return {
        "form": form,
        "communication": {
            "delays": {
                "base_match_days": 14,
                "retraction_days": retraction,
                "search_start_offset_days": retraction,
                "queue_warmup_days": 15,
                "first_match_promise_days": 21,
                "first_rdv_promise_days": 35,
                "first_u4_promise_days": 21,
                "five_u4_promise_days": 35,
                "ten_u4_promise_days": 60,
            },
        },
        "display": {
            "timeline": [{"label": label} for label in timeline],
        },
        "match": {"active_rdv": False},
    }


def onboarding_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
