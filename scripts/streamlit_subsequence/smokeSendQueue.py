#!/usr/bin/env python3
"""Dry-run + fake-lead smoke tests for streamlit_subsequence send queue v2."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from send_queue import (  # noqa: E402
    dispatch_bulk,
    dispatch_one,
    fetch_sequence_leads,
)

FAKE_CAMPAIGN_ID = "fake-campaign-id"

FAKE_LEAD_WITH_LINK = {
    "id": "fake-lead-1",
    "email": "fake.subseq.1@hercule.test",
    "first_name": "Fake",
    "lt_interest_status": 1,
    "payload": {
        "reservation_agence_link": "https://www.hercule.dev/reservation.html/abc123",
        "accountSignature": "Marie — Hercule",
    },
}

FAKE_LEAD_NO_LINK = {
    "id": "fake-lead-2",
    "email": "fake.subseq.2@hercule.test",
    "first_name": "Fake2",
    "lt_interest_status": 1,
    "payload": {},
}


def test_dry_run_bulk_dispatch() -> None:
    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.InstantlyClient") as mock_client_cls,
    ):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        result = dispatch_bulk(
            campaign_id=FAKE_CAMPAIGN_ID,
            flow="interested_email1",
            leads=[FAKE_LEAD_WITH_LINK],
            dry_run=True,
        )

        assert result.sent == 1
        assert result.failed == 0
        mock_client.reply_to_email.assert_not_called()
        print("OK dry-run bulk dispatch")


def test_fetch_interested_leads() -> None:
    mock_client = MagicMock()
    mock_client.list_leads_by_interest_filter.return_value = [FAKE_LEAD_WITH_LINK]

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.get_last_send_at", return_value=None),
        patch("send_queue.list_sent_flows", return_value=[]),
    ):
        rows = fetch_sequence_leads(
            campaign_id=FAKE_CAMPAIGN_ID,
            sequence="interested",
            max_leads=10,
            client=mock_client,
        )

    assert len(rows) == 1
    assert rows[0].envoyer is True
    assert rows[0].missing_reservation_link is False
    mock_client.list_leads_by_interest_filter.assert_called_once()
    print("OK fetch interested leads")


def test_reply_since_any_send_unchecked() -> None:
    mock_client = MagicMock()
    mock_client.list_leads_by_interest_filter.return_value = [FAKE_LEAD_WITH_LINK]

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.get_last_send_at", return_value="2026-01-01T00:00:00Z"),
        patch("send_queue.list_sent_flows", return_value=["interested_email1"]),
        patch("send_queue.lead_has_replied_since", return_value=True),
        patch("send_queue.time.sleep"),
    ):
        rows = fetch_sequence_leads(
            campaign_id=FAKE_CAMPAIGN_ID,
            sequence="interested",
            client=mock_client,
        )

    assert len(rows) == 1
    assert rows[0].replied_since_last_send is True
    assert rows[0].envoyer is False
    print("OK reply since any Hercule send → unchecked")


def test_missing_link_blocks_send() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.record_event") as record,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_NO_LINK,
            dry_run=False,
        )

    assert result.get("error") == "missing_reservation_link"
    mock_client.reply_to_email.assert_not_called()
    record.assert_called_once()
    print("OK missing reservation_agence_link blocks send")


def test_final_email_sets_not_interested() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue._load_template", return_value={"subject": "", "body_html": "bye"}),
        patch(
            "send_queue.resolve_thread",
            return_value={
                "reply_to_uuid": "uuid-1",
                "eaccount": "sender@example.com",
                "subject": "Existing thread",
            },
        ),
        patch("send_queue.record_event"),
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email3",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result.get("ok") is True
    mock_client.update_interest_status.assert_called_once_with(
        lead_email=FAKE_LEAD_WITH_LINK["email"],
        interest_value=-1,
        campaign_id=FAKE_CAMPAIGN_ID,
    )
    print("OK final email sets Not Interested (-1)")


def test_idempotency_skip() -> None:
    mock_client = MagicMock()

    with patch("send_queue.has_sent_event", return_value=True):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result.get("skipped") == "already_sent"
    mock_client.reply_to_email.assert_not_called()
    print("OK idempotency skip")


def main() -> None:
    tests = [
        test_dry_run_bulk_dispatch,
        test_fetch_interested_leads,
        test_reply_since_any_send_unchecked,
        test_missing_link_blocks_send,
        test_final_email_sets_not_interested,
        test_idempotency_skip,
    ]
    for test in tests:
        test()
    print(f"\nAll {len(tests)} smoke tests passed.")


if __name__ == "__main__":
    main()
