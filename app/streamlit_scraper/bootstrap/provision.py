"""Idempotent Instantly list + draft campaign provisioning for niche presets."""

from __future__ import annotations

import os
import re
from typing import Any

from bootstrap.discovery import (
    discover_presets,
    invalidate_preset_cache,
    is_configs_preset,
    preset_config_path,
)
from instantly_client import ensure_campaign, ensure_lead_list, instantly_resource_name

_LIST_ID_RE = re.compile(r'^(_LIST_ID\s*=\s*)(["\'])([^"\']*)\2', re.M)
_CAMPAIGN_ID_RE = re.compile(r'^(_CAMPAIGN_ID\s*=\s*)(["\'])([^"\']*)\2', re.M)


def _uuid(value: Any) -> str:
    return str(value or "").strip()


def write_instantly_ids(config_path: str, *, list_id: str, campaign_id: str) -> None:
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

    tmp = config_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, config_path)


def provision_preset(
    preset_id: str,
    *,
    api_key: str,
    dry_run: bool = False,
) -> dict[str, Any]:
    presets = discover_presets(use_cache=True)
    meta = presets[preset_id]
    config = meta.loader()
    label = meta.label
    name = instantly_resource_name(label)
    existing_list = _uuid(config.get("INSTANTLY_LIST_ID"))
    existing_campaign = _uuid(config.get("INSTANTLY_CAMPAIGN_ID"))

    if existing_list and existing_campaign:
        return {
            "preset_id": preset_id,
            "label": label,
            "name": name,
            "list_id": existing_list,
            "campaign_id": existing_campaign,
            "created_list": False,
            "created_campaign": False,
            "skipped": True,
        }

    if dry_run:
        return {
            "preset_id": preset_id,
            "label": label,
            "name": name,
            "list_id": existing_list,
            "campaign_id": existing_campaign,
            "created_list": not existing_list,
            "created_campaign": not existing_campaign,
            "skipped": False,
            "dry_run": True,
        }

    list_id = existing_list
    campaign_id = existing_campaign
    created_list = False
    created_campaign = False

    if not list_id:
        created = ensure_lead_list(api_key, name)
        list_id = _uuid(created.get("id"))
        created_list = True
    if not campaign_id:
        created = ensure_campaign(api_key, name)
        campaign_id = _uuid(created.get("id"))
        created_campaign = True

    write_instantly_ids(meta.config_path, list_id=list_id, campaign_id=campaign_id)
    invalidate_preset_cache()
    from config_loader import invalidate_preset_registry

    invalidate_preset_registry()
    return {
        "preset_id": preset_id,
        "label": label,
        "name": name,
        "list_id": list_id,
        "campaign_id": campaign_id,
        "created_list": created_list,
        "created_campaign": created_campaign,
        "skipped": False,
        "path": preset_config_path(preset_id),
    }


def provision_targets(preset_id: str = "") -> list[str]:
    presets = discover_presets(use_cache=True)
    if preset_id:
        if preset_id not in presets:
            raise KeyError(preset_id)
        return [preset_id]
    return [pid for pid in sorted(presets) if is_configs_preset(pid)]
