"""Read booking email job status from Supabase."""

from __future__ import annotations

from typing import Any

from supabase_repo import get_client


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
