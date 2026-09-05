"""Supabase access for AI Reply Agent Streamlit tool."""

from __future__ import annotations

from datetime import datetime, timezone
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


def get_global_auto_send_enabled() -> bool:
    resp = (
        get_client()
        .table("ai_reply_agent_settings")
        .select("webhook_auto_send_enabled")
        .eq("id", 1)
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return True
    return bool(resp.data.get("webhook_auto_send_enabled"))


def set_global_auto_send_enabled(enabled: bool) -> None:
    get_client().table("ai_reply_agent_settings").upsert(
        {
            "id": 1,
            "webhook_auto_send_enabled": enabled,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()


def get_config(campaign_id: str) -> dict[str, Any] | None:
    resp = (
        get_client()
        .table("ai_reply_agent_config")
        .select("*")
        .eq("campaign_id", campaign_id)
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return None
    return resp.data if isinstance(resp.data, dict) else None


def save_config(row: dict[str, Any]) -> None:
    row = dict(row)
    row["updated_at"] = datetime.now(timezone.utc).isoformat()
    get_client().table("ai_reply_agent_config").upsert(
        row, on_conflict="campaign_id"
    ).execute()


def list_inbound_messages(campaign_id: str, limit: int = 200) -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("ai_reply_agent_messages")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("direction", "inbound")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


def list_problem_messages(campaign_id: str, limit: int = 200) -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("ai_reply_agent_messages")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("direction", "inbound")
        .in_("ai_status", ["skipped_unsafe", "skipped_ooo"])
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


def list_thread_messages(
    campaign_id: str, lead_email: str
) -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("ai_reply_agent_messages")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.lower())
        .order("created_at", desc=False)
        .execute()
    )
    return resp.data or []


def update_message_status(
    message_id: str,
    ai_status: str,
    ai_reason: str | None = None,
) -> None:
    get_client().table("ai_reply_agent_messages").update(
        {
            "ai_status": ai_status,
            "ai_reason": ai_reason,
        }
    ).eq("id", message_id).execute()


def insert_outbound_message(row: dict[str, Any]) -> None:
    get_client().table("ai_reply_agent_messages").insert(row).execute()


def queue_manual_job(
    *,
    campaign_id: str,
    lead_email: str,
    message_id: str,
    scheduled_for: str,
    payload: dict[str, Any],
) -> None:
    idempotency_key = f"manual:{message_id}:{scheduled_for}"
    get_client().table("ai_reply_agent_jobs").insert(
        {
            "idempotency_key": idempotency_key,
            "campaign_id": campaign_id,
            "lead_email": lead_email.lower(),
            "message_id": message_id,
            "scheduled_for": scheduled_for,
            "status": "pending",
            "payload": payload,
        }
    ).execute()


def list_blocklist(campaign_id: str) -> set[str]:
    resp = (
        get_client()
        .table("ai_reply_agent_blocklist")
        .select("lead_email")
        .eq("campaign_id", campaign_id)
        .execute()
    )
    rows = resp.data or []
    return {str(row.get("lead_email") or "").strip().lower() for row in rows if row.get("lead_email")}


def add_to_blocklist(
    campaign_id: str,
    lead_email: str,
    *,
    reason: str = "dismissed",
) -> None:
    get_client().table("ai_reply_agent_blocklist").upsert(
        {
            "campaign_id": campaign_id,
            "lead_email": lead_email.strip().lower(),
            "reason": reason,
            "blocked_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="campaign_id,lead_email",
    ).execute()


def is_blocklisted(campaign_id: str, lead_email: str) -> bool:
    resp = (
        get_client()
        .table("ai_reply_agent_blocklist")
        .select("id")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.strip().lower())
        .maybe_single()
        .execute()
    )
    return bool(resp and resp.data)


def get_lead_reply(campaign_id: str, lead_email: str) -> str:
    resp = (
        get_client()
        .table("ai_reply_agent_leads")
        .select("ai_reply_agent_1")
        .eq("campaign_id", campaign_id)
        .eq("lead_email", lead_email.strip().lower())
        .maybe_single()
        .execute()
    )
    if not resp or not resp.data:
        return ""
    text = resp.data.get("ai_reply_agent_1")
    return str(text).strip() if text else ""


def upsert_lead_reply(campaign_id: str, lead_email: str, reply_text: str) -> None:
    normalized = lead_email.strip().lower()
    trimmed = (reply_text or "").strip()
    if not trimmed:
        raise ValueError("reply_text must be non-empty")
    get_client().table("ai_reply_agent_leads").upsert(
        {
            "campaign_id": campaign_id,
            "lead_email": normalized,
            "ai_reply_agent_1": trimmed,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="campaign_id,lead_email",
    ).execute()


def get_lead_replies_batch(
    campaign_id: str,
    lead_emails: list[str],
) -> dict[str, str]:
    normalized = sorted({email.strip().lower() for email in lead_emails if email.strip()})
    if not normalized:
        return {}
    resp = (
        get_client()
        .table("ai_reply_agent_leads")
        .select("lead_email, ai_reply_agent_1")
        .eq("campaign_id", campaign_id)
        .in_("lead_email", normalized)
        .execute()
    )
    result: dict[str, str] = {}
    for row in resp.data or []:
        email = str(row.get("lead_email") or "").strip().lower()
        text = row.get("ai_reply_agent_1")
        if email and text and str(text).strip():
            result[email] = str(text).strip()
    return result


def insert_inbound_message(row: dict[str, Any]) -> str:
    client = get_client()
    campaign_id = str(row.get("campaign_id") or "")
    lead_email = str(row.get("lead_email") or "").lower()
    instantly_email_id = row.get("instantly_email_id")

    if instantly_email_id:
        existing = (
            client.table("ai_reply_agent_messages")
            .select("id")
            .eq("campaign_id", campaign_id)
            .eq("lead_email", lead_email)
            .eq("instantly_email_id", instantly_email_id)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
            return str(existing.data["id"])

    resp = client.table("ai_reply_agent_messages").insert(row).select("id").execute()
    if not resp or not resp.data:
        raise RuntimeError("Failed to insert inbound message")
    inserted = resp.data[0] if isinstance(resp.data, list) else resp.data
    return str(inserted["id"])
