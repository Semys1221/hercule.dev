"""Supabase access for Instantly bypass Streamlit tool."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from config import supabase_service_role_key, supabase_url


@lru_cache(maxsize=1)
def get_client() -> Client:
    url = supabase_url()
    key = supabase_service_role_key()
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return create_client(url, key)


def list_templates() -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("instantly_bypass_templates")
        .select("template_key, subject, body_html, updated_at")
        .order("template_key")
        .execute()
    )
    return resp.data or []


def save_template(template_key: str, subject: str, body_html: str) -> None:
    get_client().table("instantly_bypass_templates").upsert(
        {
            "template_key": template_key,
            "subject": subject,
            "body_html": body_html,
        },
        on_conflict="template_key",
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


def save_config(row: dict[str, Any]) -> None:
    get_client().table("instantly_bypass_config").upsert(
        row,
        on_conflict="campaign_id",
    ).execute()


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
    return bool(resp.data)


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
    if not resp.data:
        return None
    return resp.data.get("dispatched_at")


def fetch_analytics() -> dict[str, Any]:
    client = get_client()
    sent = (
        client.table("instantly_bypass_events")
        .select("latency_ms")
        .eq("status", "sent")
        .execute()
    )
    rows = sent.data or []
    latencies = [r["latency_ms"] for r in rows if isinstance(r.get("latency_ms"), int)]
    failed = (
        client.table("instantly_bypass_events")
        .select("id", count="exact")
        .eq("status", "failed")
        .execute()
    )
    errors = (
        client.table("instantly_bypass_events")
        .select("lead_email, campaign_id, error_message, created_at")
        .eq("status", "failed")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return {
        "total_sent": len(rows),
        "avg_latency_ms": round(sum(latencies) / len(latencies)) if latencies else None,
        "failed_count": failed.count or 0,
        "recent_errors": errors.data or [],
    }
