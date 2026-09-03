"""CRM shim — re-exports shared Instantly client with config-based auth."""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from shared.instantly_client import (  # noqa: E402
    InstantlyClient,
    crm_leads_to_dataframe as leads_to_dataframe,
    format_resource_label,
    lead_to_row,
)

_client: InstantlyClient | None = None


def get_instantly_client() -> InstantlyClient:
    global _client
    from config import require_instantly_key

    api_key = require_instantly_key()
    if _client is None or _client.api_key != api_key:
        _client = InstantlyClient(api_key)
    return _client


def count_leads_in_campaign(campaign_id: str) -> int:
    return get_instantly_client().count_leads_in_campaign(campaign_id.strip())


__all__ = [
    "InstantlyClient",
    "count_leads_in_campaign",
    "format_resource_label",
    "get_instantly_client",
    "lead_to_row",
    "leads_to_dataframe",
]
