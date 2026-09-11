"""Post-push link provisioning via Hercule Next.js API."""

from __future__ import annotations

import os
from typing import Any, Callable

import httpx


def _backend_url() -> str:
    configured = os.getenv("CRM_BACKEND_URL", "").strip().rstrip("/")
    if configured:
        return configured
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", "").strip().rstrip("/")
    if app_url and app_url.startswith("https://") and "localhost" not in app_url:
        return app_url
    return "https://www.hercule.dev"


def _cron_secret() -> str:
    return (
        os.getenv("CRON_SECRET", "").strip()
        or os.getenv("LINK_TRACKING_WEBHOOK_SECRET", "").strip()
        or os.getenv("INSTANTLY_BYPASS_WEBHOOK_SECRET", "").strip()
    )


async def provision_leads_after_push(
    emails: list[str],
    *,
    config: dict[str, Any],
    log_cb: Callable[[str], None],
) -> None:
    """Provision slug + tracking links for leads just pushed to Instantly."""
    secret = _cron_secret()
    if not secret:
        log_cb("Link provision skipped — CRON_SECRET / LINK_TRACKING_WEBHOOK_SECRET missing")
        return

    normalized = [
        str(email or "").strip().lower()
        for email in emails
        if "@" in str(email or "")
    ]
    if not normalized:
        return

    category = str(config.get("LINK_PROVISION_CATEGORY") or "cif").strip() or "cif"
    payload: dict[str, Any] = {
        "emails": normalized,
        "niche": category,
    }
    list_id = str(config.get("INSTANTLY_LIST_ID") or "").strip()
    campaign_id = str(config.get("INSTANTLY_CAMPAIGN_ID") or "").strip()
    if list_id:
        payload["listId"] = list_id
    if campaign_id:
        payload["campaignId"] = campaign_id

    url = f"{_backend_url()}/api/link-tracking/provision-leads"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {secret}"},
            )
        if response.status_code == 401:
            log_cb("Link provision failed — unauthorized (check CRON_SECRET on VPS)")
            return
        if response.status_code >= 400:
            log_cb(
                f"Link provision failed — HTTP {response.status_code}: "
                f"{response.text[:200]}"
            )
            return

        data = response.json()
        result = data.get("result") if isinstance(data, dict) else None
        if isinstance(result, dict):
            log_cb(
                "Link provision OK — "
                f"created={result.get('created', 0)}, "
                f"updated={result.get('updated', 0)}, "
                f"patched={result.get('patched', 0)}, "
                f"skipped={result.get('skipped', 0)}, "
                f"failed={result.get('failed', 0)}"
            )
        else:
            log_cb("Link provision OK")
    except Exception as exc:
        log_cb(f"Link provision error (scrape continues): {exc}")
