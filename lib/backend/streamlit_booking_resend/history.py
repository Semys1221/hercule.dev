"""Historique des envois booking — enrichissement jobs + leads."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from booking_jobs import (
    confirmation_status,
    engagement_label,
    fetch_leads_by_ids,
    list_history_jobs,
    replied_label,
)
from schedule import format_paris, PARIS_TZ

CategoryFilter = Literal["agence", "entreprise", "all"]
ConfirmationFilter = Literal["all", "waiting", "confirmed", "na"]

JOB_STATUS_LABELS = {
    "pending": "En attente",
    "sent": "Envoyé",
    "cancelled": "Annulé",
    "failed": "Échec",
}

EMAIL_TYPE_LABELS = {
    "immediate": "Email 1 — Confirmation immédiate",
    "h48_confirm": "Email 2 — 48h avant le RDV",
    "h24_relance": "Email 3 — 24h relance (si non confirmé)",
    "h20_cancel": "Email 4 — H-20 annulation (si non confirmé)",
    "role_seq_48": "Legacy — Intro Hercule",
    "role_seq_24": "Legacy — Relance page temporaire",
}


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = str(value).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def _send_at(job: dict[str, Any]) -> datetime | None:
    return _parse_iso(job.get("sent_at")) or _parse_iso(job.get("scheduled_for"))


def _resend_dashboard_url(resend_email_id: str | None) -> str:
    email_id = str(resend_email_id or "").strip()
    if not email_id:
        return ""
    return f"https://resend.com/emails/{email_id}"


def build_history_rows(
    jobs: list[dict[str, Any]],
    leads_by_category: dict[str, dict[str, dict[str, Any]]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for job in jobs:
        category = str(job.get("lead_category") or "")
        lead_id = str(job.get("lead_id") or "")
        lead = leads_by_category.get(category, {}).get(lead_id, {})
        email_type = str(job.get("email_type") or "")
        lead_statut = str(lead.get("statut") or "")
        confirmed_at = lead.get("confirmed_at")
        sent_at = job.get("sent_at")
        send_dt = _send_at(job)
        confirm = confirmation_status(
            email_type,
            lead_statut,
            str(sent_at) if sent_at else None,
            str(confirmed_at) if confirmed_at else None,
        )

        rows.append(
            {
                "date_envoi": format_paris(send_dt),
                "destinataire": lead.get("email") or "",
                "prenom": lead.get("first_name") or "",
                "societe": lead.get("company") or "",
                "categorie": category,
                "type_email": EMAIL_TYPE_LABELS.get(email_type, email_type),
                "statut_envoi": JOB_STATUS_LABELS.get(
                    str(job.get("status") or ""),
                    job.get("status"),
                ),
                "ouvert": engagement_label(job.get("opened_at")),
                "clique": engagement_label(job.get("clicked_at")),
                "repondu": replied_label(
                    email_type,
                    str(confirmed_at) if confirmed_at else None,
                ),
                "confirmation": confirm,
                "rdv_prevu": format_paris(_parse_iso(lead.get("scheduled_at"))),
                "resend_id": job.get("resend_email_id") or "",
                "resend_url": _resend_dashboard_url(job.get("resend_email_id")),
                "_send_dt": send_dt,
                "_email_type_raw": email_type,
                "_confirm_raw": confirm,
            }
        )
    return rows


def load_history_rows(
    *,
    limit: int = 500,
    category: CategoryFilter = "all",
    email_type: str | None = None,
    job_status: str | None = None,
    confirmation_filter: ConfirmationFilter = "all",
    email_search: str = "",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[dict[str, Any]]:
    jobs = list_history_jobs(
        limit=limit,
        category=category,
        email_type=email_type,
        job_status=job_status,
    )

    agence_ids = [
        str(job["lead_id"])
        for job in jobs
        if job.get("lead_category") == "agence" and job.get("lead_id")
    ]
    entreprise_ids = [
        str(job["lead_id"])
        for job in jobs
        if job.get("lead_category") == "entreprise" and job.get("lead_id")
    ]

    leads_by_category = {
        "agence": fetch_leads_by_ids("agence", list(dict.fromkeys(agence_ids))),
        "entreprise": fetch_leads_by_ids("entreprise", list(dict.fromkeys(entreprise_ids))),
    }

    rows = build_history_rows(jobs, leads_by_category)

    search = email_search.strip().lower()
    if search:
        rows = [row for row in rows if search in str(row.get("destinataire") or "").lower()]

    if date_from:
        if date_from.tzinfo is None:
            date_from = date_from.replace(tzinfo=PARIS_TZ)
        date_from_utc = date_from.astimezone(UTC)
        rows = [
            row
            for row in rows
            if row.get("_send_dt") and row["_send_dt"] >= date_from_utc
        ]

    if date_to:
        if date_to.tzinfo is None:
            date_to = date_to.replace(tzinfo=PARIS_TZ)
        date_to_utc = date_to.astimezone(UTC)
        rows = [
            row
            for row in rows
            if row.get("_send_dt") and row["_send_dt"] <= date_to_utc
        ]

    if confirmation_filter == "waiting":
        rows = [row for row in rows if row.get("_confirm_raw") == "En attente de confirmation"]
    elif confirmation_filter == "confirmed":
        rows = [row for row in rows if row.get("_confirm_raw") == "Confirmé"]
    elif confirmation_filter == "na":
        rows = [row for row in rows if row.get("_confirm_raw") == "N/A"]

    for row in rows:
        row.pop("_send_dt", None)
        row.pop("_email_type_raw", None)
        row.pop("_confirm_raw", None)

    return rows
