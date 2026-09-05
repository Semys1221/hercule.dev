"""Tests for bulk_try_agent concurrency and isolation."""

from __future__ import annotations

import time
import unittest
from unittest.mock import MagicMock, patch

from pending_bulk_actions import bulk_try_agent
from pending_fetch import PendingReplyRow


def _row(email: str) -> PendingReplyRow:
    return PendingReplyRow(
        lead_email=email,
        last_reply_at="",
        last_reply_subject="Re: test",
        last_reply_preview="Hello",
        last_reply_id=None,
        thread_id=None,
    )


class BulkTryAgentConcurrencyTests(unittest.TestCase):
    @patch("pending_bulk_actions.upsert_lead_reply")
    @patch("pending_bulk_actions.generate_reply_preview")
    @patch("pending_bulk_actions.resolve_inbound_body")
    @patch("pending_bulk_actions.InstantlyClient")
    @patch("pending_bulk_actions.bulk_try_agent_concurrency", return_value=5)
    def test_runs_faster_than_sequential(
        self,
        _mock_concurrency: MagicMock,
        mock_client_cls: MagicMock,
        mock_resolve: MagicMock,
        mock_generate: MagicMock,
        _mock_upsert: MagicMock,
    ) -> None:
        mock_resolve.return_value = "inbound"
        mock_generate.side_effect = lambda *_a, **_k: {
            "should_reply": True,
            "reply_text": "Draft",
        }

        def slow_generate(*_args, **_kwargs):
            time.sleep(0.15)
            return {"should_reply": True, "reply_text": "Draft"}

        mock_generate.side_effect = slow_generate

        emails = {f"lead{i}@example.com" for i in range(6)}
        rows = [_row(email) for email in sorted(emails)]
        instantly = MagicMock(api_key="test-key")

        started = time.monotonic()
        result = bulk_try_agent(
            instantly,
            {"prompt_snapshot": "x", "target_type": "buyer"},
            rows,
            emails,
            "camp-1",
        )
        elapsed = time.monotonic() - started

        self.assertEqual(len(result.succeeded), 6)
        self.assertEqual(mock_client_cls.call_count, 6)
        self.assertLess(elapsed, 0.55)

    @patch("pending_bulk_actions.upsert_lead_reply")
    @patch("pending_bulk_actions.generate_reply_preview")
    @patch("pending_bulk_actions.resolve_inbound_body")
    @patch("pending_bulk_actions.InstantlyClient")
    @patch("pending_bulk_actions.bulk_try_agent_concurrency", return_value=5)
    def test_failure_on_one_lead_does_not_block_others(
        self,
        _mock_concurrency: MagicMock,
        mock_client_cls: MagicMock,
        mock_resolve: MagicMock,
        mock_generate: MagicMock,
        _mock_upsert: MagicMock,
    ) -> None:
        mock_resolve.return_value = "inbound"

        def generate(_config, _body, email: str) -> dict:
            if email == "bad@example.com":
                raise RuntimeError("grok failed")
            return {"should_reply": True, "reply_text": "OK"}

        mock_generate.side_effect = generate

        emails = {"good@example.com", "bad@example.com"}
        rows = [_row("good@example.com"), _row("bad@example.com")]
        instantly = MagicMock(api_key="test-key")

        result = bulk_try_agent(
            instantly,
            {"prompt_snapshot": "x", "target_type": "buyer"},
            rows,
            emails,
            "camp-1",
        )

        self.assertEqual(result.succeeded, ["good@example.com"])
        self.assertEqual(result.failed, [("bad@example.com", "grok failed")])
        self.assertEqual(mock_client_cls.call_count, 2)


if __name__ == "__main__":
    unittest.main()
