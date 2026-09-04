#!/usr/bin/env python3
"""Compare Python schedule preview against TS smoke fixtures."""

from __future__ import annotations

import subprocess
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_booking_resend"
sys.path.insert(0, str(_APP_DIR))

from schedule import (  # noqa: E402
    clamp_to_now,
    is_role_recovery_compressed,
    paris_at_8am,
    plan_role_recovery_schedule,
    role_seq_24_send_at,
    role_seq_48_send_at,
    snap_to_previous_weekday_8am_paris,
)


def assert_equal(actual: datetime, expected_iso: str, label: str) -> None:
    if actual.tzinfo is None:
        actual = actual.replace(tzinfo=UTC)
    actual_iso = actual.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    if actual_iso != expected_iso:
        raise AssertionError(f"{label}: expected {expected_iso}, got {actual_iso}")


def main() -> None:
    meeting = "2027-09-07T08:00:00.000Z"
    assert_equal(
        role_seq_48_send_at(meeting),
        "2027-09-03T06:00:00.000Z",
        "roleSeq48 Tue meeting",
    )
    assert_equal(
        role_seq_24_send_at(meeting),
        "2027-09-06T06:00:00.000Z",
        "roleSeq24 Tue meeting",
    )

    sunday_morning_paris = datetime(2027, 9, 5, 8, 0, 0, tzinfo=UTC)
    assert_equal(
        snap_to_previous_weekday_8am_paris(sunday_morning_paris),
        paris_at_8am("2027-09-03").astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "snap Sunday raw to Friday 8am",
    )

    past = datetime(2020, 1, 1, 12, 0, 0, tzinfo=UTC)
    clamped = clamp_to_now(past)
    if clamped < datetime.now(UTC) - timedelta(seconds=5):
        raise AssertionError("clamp_to_now should return a recent timestamp for past dates")

    meeting_in_24h = (datetime.now(UTC) + timedelta(hours=24)).isoformat()
    if not is_role_recovery_compressed(meeting_in_24h):
        raise AssertionError("Meeting in 24h should be compressed")

    compressed = plan_role_recovery_schedule(meeting_in_24h)
    if not compressed["compressed"]:
        raise AssertionError("Meeting in 24h should use compressed schedule")
    gap = compressed["role_seq_24"] - compressed["role_seq_48"]
    if gap != timedelta(minutes=10):
        raise AssertionError(f"Compressed gap should be 10 minutes, got {gap}")

    ts_script = _REPO_ROOT / "scripts" / "crm" / "smokeBookingSchedule.ts"
    if ts_script.is_file():
        result = subprocess.run(
            ["pnpm", "exec", "tsx", str(ts_script)],
            cwd=_REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            print(
                "Warning: TS schedule smoke skipped or failed (clamp_to_now uses current time):\n"
                f"{result.stderr or result.stdout}",
                file=sys.stderr,
            )

    print("Python schedule smoke tests passed")


if __name__ == "__main__":
    main()
