"""Paris weekday send window preview for booking resend UI."""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

_PARIS = ZoneInfo("Europe/Paris")
_START_HOUR = 8
_END_HOUR = 17


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def is_within_send_window(dt: datetime | None = None) -> bool:
    paris = _ensure_utc(dt or datetime.now(timezone.utc)).astimezone(_PARIS)
    if paris.weekday() >= 5:
        return False
    start = time(_START_HOUR, 0)
    end = time(_END_HOUR, 0)
    return start <= paris.time() < end


def _paris_at_hour(paris_date: datetime, hour: int) -> datetime:
    local = datetime(
        paris_date.year,
        paris_date.month,
        paris_date.day,
        hour,
        0,
        0,
        tzinfo=_PARIS,
    )
    return local.astimezone(timezone.utc)


def next_send_slot(dt: datetime | None = None) -> datetime:
    paris = _ensure_utc(dt or datetime.now(timezone.utc)).astimezone(_PARIS)

    if paris.weekday() < 5 and paris.time() < time(_START_HOUR, 0):
        return _paris_at_hour(paris, _START_HOUR)

    if is_within_send_window(paris.astimezone(timezone.utc)):
        return _ensure_utc(dt or datetime.now(timezone.utc))

    candidate = paris
    if paris.weekday() < 5 and paris.time() >= time(_END_HOUR, 0):
        candidate = paris + timedelta(days=1)
    elif paris.weekday() >= 5:
        candidate = paris + timedelta(days=2 if paris.weekday() == 5 else 1)

    while candidate.weekday() >= 5:
        candidate = candidate + timedelta(days=1)

    return _paris_at_hour(candidate, _START_HOUR)


def apply_send_window_preview(
    email_type: str,
    scheduled: datetime | None,
) -> datetime | None:
    if scheduled is None or email_type == "immediate":
        return scheduled
    if is_within_send_window(scheduled):
        return scheduled
    return next_send_slot(scheduled)
