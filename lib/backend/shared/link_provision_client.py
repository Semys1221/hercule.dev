"""Post-push / pre-push link provisioning via Hercule Next.js API."""

from __future__ import annotations

import os
from typing import Any, Callable

import httpx
import requests

BATCH_SIZE = 100


def backend_url() -> str:
    configured = os.getenv("CRM_BACKEND_URL", "").strip().rstrip("/")
    if configured:
        return configured
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", "").strip().rstrip("/")
    if app_url and app_url.startswith("https://") and "localhost" not in app_url:
        return app_url
    return "https://www.hercule.dev"


def cron_secret() -> str:
    # Prefer LINK_TRACKING_WEBHOOK_SECRET first — matches
    # app/api/link-tracking/provision-leads/route.ts verifyProvisionLeadsSecret.
    return (
        os.getenv("LINK_TRACKING_WEBHOOK_SECRET", "").strip()
        or os.getenv("CRON_SECRET", "").strip()
        or os.getenv("INSTANTLY_BYPASS_WEBHOOK_SECRET", "").strip()
    )


def _debug_log(message: str, data: dict[str, Any], hypothesis_id: str) -> None:
    # #region agent log
    try:
        import json
        import time
        from pathlib import Path

        payload = {
            "sessionId": "5eb40c",
            "runId": "post-fix",
            "hypothesisId": hypothesis_id,
            "location": "shared/link_provision_client.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        line = json.dumps(payload, ensure_ascii=False) + "\n"
        for path in (
            Path("/Users/evqn/dev/hercule.dev/.cursor/debug-5eb40c.log"),
            Path("/var/lib/hercule/streamlit_scraper/output/courtiers_prevoyance_b2b/debug-5eb40c.log"),
            Path("/tmp/debug-5eb40c-provision.log"),
        ):
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                with path.open("a", encoding="utf-8") as f:
                    f.write(line)
            except OSError:
                continue
    except Exception:
        pass
    # #endregion


def _normalize_emails(emails: list[str]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for raw in emails:
        email = str(raw or "").strip().lower()
        if "@" not in email or email in seen:
            continue
        seen.add(email)
        normalized.append(email)
    return normalized


def _empty_stats() -> dict[str, Any]:
    return {
        "created": 0,
        "updated": 0,
        "patched": 0,
        "skipped": 0,
        "failed": 0,
        "batches": 0,
        "custom_variables_by_email": {},
    }


def provision_leads_batches(
    emails: list[str],
    *,
    list_id: str,
    campaign_id: str,
    niche: str | None = None,
    log_cb: Callable[[str], None] | None = None,
) -> dict[str, Any]:
    """
    Provision slug + tracking links in batches (sync).

    Returns aggregated stats plus custom_variables_by_email for campaign push merge.
    Skips gracefully when CRON_SECRET is missing.
    """
    secret = cron_secret()
    # #region agent log
    _debug_log(
        "provision_start",
        {
            "backend": backend_url(),
            "secret_present": bool(secret),
            "secret_len": len(secret) if secret else 0,
            "has_link_tracking": bool(
                os.getenv("LINK_TRACKING_WEBHOOK_SECRET", "").strip()
            ),
            "has_cron": bool(os.getenv("CRON_SECRET", "").strip()),
            "email_count": len(emails),
            "list_id": list_id,
            "campaign_id": campaign_id,
            "niche": niche,
        },
        "B",
    )
    # #endregion
    if not secret:
        if log_cb:
            log_cb(
                "Link provision skipped — CRON_SECRET / LINK_TRACKING_WEBHOOK_SECRET missing"
            )
        return {**_empty_stats(), "skipped_reason": "missing_secret"}

    normalized = _normalize_emails(emails)
    if not normalized:
        return _empty_stats()

    url = f"{backend_url()}/api/link-tracking/provision-leads"
    headers = {"Authorization": f"Bearer {secret}"}
    stats = _empty_stats()
    custom_variables_by_email: dict[str, dict[str, str]] = {}

    for start in range(0, len(normalized), BATCH_SIZE):
        batch = normalized[start : start + BATCH_SIZE]
        payload: dict[str, Any] = {
            "emails": batch,
            "listId": list_id.strip(),
            "campaignId": campaign_id.strip(),
        }
        if niche:
            payload["niche"] = niche.strip()

        if log_cb:
            log_cb(
                f"Provisioning tracking URLs for {len(batch)} lead(s) "
                f"(batch {stats['batches'] + 1})..."
            )

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
        except requests.RequestException as exc:
            stats["failed"] += len(batch)
            if log_cb:
                log_cb(f"Link provision error: {exc}")
            continue

        stats["batches"] += 1

        if response.status_code == 401:
            # #region agent log
            _debug_log(
                "provision_401",
                {
                    "url": url,
                    "secret_present": bool(secret),
                    "secret_len": len(secret),
                    "secret_source": (
                        "LINK_TRACKING_WEBHOOK_SECRET"
                        if os.getenv("LINK_TRACKING_WEBHOOK_SECRET", "").strip()
                        else "CRON_SECRET"
                        if os.getenv("CRON_SECRET", "").strip()
                        else "INSTANTLY_BYPASS_WEBHOOK_SECRET"
                        if os.getenv("INSTANTLY_BYPASS_WEBHOOK_SECRET", "").strip()
                        else "none"
                    ),
                    "status": response.status_code,
                    "body": (response.text or "")[:120],
                    "campaign_id": campaign_id,
                    "list_id": list_id,
                    "niche": niche,
                    "batch_emails": len(batch),
                },
                "A",
            )
            # #endregion
            if log_cb:
                log_cb("Link provision failed — unauthorized (check CRON_SECRET)")
            return {**stats, "custom_variables_by_email": custom_variables_by_email}

        if response.status_code >= 400:
            stats["failed"] += len(batch)
            if log_cb:
                log_cb(
                    f"Link provision failed — HTTP {response.status_code}: "
                    f"{response.text[:200]}"
                )
            continue

        data = response.json()
        result = data.get("result") if isinstance(data, dict) else None
        # #region agent log
        _debug_log(
            "provision_ok",
            {
                "status": response.status_code,
                "has_result": isinstance(result, dict),
                "created": int((result or {}).get("created") or 0)
                if isinstance(result, dict)
                else None,
                "updated": int((result or {}).get("updated") or 0)
                if isinstance(result, dict)
                else None,
                "patched": int((result or {}).get("patched") or 0)
                if isinstance(result, dict)
                else None,
                "batch_emails": len(batch),
                "campaign_id": campaign_id,
            },
            "C",
        )
        # #endregion
        if not isinstance(result, dict):
            if log_cb:
                log_cb("Link provision OK (no result payload)")
            continue

        for key in ("created", "updated", "patched", "skipped", "failed"):
            stats[key] += int(result.get(key) or 0)

        batch_vars = result.get("customVariablesByEmail")
        if isinstance(batch_vars, dict):
            for email, variables in batch_vars.items():
                if isinstance(email, str) and isinstance(variables, dict):
                    custom_variables_by_email[email.strip().lower()] = {
                        str(k): str(v) for k, v in variables.items()
                    }

    stats["custom_variables_by_email"] = custom_variables_by_email

    if log_cb:
        log_cb(
            "Link provision complete — "
            f"created={stats['created']}, updated={stats['updated']}, "
            f"patched={stats['patched']}, skipped={stats['skipped']}, "
            f"failed={stats['failed']}, "
            f"urls_ready={len(custom_variables_by_email)}"
        )

    return stats


async def provision_leads_after_push(
    emails: list[str],
    *,
    config: dict[str, Any],
    log_cb: Callable[[str], None],
) -> None:
    """Provision slug + tracking links for leads just pushed to Instantly (scraper)."""
    secret = cron_secret()
    if not secret:
        log_cb("Link provision skipped — CRON_SECRET / LINK_TRACKING_WEBHOOK_SECRET missing")
        return

    normalized = _normalize_emails(emails)
    if not normalized:
        return

    category = str(config.get("LINK_PROVISION_CATEGORY") or "cif").strip() or "cif"
    list_id = str(config.get("INSTANTLY_LIST_ID") or "").strip()
    campaign_id = str(config.get("INSTANTLY_CAMPAIGN_ID") or "").strip()

    if list_id and campaign_id:
        provision_leads_batches(
            normalized,
            list_id=list_id,
            campaign_id=campaign_id,
            niche=category,
            log_cb=log_cb,
        )
        return

    payload: dict[str, Any] = {
        "emails": normalized[:BATCH_SIZE],
        "niche": category,
    }
    if list_id:
        payload["listId"] = list_id
    if campaign_id:
        payload["campaignId"] = campaign_id

    url = f"{backend_url()}/api/link-tracking/provision-leads"
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
