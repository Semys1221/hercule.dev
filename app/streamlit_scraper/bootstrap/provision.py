"""Idempotent Instantly list + draft campaign + subsequence provisioning for niche presets."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from typing import Any

from bootstrap.discovery import (
    discover_presets,
    invalidate_preset_cache,
    is_configs_preset,
    preset_config_path,
)
from instantly_client import (
    ensure_campaign,
    ensure_lead_list,
    ensure_subsequence,
    instantly_resource_name,
)

_LIST_ID_RE = re.compile(r'^(_LIST_ID\s*=\s*)(["\'])([^"\']*)\2', re.M)
_CAMPAIGN_ID_RE = re.compile(r'^(_CAMPAIGN_ID\s*=\s*)(["\'])([^"\']*)\2', re.M)
_SUBSEQUENCE_ID_RE = re.compile(r'^(_SUBSEQUENCE_ID\s*=\s*)(["\'])([^"\']*)\2', re.M)

_REPO_ROOT = Path(__file__).resolve().parents[3]
_SUBSEQUENCE_APP = _REPO_ROOT / "app" / "streamlit_subsequence"


def _uuid(value: Any) -> str:
    return str(value or "").strip()


def write_instantly_ids(
    config_path: str,
    *,
    list_id: str,
    campaign_id: str,
    subsequence_id: str = "",
) -> None:
    with open(config_path, encoding="utf-8") as f:
        text = f.read()

    if _LIST_ID_RE.search(text):
        text = _LIST_ID_RE.sub(rf'\1"{list_id}"', text, count=1)
    else:
        text = f'_LIST_ID = "{list_id}"\n' + text

    if _CAMPAIGN_ID_RE.search(text):
        text = _CAMPAIGN_ID_RE.sub(rf'\1"{campaign_id}"', text, count=1)
    else:
        text = text.replace(
            f'_LIST_ID = "{list_id}"',
            f'_LIST_ID = "{list_id}"\n_CAMPAIGN_ID = "{campaign_id}"',
            1,
        )

    if subsequence_id:
        if _SUBSEQUENCE_ID_RE.search(text):
            text = _SUBSEQUENCE_ID_RE.sub(rf'\1"{subsequence_id}"', text, count=1)
        else:
            text = text.replace(
                f'_CAMPAIGN_ID = "{campaign_id}"',
                f'_CAMPAIGN_ID = "{campaign_id}"\n_SUBSEQUENCE_ID = "{subsequence_id}"',
                1,
            )

    tmp = config_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, config_path)


def _onboard_subsequence_app(
    *,
    campaign_id: str,
    campaign_name: str,
    api_key: str = "",
    clone_from: str = "",
    log_cb: Any = None,
) -> dict[str, Any] | None:
    """Initialize streamlit_subsequence Supabase config + webhook when env allows."""
    if not _SUBSEQUENCE_APP.is_dir():
        if log_cb:
            log_cb("streamlit_subsequence app not found — skipping onboarding")
        return None

    app_dir = str(_SUBSEQUENCE_APP)
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)
    repo = str(_REPO_ROOT)
    if repo not in sys.path:
        sys.path.insert(0, repo)

    try:
        from config import webhook_public_url, webhook_secret, webhook_url_error
        from onboarding import initialize_campaign
        from shared.instantly_client import InstantlyClient
        from supabase_repo import BIGGY_TEMPLATE_SOURCE, clone_templates
    except ImportError as exc:
        if log_cb:
            log_cb(f"Subsequence onboarding import failed: {exc}")
        return None

    url_error = webhook_url_error()
    if url_error:
        if log_cb:
            log_cb(f"Subsequence webhook skipped: {url_error}")
        return None

    secret = webhook_secret()
    if not secret:
        if log_cb:
            log_cb("INSTANTLY_BYPASS_WEBHOOK_SECRET / CRON_SECRET missing — webhook skipped")
        return None

    try:
        from shared.instantly_client import InstantlyClient, get_api_key

        key = api_key or get_api_key()
        if not key:
            if log_cb:
                log_cb("INSTANTLY_API_KEY missing — onboarding skipped")
            return None
        client = InstantlyClient(key)
        config = initialize_campaign(
            client,
            campaign_id=campaign_id,
            campaign_name=campaign_name,
            target_url=webhook_public_url(),
            secret=secret,
        )
        source = (clone_from or BIGGY_TEMPLATE_SOURCE).strip()
        cloned = clone_templates(source, campaign_id)
        if log_cb and cloned:
            log_cb(f"Cloned templates: {', '.join(cloned)}")
        config = dict(config)
        config["cloned_templates"] = cloned
        return config
    except Exception as exc:
        if log_cb:
            log_cb(f"Subsequence onboarding failed: {exc}")
        return None


def onboard_subsequence_preset(
    preset_id: str,
    *,
    api_key: str = "",
    clone_from: str = "",
    dry_run: bool = False,
    log_cb: Any = None,
) -> dict[str, Any]:
    """Idempotent Supabase + webhook onboarding for an existing preset campaign."""
    presets = discover_presets(use_cache=True)
    meta = presets[preset_id]
    config = meta.loader()
    label = meta.label
    name = instantly_resource_name(label)
    campaign_id = _uuid(config.get("INSTANTLY_CAMPAIGN_ID"))
    subsequence_id = _uuid(config.get("INSTANTLY_SUBSEQUENCE_ID"))

    if not campaign_id:
        raise ValueError(f"{preset_id}: INSTANTLY_CAMPAIGN_ID missing")

    if dry_run:
        return {
            "preset_id": preset_id,
            "label": label,
            "name": name,
            "campaign_id": campaign_id,
            "subsequence_id": subsequence_id,
            "dry_run": True,
            "skipped": False,
        }

    result = _onboard_subsequence_app(
        campaign_id=campaign_id,
        campaign_name=name,
        api_key=api_key,
        clone_from=clone_from,
        log_cb=log_cb,
    )
    if result is None:
        raise RuntimeError(f"{preset_id}: subsequence onboarding failed or env incomplete")

    return {
        "preset_id": preset_id,
        "label": label,
        "name": name,
        "campaign_id": campaign_id,
        "subsequence_id": subsequence_id,
        "cloned_templates": result.get("cloned_templates") or [],
        "skipped": False,
    }


def provision_preset(
    preset_id: str,
    *,
    api_key: str,
    dry_run: bool = False,
    with_subsequence: bool = False,
    log_cb: Any = None,
) -> dict[str, Any]:
    presets = discover_presets(use_cache=True)
    meta = presets[preset_id]
    config = meta.loader()
    label = meta.label
    name = instantly_resource_name(label)
    existing_list = _uuid(config.get("INSTANTLY_LIST_ID"))
    existing_campaign = _uuid(config.get("INSTANTLY_CAMPAIGN_ID"))
    existing_subsequence = _uuid(config.get("INSTANTLY_SUBSEQUENCE_ID"))

    needs_list = not existing_list
    needs_campaign = not existing_campaign
    needs_subsequence = with_subsequence and not existing_subsequence

    if not needs_list and not needs_campaign and not needs_subsequence:
        return {
            "preset_id": preset_id,
            "label": label,
            "name": name,
            "list_id": existing_list,
            "campaign_id": existing_campaign,
            "subsequence_id": existing_subsequence,
            "created_list": False,
            "created_campaign": False,
            "created_subsequence": False,
            "skipped": True,
        }

    if dry_run:
        return {
            "preset_id": preset_id,
            "label": label,
            "name": name,
            "list_id": existing_list,
            "campaign_id": existing_campaign,
            "subsequence_id": existing_subsequence,
            "created_list": needs_list,
            "created_campaign": needs_campaign,
            "created_subsequence": needs_subsequence,
            "skipped": False,
            "dry_run": True,
        }

    list_id = existing_list
    campaign_id = existing_campaign
    subsequence_id = existing_subsequence
    created_list = False
    created_campaign = False
    created_subsequence = False

    if not list_id:
        created = ensure_lead_list(api_key, name)
        list_id = _uuid(created.get("id"))
        created_list = True
    if not campaign_id:
        created = ensure_campaign(api_key, name)
        campaign_id = _uuid(created.get("id"))
        created_campaign = True

    if with_subsequence and campaign_id and not subsequence_id:
        created = ensure_subsequence(
            api_key,
            parent_campaign_id=campaign_id,
            name=f"Interested bypass — {label}"[:80],
        )
        subsequence_id = _uuid(created.get("id"))
        created_subsequence = True
        _onboard_subsequence_app(
            campaign_id=campaign_id,
            campaign_name=name,
            api_key=api_key,
            log_cb=log_cb,
        )

    write_instantly_ids(
        meta.config_path,
        list_id=list_id,
        campaign_id=campaign_id,
        subsequence_id=subsequence_id,
    )
    invalidate_preset_cache()
    from config_loader import invalidate_preset_registry

    invalidate_preset_registry()
    return {
        "preset_id": preset_id,
        "label": label,
        "name": name,
        "list_id": list_id,
        "campaign_id": campaign_id,
        "subsequence_id": subsequence_id,
        "created_list": created_list,
        "created_campaign": created_campaign,
        "created_subsequence": created_subsequence,
        "skipped": False,
        "path": preset_config_path(preset_id),
    }


def provision_targets(preset_id: str = "") -> list[str]:
    presets = discover_presets(use_cache=True)
    if preset_id:
        if preset_id not in presets:
            raise KeyError(preset_id)
        return [preset_id]
    return sorted(presets.keys())
