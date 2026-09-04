"""Load/save booking email templates from Supabase + send test via Resend."""

from __future__ import annotations

import re
from typing import Any, Literal

from crm_api import post_json
from supabase_repo import get_client

LeadCategory = Literal["agence", "entreprise"]
EmailType = Literal[
    "immediate",
    "h48_confirm",
    "h24_relance",
    "h20_cancel",
    "role_seq_48",
    "role_seq_24",
]

AGENCE_TYPES: tuple[EmailType, ...] = (
    "immediate",
    "h48_confirm",
    "h24_relance",
    "h20_cancel",
    "role_seq_48",
    "role_seq_24",
)
ENTREPRISE_TYPES: tuple[EmailType, ...] = ("immediate",)

DEFAULT_TEMPLATES: dict[EmailType, dict[str, str]] = {
    "immediate": {
        "subject": "Confirmation de votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Votre rendez-vous avec Hercule est bien prévu le {{date}} à {{heure}}.

Les informations de connexion vous seront transmises directement par email via Calendly.""",
    },
    "h48_confirm": {
        "subject": "Confirmation requise — Votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous porteront sur des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmation_agence_link}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.""",
    },
    "h24_relance": {
        "subject": "Confirmation requise — Votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Nous n'avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmation_agence_link}}""",
    },
    "h20_cancel": {
        "subject": "Votre rendez-vous avec Hercule est annulé",
        "body": """{{firstNameLine}}

Faute de confirmation de votre part, votre rendez-vous prévu le {{date}} à {{heure}} a été annulé.

Votre créneau a été libéré et pourra être proposé à une autre agence.""",
    },
    "role_seq_48": {
        "subject": "Hercule — avant votre rendez-vous",
        "body": """{{firstNameLine}}

Le principe d'Hercule tient en quelques mots.

La crainte des entreprises que nous auditons est simple : ne pas savoir si les recommandations d'une agence sont réellement adaptées à leur activité.

C'est précisément là qu'Hercule prend son sens : faire ce tri et orienter chaque entreprise vers ce qui lui correspond réellement.

Nous en parlerons ensemble au rendez-vous.""",
    },
    "role_seq_24": {
        "subject": "Confirmer votre créneau — Hercule",
        "body": """{{firstNameLine}}

J'ai le plaisir de vous confirmer que les contrats d'agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Un aperçu du déroulé de votre entretien est disponible ici : {{confirmLink}}""",
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
            "/exemple-slug?email=jean@example.com"
        ),
        "confirmation_agence_link": (
            "https://www.hercule.dev/confirm-reservation.html"
            "/exemple-slug?email=jean@example.com"
        ),
        "confirmLink": (
            "consulter : https://www.hercule.dev/temporary-reservation.html"
            "/exemple-slug?email=jean@example.com"
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


def default_use_html(email_type: str) -> bool:
    return email_type not in ("immediate", "role_seq_48")


def send_test_email(
    *,
    to: str,
    category: LeadCategory,
    email_type: str,
    subject: str,
    body: str,
    use_html: bool | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "category": category,
        "email_type": email_type,
        "subject": subject,
        "body": body,
        "to": to,
    }
    if use_html is not None:
        payload["use_html"] = use_html
    data = post_json("/api/booking-communication/templates/test", payload)
    return {
        "ok": True,
        "to": data.get("to", to),
        "resend_email_id": data.get("resend_email_id"),
        "subject": data.get("subject"),
    }
