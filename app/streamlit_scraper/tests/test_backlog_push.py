"""INSTANTLY_BACKLOG_PUSH_MIN — push CSV rows missing from Instantly at startup."""

from __future__ import annotations

import csv
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from core_logic import _backlog_push_min, _push_csv_backlog_if_needed  # noqa: E402


def test_backlog_push_min_reads_config() -> None:
    assert _backlog_push_min({"INSTANTLY_BACKLOG_PUSH_MIN": 25}) == 25
    assert _backlog_push_min({"INSTANTLY_PUSH_EVERY": 50}) == 50


@pytest.mark.asyncio
async def test_backlog_push_skips_below_threshold(tmp_path: Path) -> None:
    csv_path = tmp_path / "leads.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["Email", "Company", "Website", "Service", "City"],
        )
        writer.writeheader()
        writer.writerow(
            {
                "Email": "new@example.com",
                "Company": "Co",
                "Website": "https://example.com",
                "Service": "svc",
                "City": "Paris",
            }
        )

    logs: list[str] = []

    pushed, delta = await _push_csv_backlog_if_needed(
        {"INSTANTLY_BACKLOG_PUSH_MIN": 5, "INSTANTLY_PUSH_EVERY": 100},
        workspace_emails=set(),
        csv_path=str(csv_path),
        state_path=str(tmp_path / "state.json"),
        log_cb=logs.append,
        instantly_pushed=0,
        run_state=None,
    )
    assert pushed == 0
    assert delta == 0
    assert any("Backlog push skip" in line for line in logs)


@pytest.mark.asyncio
async def test_backlog_push_uploads_missing_rows(tmp_path: Path) -> None:
    csv_path = tmp_path / "leads.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["Email", "Company", "Website", "Service", "City"],
        )
        writer.writeheader()
        for idx in range(3):
            writer.writerow(
                {
                    "Email": f"lead{idx}@example.com",
                    "Company": f"Co {idx}",
                    "Website": f"https://example{idx}.com",
                    "Service": "svc",
                    "City": "Paris",
                }
            )

    flush_mock = AsyncMock(return_value={"pushed": 3, "skipped_duplicate": 0})

    with patch("core_logic._flush_instantly_buffer", flush_mock):
        pushed, delta = await _push_csv_backlog_if_needed(
            {
                "INSTANTLY_BACKLOG_PUSH_MIN": 2,
                "INSTANTLY_PUSH_EVERY": 100,
                "INSTANTLY_API_KEY": "key",
                "INSTANTLY_LIST_ID": "list",
            },
            workspace_emails={"already@example.com"},
            csv_path=str(csv_path),
            state_path=str(tmp_path / "state.json"),
            log_cb=lambda _msg: None,
            instantly_pushed=10,
            run_state={"instantly_pushed": 10},
        )

    assert pushed == 13
    assert delta == 3
    flush_mock.assert_awaited_once()
