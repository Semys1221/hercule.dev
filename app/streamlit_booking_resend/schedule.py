"""Port of lib/booking-communication/schedule.ts for UI preview."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TypedDict
from zoneinfo import ZoneInfo

PARIS_TZ = ZoneInfo("Europe/Paris")
ROLE_RECOVERY_COMPRESSED_GAP = timedelta(minutes=10)


class RoleRecoverySchedule(TypedDict):
    role_seq_48: datetime
    role_seq_24: datetime
    compressed: bool


class MainSchedule(TypedDict):
    immediate: datetime
    h48_confirm: datetime | None
    h24_relance: datetime | None
    h20_cancel: datetime | None


def _parse_iso(iso: str) -> datetime:
    normalized = iso.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def hours_before(iso: str, hours: int) -> datetime:
    start = _parse_iso(iso)
    return start - timedelta(hours=hours)


def clamp_to_now(date: datetime) -> datetime:
    now = datetime.now(UTC)
    if date.tzinfo is None:
        date = date.replace(tzinfo=UTC)
    return now if date < now else date


def h48_send_at(scheduled_at_iso: str) -> datetime:
    return clamp_to_now(hours_before(scheduled_at_iso, 48))


def h24_send_at(scheduled_at_iso: str) -> datetime:
    return clamp_to_now(hours_before(scheduled_at_iso, 24))


def h20_send_at(scheduled_at_iso: str) -> datetime:
    return clamp_to_now(hours_before(scheduled_at_iso, 20))


def _paris_date_key(instant: datetime) -> str:
    paris = instant.astimezone(PARIS_TZ)
    return f"{paris.year:04d}-{paris.month:02d}-{paris.day:02d}"


def _paris_weekday(instant: datetime) -> str:
    return instant.astimezone(PARIS_TZ).strftime("%a")


def _is_weekend_weekday(weekday: str) -> bool:
    return weekday in {"Sat", "Sun"}


def _add_paris_calendar_days(date_key: str, delta_days: int) -> str:
    year, month, day = map(int, date_key.split("-"))
    utc = datetime(year, month, day, 12, 0, 0, tzinfo=UTC) + timedelta(days=delta_days)
    return _paris_date_key(utc)


def paris_at_8am(date_key: str) -> datetime:
    year, month, day = map(int, date_key.split("-"))
    return datetime(year, month, day, 8, 0, 0, tzinfo=PARIS_TZ)


def snap_to_previous_weekday_8am_paris(raw: datetime) -> datetime:
    if raw.tzinfo is None:
        raw = raw.replace(tzinfo=UTC)
    date_key = _paris_date_key(raw)
    candidate = paris_at_8am(date_key)

    while candidate > raw.astimezone(PARIS_TZ):
        date_key = _add_paris_calendar_days(date_key, -1)
        candidate = paris_at_8am(date_key)

    weekday = _paris_weekday(candidate)
    while _is_weekend_weekday(weekday):
        date_key = _add_paris_calendar_days(date_key, -1)
        candidate = paris_at_8am(date_key)
        weekday = _paris_weekday(candidate)

    return candidate


def role_seq_48_send_at(scheduled_at_iso: str) -> datetime:
    raw = hours_before(scheduled_at_iso, 48)
    return clamp_to_now(snap_to_previous_weekday_8am_paris(raw))


def role_seq_24_send_at(scheduled_at_iso: str) -> datetime:
    raw = hours_before(scheduled_at_iso, 24)
    return clamp_to_now(snap_to_previous_weekday_8am_paris(raw))


def is_role_recovery_compressed(scheduled_at_iso: str) -> bool:
    return hours_before(scheduled_at_iso, 48) <= datetime.now(UTC)


def plan_role_recovery_schedule(scheduled_at_iso: str) -> RoleRecoverySchedule:
    if is_role_recovery_compressed(scheduled_at_iso):
        role_seq_48 = clamp_to_now(datetime.now(UTC))
        role_seq_24 = role_seq_48 + ROLE_RECOVERY_COMPRESSED_GAP
        return {
            "role_seq_48": role_seq_48,
            "role_seq_24": role_seq_24,
            "compressed": True,
        }

    return {
        "role_seq_48": role_seq_48_send_at(scheduled_at_iso),
        "role_seq_24": role_seq_24_send_at(scheduled_at_iso),
        "compressed": False,
    }


def plan_main_schedule(
    scheduled_at_iso: str,
    *,
    category: str = "agence",
    sequence_starts_at: datetime | None = None,
) -> MainSchedule:
    immediate = clamp_to_now(sequence_starts_at or datetime.now(UTC))
    if category != "agence":
        return {
            "immediate": immediate,
            "h48_confirm": None,
            "h24_relance": None,
            "h20_cancel": None,
        }
    return {
        "immediate": immediate,
        "h48_confirm": h48_send_at(scheduled_at_iso),
        "h24_relance": h24_send_at(scheduled_at_iso),
        "h20_cancel": h20_send_at(scheduled_at_iso),
    }


def format_paris(dt: datetime | None) -> str:
    if dt is None:
        return "—"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(PARIS_TZ).strftime("%Y-%m-%d %H:%M")
