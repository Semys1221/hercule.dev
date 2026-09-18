"""Tests for Instantly workspace-wide dedup."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from core_logic import _process_business  # noqa: E402
from instantly_client import (  # noqa: E402
    InstantlyClient,
    fetch_all_workspace_emails,
)


def test_process_business_workspace_duplicate_reason() -> None:
    config = {"TAXONOMY_GATE_ENABLED": False, "EXCLUDE_DOMAINS": []}
    seen_em = {"existing@example.com"}
    csv_seen = set()
    workspace_em = {"existing@example.com"}
    row, audit = _process_business(
        {
            "name": "Cabinet Test",
            "site": "https://example.com",
            "email_1": "existing@example.com",
        },
        config,
        seen_domain=set(),
        seen_em=seen_em,
        csv_seen_em=csv_seen,
        instantly_workspace_em=workspace_em,
    )
    assert row is None
    assert audit is not None
    assert audit["Reason"] == "instantly_workspace_duplicate"


def test_fetch_all_workspace_emails_unions_lists_and_campaigns(monkeypatch: pytest.MonkeyPatch) -> None:
    client = MagicMock(spec=InstantlyClient)
    client.list_all_lead_lists.return_value = [{"id": "list-a"}]
    client.list_all_campaigns.return_value = [{"id": "camp-b"}]
    client._paginate_lead_emails.side_effect = [
        {"a@example.com"},
        {"b@example.com", "a@example.com"},
    ]

    monkeypatch.setattr(
        "instantly_client.InstantlyClient",
        lambda _key: client,
    )
    monkeypatch.setattr(
        "instantly_client.load_workspace_email_cache",
        lambda **kwargs: None,
    )
    saved: list[dict] = []

    def _save(emails, **kwargs):
        saved.append({"count": len(emails), **kwargs})

    monkeypatch.setattr("instantly_client.save_workspace_email_cache", _save)

    emails = fetch_all_workspace_emails("test-key", use_cache=False)
    assert emails == {"a@example.com", "b@example.com"}
    assert client._paginate_lead_emails.call_count == 2
    assert saved[-1]["workspace_wide"] is True
    assert saved[-1]["complete"] is True


@pytest.mark.asyncio
async def test_upload_batch_includes_skip_if_in_workspace() -> None:
    from instantly_client import _upload_batch

    captured: dict = {}

    class FakeResponse:
        status_code = 200
        text = '{"leads_uploaded": 1, "skipped_count": 0}'

        def json(self):
            return {"leads_uploaded": 1, "skipped_count": 0}

    class FakeClient:
        async def post(self, url, headers=None, json=None):
            captured["json"] = json
            return FakeResponse()

    stats = await _upload_batch(
        FakeClient(),
        api_key="key",
        list_id="list-id",
        batch=[{"email": "x@example.com"}],
        skip_if_in_workspace=True,
    )
    assert stats["pushed"] == 1
    assert captured["json"]["skip_if_in_workspace"] is True
