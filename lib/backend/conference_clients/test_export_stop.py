from __future__ import annotations

import threading
import unittest

from conference_clients.export_replies import export_not_interested_non


class _PageClient:
    """Returns endless Not-interested pages whose replies are all « non »."""

    def __init__(self) -> None:
        self.pages = 0
        self.email_lookups = 0
        self._lock = threading.Lock()

    def _fetch(self, endpoint: str, method: str = "GET", body: dict | None = None):
        self.pages += 1
        body = body or {}
        start = int(body.get("starting_after") or 0)
        limit = int(body["limit"])
        items = [
            {
                "id": str(i + 1),
                "email": f"user{i}@cabinet{i}.fr",
                "lt_interest_status": -1,
                "company_name": f"Cabinet {i}",
                "website": f"https://cabinet{i}.fr",
            }
            for i in range(start, start + limit)
        ]
        return {"items": items, "next_starting_after": str(start + limit)}

    def list_emails(self, **_kwargs):
        with self._lock:
            self.email_lookups += 1
        return [{"id": "m1", "body": {"text": "non"}, "timestamp_email": "1"}]

    def get_email(self, _email_id: str):
        return None


class ExportStopTests(unittest.TestCase):
    def test_stops_at_16_per_campaign_without_next_page(self) -> None:
        client = _PageClient()
        rows, report = export_not_interested_non(
            client,  # type: ignore[arg-type]
            campaigns=[
                {"id": "dec", "name": "DEC", "category": "accounting"},
                {"id": "cif", "name": "CIF", "category": "brokerage"},
            ],
            max_leads=2000,
            delay_s=0,
        )
        self.assertEqual(report["counts"], {"accounting": 16, "brokerage": 16})
        self.assertEqual(len(rows), 32)
        self.assertEqual(client.pages, 2)
        self.assertEqual(client.email_lookups, 32)
        self.assertTrue(all(row["stopped_early"] for row in report["by_campaign"]))


if __name__ == "__main__":
    unittest.main()
