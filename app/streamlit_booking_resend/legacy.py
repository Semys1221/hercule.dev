"""Legacy vs auto split for agence bookings (pre BOOKING_GO_LIVE_AT)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from config import booking_go_live_at as booking_go_live_raw

RELANCE_STANDARD = "h48_confirm"
RELANCE_TEMPORARY = "role_seq_24"
INTRO_EMAIL_TYPE = "role_seq_48"

RELANCE_OPTIONS: dict[str, str] = {
    RELANCE_STANDARD: "Lien confirmation standard (confirm-reservation.html)",
    RELANCE_TEMPORARY: "Lien page temporaire (temporary-reservation.html)",
}


def parse_iso_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        normalized = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=UTC)
        return dt
    except ValueError:
        return None


def go_live_at() -> datetime:
    raw = booking_go_live_raw()
    parsed = parse_iso_dt(raw)
    if parsed is None:
        parsed = parse_iso_dt("2026-09-03T14:00:00.000Z")
    assert parsed is not None
    return parsed


def is_legacy_agence_row(row: dict[str, Any]) -> bool:
    category = str(row.get("booking_category") or row.get("lead_category") or "agence")
    if category != "agence":
        return False
    booked = parse_iso_dt(str(row.get("booked_at") or "") or None)
    if booked is None:
        return bool(row.get("lead_id"))
    return booked < go_live_at()


def email_type_for_legacy_slot(
    slot: Literal["intro", "relance"],
    relance_variant: str = RELANCE_STANDARD,
) -> str:
    if slot == "intro":
        return INTRO_EMAIL_TYPE
    if relance_variant == RELANCE_TEMPORARY:
        return RELANCE_TEMPORARY
    return RELANCE_STANDARD
