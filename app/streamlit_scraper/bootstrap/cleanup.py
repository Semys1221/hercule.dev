"""Remove deprecated monolithic Instantly lists and campaigns."""

from __future__ import annotations

from typing import Any

from instantly_client import delete_campaign, delete_lead_list

DEPRECATED_RESOURCES: dict[str, dict[str, str]] = {
    "btp_reno": {
        "list_id": "4cb53db3-b323-4dba-bd82-152f486ecd2c",
        "campaign_id": "7fc142be-ac42-4527-8b4d-8877752d8d7f",
    },
    "pme_industrie": {
        "list_id": "d6b95e96-0e79-4aa1-948a-89916f7f8586",
        "campaign_id": "42ef0c03-05ee-488d-81de-7eb75d023982",
    },
    "cliniques_medical": {
        "list_id": "f98cb5fc-811e-4bdb-8c84-5b3d77824043",
        "campaign_id": "f26cd240-be44-4dad-81d4-ebd4dcb94689",
    },
    "transport_logistique": {
        "list_id": "e803f27d-db8a-40b1-8b8a-285d3cfe7d23",
        "campaign_id": "9be7c634-7961-460a-b13a-4f5f0590e569",
    },
    "expertise_conseil": {
        "list_id": "5170998d-da9b-4992-9628-bf5bc5b4edbf",
        "campaign_id": "fd0175d2-1d13-4616-b1b8-cc498b41e65d",
    },
    "formation_cfa": {
        "list_id": "533e3686-08ef-4c30-b961-de635af85643",
        "campaign_id": "117e193e-50ea-4f95-9a12-f7f5529e1156",
    },
}

PROTECTED_LIST_IDS = {
    "29119a30-89fb-457c-a723-583a7ddc98bd",  # services_fm — active scrape
}


def cleanup_targets(parent: str = "", *, all_deprecated: bool = False) -> list[str]:
    if all_deprecated:
        return sorted(DEPRECATED_RESOURCES.keys())
    if parent:
        if parent not in DEPRECATED_RESOURCES:
            raise KeyError(parent)
        return [parent]
    return []


def cleanup_deprecated(
    parent: str,
    *,
    api_key: str,
    dry_run: bool = True,
) -> dict[str, Any]:
    resources = DEPRECATED_RESOURCES[parent]
    list_id = resources["list_id"]
    campaign_id = resources["campaign_id"]

    if list_id in PROTECTED_LIST_IDS:
        raise RuntimeError(f"Refusing to delete protected list {list_id}")

    result: dict[str, Any] = {
        "parent": parent,
        "list_id": list_id,
        "campaign_id": campaign_id,
        "deleted_list": False,
        "deleted_campaign": False,
        "dry_run": dry_run,
    }

    if dry_run:
        return result

    try:
        delete_campaign(api_key, campaign_id)
        result["deleted_campaign"] = True
    except RuntimeError:
        result["deleted_campaign"] = True  # already removed

    try:
        delete_lead_list(api_key, list_id)
        result["deleted_list"] = True
    except RuntimeError:
        result["deleted_list"] = True  # already removed

    return result
