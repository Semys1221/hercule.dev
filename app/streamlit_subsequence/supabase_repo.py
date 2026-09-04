"""Supabase access for Instantly bypass Streamlit tool."""

from __future__ import annotations

from functools import lru_cache
from typing import Any
from datetime import datetime, timezone

from supabase import Client, create_client

from config import supabase_service_role_key, supabase_url


@lru_cache(maxsize=1)
def get_client() -> Client:
    url = supabase_url()
    key = supabase_service_role_key()
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return create_client(url, key)


INTERESTED_TEMPLATE_KEYS = (
    "interested_email1",
    "interested_email2",
    "interested_email3",
)


def list_templates(campaign_id: str) -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("instantly_bypass_templates")
        .select("campaign_id, template_key, subject, body_html, updated_at")
        .eq("campaign_id", campaign_id)
        .order("template_key")
        .execute()
    )
    return resp.data or []


def save_template(campaign_id: str, template_key: str, subject: str, body_html: str) -> None:
    get_client().table("instantly_bypass_templates").upsert(
        {
            "campaign_id": campaign_id,
            "template_key": template_key,
            "subject": subject,
            "body_html": body_html,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="campaign_id,template_key",
    ).execute()


def seed_empty_templates(
    campaign_id: str,
    keys: tuple[str, ...] = INTERESTED_TEMPLATE_KEYS,
) -> None:
    existing = {str(row.get("template_key") or "") for row in list_templates(campaign_id)}
    client = get_client()
    for key in keys:
        if key in existing:
            continue
        client.table("instantly_bypass_templates").insert(
            {
                "campaign_id": campaign_id,
                "template_key": key,
                "subject": "",
                "body_html": "",
            }
        ).execute()


def list_configs() -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("instantly_bypass_config")
        .select("*")
        .order("campaign_name")
        .execute()
    )
    return resp.data or []


def get_config(campaign_id: str) -> dict[str, Any] | None:
    resp = (
        get_client()
        .table("instantly_bypass_config")
        .select("*")
        .eq("campaign_id", campaign_id)
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return None
    return resp.data


def save_config(row: dict[str, Any]) -> None:
    payload = {**row, "updated_at": datetime.now(timezone.utc).isoformat()}
    get_client().table("instantly_bypass_config").upsert(
        payload,
        on_conflict="campaign_id",
    ).execute()


def set_campaign_webhook_auto_send_enabled(campaign_id: str, enabled: bool) -> None:
    save_config(
        {
            "campaign_id": campaign_id,
            "webhook_auto_send_enabled": enabled,
        }
    )


def has_sent_event(idempotency_key: str) -> bool:
    resp = (
        get_client()
        .table("instantly_bypass_events")
        .select("id")
        .eq("idempotency_key", idempotency_key)
        .eq("status", "sent")
        .maybe_single()
        .execute()
    )
    return bool(resp and resp.data)


def record_event(row: dict[str, Any]) -> None:
    get_client().table("instantly_bypass_events").upsert(
        row,
        on_conflict="idempotency_key",
    ).execute()


def get_last_send_at(campaign_id: str, lead_email: str) -> str | None:
    resp = (
        get_client()
        .table("instantly_bypass_events")
        .select("dispatched_at")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.strip().lower())
        .eq("status", "sent")
        .order("dispatched_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        return None
    return rows[0].get("dispatched_at")


def list_sent_flows(campaign_id: str, lead_email: str) -> list[str]:
    resp = (
        get_client()
        .table("instantly_bypass_events")
        .select("flow")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.strip().lower())
        .eq("status", "sent")
        .execute()
    )
    return [str(row["flow"]) for row in (resp.data or []) if row.get("flow")]


def get_event_sent_at(campaign_id: str, lead_email: str, flow: str) -> str | None:
    resp = (
        get_client()
        .table("instantly_bypass_events")
        .select("dispatched_at")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.strip().lower())
        .eq("flow", flow)
        .eq("status", "sent")
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return None
    return resp.data.get("dispatched_at")


def get_webhook_auto_send_enabled() -> bool:
    resp = (
        get_client()
        .table("instantly_bypass_settings")
        .select("webhook_auto_send_enabled")
        .eq("id", 1)
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return False
    return bool(resp.data.get("webhook_auto_send_enabled"))


def set_webhook_auto_send_enabled(enabled: bool) -> None:
    get_client().table("instantly_bypass_settings").upsert(
        {
            "id": 1,
            "webhook_auto_send_enabled": enabled,
        },
        on_conflict="id",
    ).execute()


def get_pipeline_step(campaign_id: str, lead_email: str) -> str | None:
    resp = (
        get_client()
        .table("instantly_bypass_pipeline")
        .select("step")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.strip().lower())
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return None
    step = resp.data.get("step")
    return str(step) if step else None


def upsert_pipeline_step(campaign_id: str, lead_email: str, step: str) -> None:
    get_client().table("instantly_bypass_pipeline").upsert(
        {
            "campaign_id": campaign_id,
            "lead_email": lead_email.strip().lower(),
            "step": step,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="campaign_id,lead_email",
    ).execute()


def list_pipeline_for_campaign(campaign_id: str) -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("instantly_bypass_pipeline")
        .select("campaign_id, lead_email, step, updated_at")
        .eq("campaign_id", campaign_id)
        .execute()
    )
    return resp.data or []


def has_pending_job(idempotency_key: str) -> bool:
    resp = (
        get_client()
        .table("instantly_bypass_jobs")
        .select("id")
        .eq("idempotency_key", idempotency_key)
        .eq("status", "pending")
        .maybe_single()
        .execute()
    )
    return bool(resp and resp.data)


def insert_bypass_job(
    *,
    idempotency_key: str,
    campaign_id: str,
    lead_email: str,
    flow: str,
    scheduled_for: datetime,
    payload: dict[str, Any],
) -> None:
    get_client().table("instantly_bypass_jobs").upsert(
        {
            "idempotency_key": idempotency_key,
            "campaign_id": campaign_id,
            "lead_email": lead_email.strip().lower(),
            "template_key": flow,
            "scheduled_for": scheduled_for.astimezone(timezone.utc).isoformat(),
            "status": "pending",
            "payload": payload,
        },
        on_conflict="idempotency_key",
    ).execute()


def list_due_bypass_jobs(limit: int = 50) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc).isoformat()
    resp = (
        get_client()
        .table("instantly_bypass_jobs")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_for", now)
        .order("scheduled_for")
        .limit(limit)
        .execute()
    )
    return resp.data or []


def mark_bypass_job_sent(job_id: str) -> None:
    get_client().table("instantly_bypass_jobs").update(
        {
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", job_id).eq("status", "pending").execute()


def mark_bypass_job_failed(job_id: str, error_message: str) -> None:
    get_client().table("instantly_bypass_jobs").update(
        {
            "status": "failed",
            "error_message": error_message[:2000],
        }
    ).eq("id", job_id).eq("status", "pending").execute()


def reschedule_bypass_job(job_id: str, scheduled_for: datetime) -> None:
    get_client().table("instantly_bypass_jobs").update(
        {
            "scheduled_for": scheduled_for.astimezone(timezone.utc).isoformat(),
        }
    ).eq("id", job_id).eq("status", "pending").execute()


def fetch_analytics(campaign_id: str | None = None) -> dict[str, Any]:
    client = get_client()
    sent_q = (
        client.table("instantly_bypass_events")
        .select("latency_ms")
        .eq("status", "sent")
    )
    failed_q = (
        client.table("instantly_bypass_events")
        .select("id", count="exact")
        .eq("status", "failed")
    )
    errors_q = (
        client.table("instantly_bypass_events")
        .select("lead_email, campaign_id, error_message, created_at")
        .eq("status", "failed")
        .order("created_at", desc=True)
        .limit(20)
    )
    if campaign_id:
        sent_q = sent_q.eq("campaign_id", campaign_id)
        failed_q = failed_q.eq("campaign_id", campaign_id)
        errors_q = errors_q.eq("campaign_id", campaign_id)
    sent = sent_q.execute()
    rows = sent.data or []
    latencies = [r["latency_ms"] for r in rows if isinstance(r.get("latency_ms"), int)]
    failed = failed_q.execute()
    errors = errors_q.execute()
    return {
        "total_sent": len(rows),
        "avg_latency_ms": round(sum(latencies) / len(latencies)) if latencies else None,
        "failed_count": failed.count or 0,
        "recent_errors": errors.data or [],
    }
