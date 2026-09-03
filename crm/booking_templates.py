"""Load/save booking email templates from Supabase + send test via Resend."""

from __future__ import annotations

import os
import re
import time
from typing import Any, Literal

import requests

from config import _env
from supabase_repo import get_client

LeadCategory = Literal["agence", "entreprise"]
EmailType = Literal["immediate", "h48_confirm", "h24_relance", "h20_cancel"]

AGENCE_TYPES: tuple[EmailType, ...] = (
    "immediate",
    "h48_confirm",
    "h24_relance",
    "h20_cancel",
)
ENTREPRISE_TYPES: tuple[EmailType, ...] = ("immediate",)

DEFAULT_TEMPLATES: dict[EmailType, dict[str, str]] = {
    "immediate": {
        "subject": "Confirmation de votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Votre rendez-vous avec Hercule est bien prévu le {{date}} à {{heure}}.

Les informations de connexion vous seront transmises directement par email via Calendly.

Cordialement,""",
    },
    "h48_confirm": {
        "subject": "Confirmation requise — Votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous porteront sur des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmUrl}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.

Cordialement,""",
    },
    "h24_relance": {
        "subject": "Confirmation requise — Votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Nous n'avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmUrl}}

Cordialement,""",
    },
    "h20_cancel": {
        "subject": "Votre rendez-vous avec Hercule est annulé",
        "body": """{{firstNameLine}}

Faute de confirmation de votre part, votre rendez-vous prévu le {{date}} à {{heure}} a été annulé.

Votre créneau a été libéré et pourra être proposé à une autre agence.

Cordialement,""",
    },
}


def email_types_for(category: LeadCategory) -> tuple[EmailType, ...]:
    return ENTREPRISE_TYPES if category == "entreprise" else AGENCE_TYPES


def _render_template(template: str, vars_map: dict[str, str]) -> str:
    return re.sub(
        r"\{\{(\w+)\}\}",
        lambda match: vars_map.get(match.group(1), ""),
        template,
    )


def preview_template(
    subject: str,
    body: str,
    email_type: str,
) -> tuple[str, str]:
    sample_date = "mercredi 10 septembre 2026"
    sample_heure = "09:00"
    first_name_line = (
        "Bonjour Jean," if email_type == "immediate" else "Jean,"
    )
    vars_map = {
        "firstNameLine": first_name_line,
        "date": sample_date,
        "heure": sample_heure,
        "confirmUrl": (
            "https://www.hercule.dev/confirm-reservation.html"
            "?code=exemple-slug&email=jean@example.com"
        ),
    }
    return (
        _render_template(subject, vars_map),
        _render_template(body, vars_map),
    )


def list_templates(category: LeadCategory) -> list[dict[str, Any]]:
    client = get_client()
    res = (
        client.table("booking_email_templates")
        .select("email_type, subject, body, updated_at")
        .eq("category", category)
        .execute()
    )
    rows = {row["email_type"]: row for row in (res.data or [])}
    templates: list[dict[str, Any]] = []
    for email_type in email_types_for(category):
        row = rows.get(email_type)
        if row:
            templates.append(row)
        else:
            defaults = DEFAULT_TEMPLATES[email_type]
            templates.append(
                {
                    "email_type": email_type,
                    "subject": defaults["subject"],
                    "body": defaults["body"],
                    "updated_at": None,
                }
            )
    return templates


def upsert_templates(
    category: LeadCategory,
    templates: list[dict[str, str]],
) -> None:
    client = get_client()
    rows = [
        {
            "category": category,
            "email_type": t["email_type"],
            "subject": t["subject"].strip(),
            "body": t["body"],
        }
        for t in templates
    ]
    client.table("booking_email_templates").upsert(
        rows,
        on_conflict="category,email_type",
    ).execute()


def _resend_from() -> str:
    return (
        _env("BOOKING_RESEND_FROM")
        or _env("RESEND_FROM")
        or "Hercule <contact@hercule.dev>"
    )


def _require_resend_key() -> str:
    key = _env("RESEND_API_KEY")
    if not key:
        raise RuntimeError("Set RESEND_API_KEY in crm/.env")
    return key


def send_test_email(
    *,
    to: str,
    category: LeadCategory,
    email_type: str,
    subject: str,
    body: str,
) -> dict[str, Any]:
    rendered_subject, rendered_body = preview_template(subject, body, email_type)
    api_key = _require_resend_key()
    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": _resend_from(),
            "to": [to],
            "subject": f"[TEST {category}] {rendered_subject}",
            "text": rendered_body,
        },
        timeout=30,
    )
    try:
        data = response.json()
    except ValueError:
        data = {"error": response.text}
    if not response.ok:
        raise RuntimeError(
            f"Resend HTTP {response.status_code}: {data.get('message') or data}"
        )
    return {"ok": True, "to": to, "resend_email_id": data.get("id"), "subject": rendered_subject}
