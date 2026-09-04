"""Campaign onboarding: status, webhook match, initialize."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from supabase_repo import (
    get_config,
    list_templates,
    save_config,
    seed_empty_templates,
)

INTERESTED_TEMPLATE_KEYS = (
    "interested_email1",
    "interested_email2",
    "interested_email3",
)

OnboardingStatus = Literal[
    "not_initialized",
    "copy_incomplete",
    "webhook_incomplete",
    "ready",
]


def normalize_webhook_url(url: str) -> str:
    return url.strip().rstrip("/")


def find_campaign_webhook(
    webhooks: list[dict[str, Any]],
    *,
    campaign_id: str,
    target_url: str,
) -> dict[str, Any] | None:
    target = normalize_webhook_url(target_url)
    for hook in webhooks:
        if str(hook.get("event_type") or "") != "lead_interested":
            continue
        url = normalize_webhook_url(str(hook.get("target_hook_url") or ""))
        if url != target:
            continue
        campaign = hook.get("campaign") or hook.get("campaign_id")
        if not campaign or str(campaign) == campaign_id:
            return hook
    return None


def copy_is_complete(templates: list[dict[str, Any]]) -> bool:
    by_key = {str(row.get("template_key") or ""): row for row in templates}
    for key in INTERESTED_TEMPLATE_KEYS:
        body = str((by_key.get(key) or {}).get("body_html") or "")
        if not body.strip():
            return False
    return True


def e1_copy_is_ready(templates: list[dict[str, Any]]) -> bool:
    for row in templates:
        if row.get("template_key") == "interested_email1":
            return bool(str(row.get("body_html") or "").strip())
    return False


def derive_onboarding_status(
    *,
    has_config: bool,
    has_webhook: bool,
    copy_complete: bool,
) -> OnboardingStatus:
    if not has_config:
        return "not_initialized"
    if not copy_complete:
        return "copy_incomplete"
    if not has_webhook:
        return "webhook_incomplete"
    return "ready"


def initialize_campaign(
    instantly_client: Any,
    *,
    campaign_id: str,
    campaign_name: str,
    target_url: str,
    secret: str,
) -> dict[str, Any]:
    existing = get_config(campaign_id)
    now = datetime.now(timezone.utc).isoformat()
    row: dict[str, Any] = {
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "webhook_auto_send_enabled": True,
        "initialized_at": (existing or {}).get("initialized_at") or now,
    }
    if existing and existing.get("webhook_id"):
        row["webhook_id"] = existing["webhook_id"]
    save_config(row)
    seed_empty_templates(campaign_id)

    webhooks = instantly_client.list_webhooks()
    match = find_campaign_webhook(
        webhooks,
        campaign_id=campaign_id,
        target_url=target_url,
    )
    if match:
        webhook_id = str(match.get("id") or "")
    else:
        if not secret:
            raise ValueError(
                "Set INSTANTLY_BYPASS_WEBHOOK_SECRET (or CRON_SECRET) before initializing."
            )
        created = instantly_client.create_webhook(
            target_hook_url=target_url,
            event_type="lead_interested",
            name=f"Hercule Interested Bypass — {campaign_name}"[:80],
            campaign=campaign_id,
            headers={"Authorization": f"Bearer {secret}"},
        )
        webhook_id = str(created.get("id") or "")
    if webhook_id:
        save_config({"campaign_id": campaign_id, "webhook_id": webhook_id})
    config = get_config(campaign_id)
    if not config:
        raise RuntimeError("Failed to persist campaign config")
    return config
