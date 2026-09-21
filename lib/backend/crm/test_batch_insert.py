"""Unit tests for resilient batch insert and partial pipeline recovery."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from pipeline import provision_from_instantly_leads
from supabase_repo import (
    BatchInsertPartialError,
    BatchUpdatePartialError,
    insert_leads_batch,
    update_leads_batch,
)


class BatchInsertTests(unittest.TestCase):
    def test_partial_error_preserves_inserted_rows(self) -> None:
        rows = [{"email": f"u{i}@example.com", "slug": f"s{i}"} for i in range(250)]
        call_count = 0

        class FakeTable:
            def insert(self, chunk: list[dict]) -> "FakeTable":
                self._chunk = chunk
                return self

            def select(self, _columns: str) -> "FakeTable":
                return self

            def execute(self) -> MagicMock:
                nonlocal call_count
                call_count += 1
                if call_count >= 3:
                    raise RuntimeError("Server disconnected")
                return MagicMock(
                    data=[
                        {"email": row["email"], "slug": row["slug"], "statut": "NOTBOOKED"}
                        for row in self._chunk
                    ]
                )

        client = MagicMock()
        client.table.return_value = FakeTable()

        with patch("supabase_repo.supabase_insert_batch_size", return_value=100), patch(
            "supabase_repo.supabase_batch_max_retries", return_value=1
        ):
            with self.assertRaises(BatchInsertPartialError) as ctx:
                insert_leads_batch(client, category="agence", rows=rows)

        partial = ctx.exception
        self.assertEqual(len(partial.inserted), 200)
        self.assertEqual(len(partial.remaining), 50)

    def test_pipeline_continues_to_instantly_on_partial_insert(self) -> None:
        selected = [
            {"id": f"inst-{i}", "email": f"bench{i}@example.com"}
            for i in range(10)
        ]
        inserted_rows = [
            {
                "id": f"db-{i}",
                "email": f"bench{i}@example.com",
                "slug": f"slug{i}",
                "statut": "NOTBOOKED",
            }
            for i in range(6)
        ]
        remaining = [
            {"email": f"bench{i}@example.com", "slug": f"slug{i}"} for i in range(6, 10)
        ]
        mock_instantly = MagicMock()
        mock_instantly.patch_leads_custom_variables_parallel.return_value = {
            "patched": 6,
            "failed": 0,
            "errors": [],
        }

        with patch("pipeline.load_email_index", return_value={}), patch(
            "pipeline.load_slug_set", return_value=set()
        ), patch(
            "pipeline.insert_leads_batch",
            side_effect=BatchInsertPartialError(
                inserted_rows, remaining, RuntimeError("Server disconnected")
            ),
        ), patch(
            "pipeline.allocate_slugs",
            return_value=[f"slug{i}" for i in range(10)],
        ):
            result = provision_from_instantly_leads(
                category="agence",
                campaign_id="camp-1",
                selected_leads=selected,
                instantly=mock_instantly,
                supabase=MagicMock(),
                patch_instantly=True,
            )

        self.assertTrue(result.partial_supabase)
        self.assertEqual(result.created, 6)
        self.assertEqual(result.insert_failed, 4)
        self.assertEqual(result.patched, 6)
        mock_instantly.patch_leads_custom_variables_parallel.assert_called_once()


class BatchUpdateTests(unittest.TestCase):
    def test_partial_update_preserves_successful_rows(self) -> None:
        updates = [(f"id-{i}", {"slug": f"s{i}"}) for i in range(10)]
        call_count = 0

        def fake_update_lead(
            _client: object,
            *,
            category: str,
            lead_id: str,
            patch: dict,
        ) -> dict:
            nonlocal call_count
            call_count += 1
            index = int(lead_id.split("-")[1])
            if index >= 7:
                raise RuntimeError("Server disconnected")
            return {"id": lead_id, "email": f"u{index}@example.com", **patch}

        with patch("supabase_repo.update_lead", side_effect=fake_update_lead), patch(
            "supabase_repo.supabase_insert_batch_size", return_value=10
        ), patch("supabase_repo.supabase_batch_max_retries", return_value=1):
            with self.assertRaises(BatchUpdatePartialError) as ctx:
                update_leads_batch(None, category="agence", updates=updates, max_workers=4)

        partial = ctx.exception
        self.assertEqual(len(partial.updated), 7)
        self.assertEqual(len(partial.remaining), 3)

    def test_pipeline_continues_on_partial_update(self) -> None:
        existing_row = {
            "id": "db-1",
            "email": "existing@example.com",
            "slug": "abc123",
            "statut": "NOTBOOKED",
        }
        selected = [{"id": "inst-1", "email": "existing@example.com"}]
        mock_instantly = MagicMock()
        mock_instantly.patch_leads_custom_variables_parallel.return_value = {
            "patched": 1,
            "failed": 0,
            "errors": [],
        }

        with patch(
            "pipeline.load_email_index",
            return_value={"existing@example.com": ("agence", existing_row)},
        ), patch("pipeline.load_slug_set", return_value={"abc123"}), patch(
            "pipeline.insert_leads_batch", return_value=[]
        ), patch(
            "pipeline.update_leads_batch",
            side_effect=BatchUpdatePartialError([], [("db-1", {})], RuntimeError("timeout")),
        ):
            result = provision_from_instantly_leads(
                category="agence",
                campaign_id="camp",
                selected_leads=selected,
                instantly=mock_instantly,
                supabase=MagicMock(),
                patch_instantly=True,
            )

        self.assertTrue(result.partial_supabase)
        self.assertEqual(result.update_failed, 1)
        self.assertEqual(result.patched, 1)
        mock_instantly.patch_leads_custom_variables_parallel.assert_called_once()


if __name__ == "__main__":
    unittest.main()
