"""Tests for grok_usage billing parse and fetch."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from grok_usage import (
    GrokUsageSnapshot,
    fetch_grok_usage,
    format_usage_label,
    parse_billing_credits,
    parse_prepaid_balance,
    usage_severity,
)


class ParseBillingCreditsTests(unittest.TestCase):
    def test_credit_usage_percent(self) -> None:
        snapshot = parse_billing_credits(
            {"config": {"creditUsagePercent": 75.0, "currentPeriod": {"end": "2026-09-12T00:00:00Z"}}}
        )
        self.assertEqual(snapshot.remaining_percent, 25.0)
        self.assertEqual(snapshot.period_end, "2026-09-12T00:00:00Z")

    def test_credit_usage_percent_exhausted(self) -> None:
        snapshot = parse_billing_credits({"config": {"creditUsagePercent": 100.0}})
        self.assertEqual(snapshot.remaining_percent, 0.0)
        self.assertEqual(usage_severity(snapshot), "critical")

    def test_legacy_used_monthly_limit(self) -> None:
        snapshot = parse_billing_credits(
            {
                "config": {
                    "used": {"val": "2500"},
                    "monthlyLimit": {"val": "10000"},
                }
            }
        )
        self.assertEqual(snapshot.remaining_percent, 75.0)
        self.assertEqual(snapshot.source, "billing_credits_legacy")

    def test_missing_config(self) -> None:
        snapshot = parse_billing_credits({})
        self.assertIsNone(snapshot.remaining_percent)
        self.assertTrue(snapshot.error)


class ParsePrepaidBalanceTests(unittest.TestCase):
    def test_negative_total_is_remaining_balance(self) -> None:
        snapshot = parse_prepaid_balance({"total": {"val": "-1000"}})
        self.assertEqual(snapshot.remaining_usd, 10.0)

    def test_purchase_history_enables_percent(self) -> None:
        snapshot = parse_prepaid_balance(
            {
                "total": {"val": "-500"},
                "changes": [
                    {
                        "changeOrigin": "PURCHASE",
                        "amount": {"val": "-1000"},
                    }
                ],
            }
        )
        self.assertEqual(snapshot.remaining_usd, 5.0)
        self.assertEqual(snapshot.remaining_percent, 50.0)


class FormatUsageLabelTests(unittest.TestCase):
    def test_percent_label(self) -> None:
        label = format_usage_label(GrokUsageSnapshot(42.0, None, None, "billing_credits"))
        self.assertEqual(label, "Grok · 42% restant")

    def test_usd_label(self) -> None:
        label = format_usage_label(GrokUsageSnapshot(None, 12.5, None, "management_prepaid"))
        self.assertEqual(label, "Grok · $12.50 restants")


class FetchGrokUsageTests(unittest.TestCase):
    @patch("grok_usage.grok_management_key", return_value="")
    @patch("grok_usage.grok_api_key", return_value="inference-key")
    @patch("grok_usage.requests.get")
    def test_fetch_billing_success(self, mock_get: MagicMock, *_mocks: object) -> None:
        mock_get.return_value.ok = True
        mock_get.return_value.json.return_value = {"config": {"creditUsagePercent": 80.0}}

        snapshot = fetch_grok_usage()
        self.assertEqual(snapshot.remaining_percent, 20.0)
        mock_get.assert_called_once()

    @patch("grok_usage.grok_management_key", return_value="")
    @patch("grok_usage.grok_api_key", return_value="inference-key")
    @patch("grok_usage.requests.get")
    def test_fetch_http_error(self, mock_get: MagicMock, *_mocks: object) -> None:
        mock_get.return_value.ok = False
        mock_get.return_value.status_code = 403

        snapshot = fetch_grok_usage()
        self.assertIsNone(snapshot.remaining_percent)
        self.assertTrue(snapshot.error)


if __name__ == "__main__":
    unittest.main()
