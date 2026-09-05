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
ENTREPRISE_TYPES: tuple[EmailType, ...] = (
    "immediate",
    "h48_confirm",
    "h24_relance",
)

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

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous contiendront des contrats de conseil financier.

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

ENTREPRISE_TEMPLATE_OVERRIDES: dict[EmailType, dict[str, str]] = {
    "h48_confirm": {
        "subject": "Préparez votre rendez-vous avec Hercule",
        "body": """{{firstNameLine}}

Pour préparer au mieux votre rendez-vous, retrouvez ici le déroulé de votre échange :
{{post_booking_link}}""",
    },
    "h24_relance": {
        "subject": "Rappel — Votre rendez-vous avec Hercule approche",
        "body": """{{firstNameLine}}

Votre rendez-vous avec Hercule approche — il est prévu le {{date}} à {{heure}}.

Nous avons hâte d'échanger avec vous.""",
    },
}


def default_template_for(category: LeadCategory, email_type: EmailType) -> dict[str, str]:
    if category == "entreprise":
        override = ENTREPRISE_TEMPLATE_OVERRIDES.get(email_type)
        if override:
            return override
    return DEFAULT_TEMPLATES[email_type]


STALE_ENTREPRISE_MARKERS = (
    "réattribué",
    "confirmation_agence_link",
    "confirmer votre présence",
    "confirmation requise",
)


def is_stale_agence_copy_on_entreprise(
    category: LeadCategory,
    email_type: EmailType,
    subject: str,
    body: str,
) -> bool:
    if category != "entreprise":
        return False
    if email_type not in ("h48_confirm", "h24_relance"):
        return False
    combined = f"{subject}\n{body}".lower()
    return any(marker in combined for marker in STALE_ENTREPRISE_MARKERS)


def sanitize_template_row(
    category: LeadCategory,
    email_type: EmailType,
    row: dict[str, Any],
) -> dict[str, Any]:
    subject = str(row.get("subject") or "").strip()
    body = str(row.get("body") or "").strip()
    if (
        not subject
        or not body
        or is_stale_agence_copy_on_entreprise(category, email_type, subject, body)
    ):
        defaults = default_template_for(category, email_type)
        return {
            "email_type": email_type,
            "subject": defaults["subject"],
            "body": defaults["body"],
            "updated_at": row.get("updated_at"),
        }
    return row


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
        "post_booking_link": (
            "https://www.hercule.dev/post-booking-entreprise.html"
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
            templates.append(sanitize_template_row(category, email_type, row))
        else:
            defaults = default_template_for(category, email_type)
            templates.append(
                {
                    "email_type": email_type,
                    "subject": defaults["subject"],
                    "body": defaults["body"],
                    "updated_at": None,
                }
            )
    return templates


def save_template(
    category: LeadCategory,
    email_type: EmailType,
    subject: str,
    body: str,
    *,
    sync_code: bool = True,
) -> dict[str, Any]:
    from datetime import datetime, timezone

    from template_code_sync import sync_coded_defaults

    client = get_client()
    now = datetime.now(timezone.utc).isoformat()
    client.table("booking_email_templates").upsert(
        {
            "category": category,
            "email_type": email_type,
            "subject": subject.strip(),
            "body": body,
            "updated_at": now,
        },
        on_conflict="category,email_type",
    ).execute()

    code_sync: dict[str, Any] = {"python": False, "typescript": False, "errors": []}
    if sync_code:
        code_sync = sync_coded_defaults(
            category,
            email_type,
            subject.strip(),
            body,
        )

    return {"db": True, "code_sync": code_sync}


def upsert_templates(
    category: LeadCategory,
    templates: list[dict[str, str]],
) -> None:
    for template in templates:
        save_template(
            category,
            template["email_type"],  # type: ignore[arg-type]
            template["subject"],
            template["body"],
            sync_code=True,
        )


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
