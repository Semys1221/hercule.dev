#!/usr/bin/env python3
"""Dry-run + fake-lead smoke tests for streamlit_subsequence send queue.

Usage:
  pnpm smoke-streamlit-subsequence
  python3 ./scripts/streamlit_subsequence/smokeSendQueue.py

No Supabase or Instantly credentials required — all external calls are mocked.
"""

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
    _default_checked,
    _is_eligible,
    dispatch_bulk,
    dispatch_one,
    fetch_queue,
)

FAKE_CAMPAIGN_ID = "fake-campaign-id"
FAKE_CONFIG = {
    "campaign_id": FAKE_CAMPAIGN_ID,
    "interested_subsequence_id": "sub-interested",
    "no_reply_subsequence_id": "sub-no-reply",
    "waiting_for_reply_interest_value": 42,
}

FAKE_LEADS = [
    {
        "id": "fake-lead-1",
        "email": "fake.subseq.1@hercule.test",
        "first_name": "Fake",
        "lt_interest_status": 1,
        "subsequence_id": "sub-interested",
    },
    {
        "id": "fake-lead-2",
        "email": "fake.subseq.2@hercule.test",
        "first_name": "Fake2",
        "lt_interest_status": 1,
        "subsequence_id": "sub-interested",
    },
    {
        "id": "fake-lead-3",
        "email": "fake.subseq.3@hercule.test",
        "first_name": "NotInterested",
        "lt_interest_status": 0,
        "subsequence_id": "sub-interested",
    },
]


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
            step="interested_email1",
            leads=FAKE_LEADS[:2],
            dry_run=True,
            config=FAKE_CONFIG,
        )

        assert result.sent == 2, f"expected 2 sent, got {result.sent}"
        assert result.failed == 0, f"expected 0 failed, got {result.failed}"
        assert result.skipped == 0, f"expected 0 skipped, got {result.skipped}"
        mock_client.reply_to_email.assert_not_called()
        print("OK dry-run bulk dispatch: sent=2, no Instantly calls")


def test_eligibility_positive_email1() -> None:
    with patch("send_queue.has_sent_event", return_value=False):
        interested = _is_eligible(
            step="interested_email1",
            sequence="positive",
            lead=FAKE_LEADS[0],
            campaign_id=FAKE_CAMPAIGN_ID,
            config=FAKE_CONFIG,
        )
        not_interested = _is_eligible(
            step="interested_email1",
            sequence="positive",
            lead=FAKE_LEADS[2],
            campaign_id=FAKE_CAMPAIGN_ID,
            config=FAKE_CONFIG,
        )

    assert interested is True
    assert not_interested is False
    print("OK eligibility: interested lead included, non-interested excluded")


def test_reply_default_unchecked() -> None:
    assert _default_checked("interested_email2", replied_since_last=True) is False
    assert _default_checked("interested_email2", replied_since_last=False) is True
    assert _default_checked("no_reply_email1", replied_since_last=False) is True
    print("OK reply default: Email 2 unchecked when replied, Email 1 always checked")


def test_fetch_queue_reply_enrichment() -> None:
    mock_client = MagicMock()
    mock_client._fetch.return_value = {
        "items": [
            {
                **FAKE_LEADS[0],
                "email": FAKE_LEADS[0]["email"],
            }
        ],
    }

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.get_event_sent_at", return_value="2026-01-01T00:00:00Z"),
        patch("send_queue.lead_has_replied_since", return_value=True),
        patch("send_queue.time.sleep"),
    ):
        rows = fetch_queue(
            campaign_id=FAKE_CAMPAIGN_ID,
            step="interested_email2",
            sequence="positive",
            config=FAKE_CONFIG,
            max_leads=10,
            client=mock_client,
        )

    assert len(rows) == 1
    assert rows[0].replied_since_last is True
    assert rows[0].envoyer is False
    print("OK fetch_queue: replied lead unchecked by default for Email 2")


def test_idempotency_skip() -> None:
    mock_client = MagicMock()

    with patch("send_queue.has_sent_event", return_value=True):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            template_key="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEADS[0],
            dry_run=False,
        )

    assert result.get("skipped") == "already_sent"
    mock_client.reply_to_email.assert_not_called()
    print("OK idempotency: already-sent lead skipped")


def main() -> None:
    tests = [
        test_dry_run_bulk_dispatch,
        test_eligibility_positive_email1,
        test_reply_default_unchecked,
        test_fetch_queue_reply_enrichment,
        test_idempotency_skip,
    ]
    for test in tests:
        test()
    print(f"\nAll {len(tests)} smoke tests passed.")


if __name__ == "__main__":
    main()
