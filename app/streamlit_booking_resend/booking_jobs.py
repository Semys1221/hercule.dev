"""Read booking email job status from Supabase."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from supabase_repo import get_client

CONFIRM_EMAIL_TYPES = frozenset({"h48_confirm", "h24_relance", "role_seq_24"})
FOLLOW_UP_EMAIL_TYPES = (
    "h48_confirm",
    "h24_relance",
    "h20_cancel",
    "role_seq_24",
)

HISTORY_JOB_COLUMNS = (
    "id, lead_category, lead_id, email_type, status, scheduled_for, sent_at, "
    "opened_at, clicked_at, delivered_at, resend_email_id, triggered_by, error_message"
)


def list_jobs_for_lead(lead_id: str) -> list[dict[str, Any]]:
    response = (
        get_client()
        .table("booking_email_jobs")
        .select("email_type,status,scheduled_for,sent_at")
        .eq("lead_id", lead_id)
        .order("scheduled_for")
        .execute()
    )
    return list(response.data or [])


def has_main_sequence_started(lead_id: str) -> bool:
    response = (
        get_client()
        .table("booking_email_jobs")
        .select("id")
        .eq("lead_id", lead_id)
        .limit(1)
        .execute()
    )
    return bool(response.data)


def has_role_recovery_started(lead_id: str) -> bool:
    response = (
        get_client()
        .table("booking_email_jobs")
        .select("id")
        .eq("lead_id", lead_id)
        .in_("email_type", ["role_seq_48", "role_seq_24"])
        .limit(1)
        .execute()
    )
    return bool(response.data)


def enrich_sequence_status(row: dict[str, Any]) -> str:
    """Refine sequence_status using lead statut and existing jobs."""
    statut = str(row.get("lead_statut") or "")
    if statut == "CANCELLED":
        return "cancelled"
    if statut == "CONFIRMED":
        return "confirmed"

    lead_id = row.get("lead_id")
    if not lead_id:
        return str(row.get("sequence_status") or "none")

    sequence_type = row.get("sequence_type")
    if sequence_type == "role_recovery":
        if has_role_recovery_started(str(lead_id)):
            return "started"
    elif has_main_sequence_started(str(lead_id)):
        return "started"

    return str(row.get("sequence_status") or "none")


def job_status_by_type(lead_id: str) -> dict[str, str]:
    """Map email_type → job status (pending/sent/cancelled/failed)."""
    jobs = list_jobs_for_lead(lead_id)
    return {
        str(job["email_type"]): str(job.get("status") or "")
        for job in jobs
        if job.get("email_type")
    }


def scheduled_times_from_jobs(lead_id: str) -> dict[str, str]:
    """Map email_type → scheduled_for ISO from DB (overrides preview)."""
    jobs = list_jobs_for_lead(lead_id)
    return {
        str(job["email_type"]): str(job.get("scheduled_for") or "")
        for job in jobs
        if job.get("email_type")
    }


def cancel_pending_followups(lead_id: str) -> int:
    now = datetime.now(UTC).isoformat()
    response = (
        get_client()
        .table("booking_email_jobs")
        .update({"status": "cancelled", "cancelled_at": now})
        .eq("lead_id", lead_id)
        .eq("status", "pending")
        .in_("email_type", list(FOLLOW_UP_EMAIL_TYPES))
        .execute()
    )
    return len(response.data or [])


def list_history_jobs(
    *,
    limit: int = 500,
    category: Literal["agence", "entreprise", "all"] = "all",
    email_type: str | None = None,
    job_status: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch booking email jobs for the Historique tab."""
    query = (
        get_client()
        .table("booking_email_jobs")
        .select(HISTORY_JOB_COLUMNS)
        .order("sent_at", desc=True)
        .order("scheduled_for", desc=True)
        .limit(limit)
    )
    if category != "all":
        query = query.eq("lead_category", category)
    if email_type:
        query = query.eq("email_type", email_type)
    if job_status:
        query = query.eq("status", job_status)

    response = query.execute()
    return list(response.data or [])


def fetch_leads_by_ids(
    category: Literal["agence", "entreprise"],
    lead_ids: list[str],
) -> dict[str, dict[str, Any]]:
    if not lead_ids:
        return {}
    response = (
        get_client()
        .table(category)
        .select("id, email, first_name, company, statut, confirmed_at, scheduled_at")
        .in_("id", lead_ids)
        .execute()
    )
    return {
        str(row["id"]): row
        for row in (response.data or [])
        if row.get("id")
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


def confirmation_status(
    email_type: str,
    lead_statut: str,
    sent_at: str | None,
    confirmed_at: str | None,
) -> str:
    if email_type not in CONFIRM_EMAIL_TYPES:
        return "N/A"
    if lead_statut == "CONFIRMED" or confirmed_at:
        return "Confirmé"
    if sent_at and lead_statut == "MEETING_BOOKED":
        return "En attente de confirmation"
    return "—"


def engagement_label(timestamp: str | None) -> str:
    if not timestamp:
        return "non"
    dt = _parse_iso(timestamp)
    if dt is None:
        return "oui"
    from schedule import format_paris

    return f"oui ({format_paris(dt)})"


def replied_label(email_type: str, confirmed_at: str | None) -> str:
    if email_type not in CONFIRM_EMAIL_TYPES:
        return "N/A"
    if not confirmed_at:
        return "non"
    dt = _parse_iso(confirmed_at)
    if dt is None:
        return "oui"
    from schedule import format_paris

    return f"oui ({format_paris(dt)})"
