"""Bootstrap Calendly bookings that missed link-tracking (no utm_content)."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Literal
from zoneinfo import ZoneInfo

from calendly_client import list_all_bookings
from supabase_repo import (
    LeadCategory,
    find_by_email,
    generate_unique_slug,
    get_client,
    insert_lead,
    provision_or_update_role_recovery_lead,
    update_lead,
    _url_fields,
    normalize_email,
)
from supabase import Client

PARIS_TZ = ZoneInfo("Europe/Paris")
SequenceKind = Literal["main", "recovery", "none"]

_REPO_ROOT = Path(__file__).resolve().parents[1]
_SCHEDULE_DIR = _REPO_ROOT / "app" / "streamlit_booking_resend"
if str(_SCHEDULE_DIR) not in sys.path:
    sys.path.insert(0, str(_SCHEDULE_DIR))

from schedule import (  # noqa: E402
    format_paris,
    hours_before,
    is_role_recovery_compressed,
    meeting_weekday_paris,
    plan_main_schedule,
    plan_recovery_by_meeting_weekday,
    plan_role_recovery_schedule,
)


class BootstrapError(Exception):
    """Expected bootstrap failure (guards, missing data)."""


@dataclass
class BootstrapResult:
    ok: bool
    dry_run: bool
    email: str = ""
    company: str = ""
    lead_id: str = ""
    slug: str = ""
    scheduled_at: str = ""
    sequence: SequenceKind = "none"
    tracked: bool = False
    scheduled_preview: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    sequence_result: dict[str, Any] = field(default_factory=dict)
    reason: str = ""


def _fuzzy_match(haystack: str, needle: str) -> bool:
    return needle.strip().lower() in haystack.strip().lower()


def find_calendly_booking(
    *,
    email: str | None = None,
    match: str | None = None,
    invitee_uri: str | None = None,
) -> dict[str, Any]:
    """Find a single Calendly booking by email, fuzzy match, or invitee URI."""
    if not email and not match and not invitee_uri:
        raise BootstrapError("Provide --email, --match, or --invitee-uri")

    bookings = list_all_bookings()
    candidates: list[dict[str, Any]] = []

    normalized_email = normalize_email(email) if email else ""
    normalized_uri = (invitee_uri or "").strip()
    match_text = (match or "").strip()

    for row in bookings:
        if normalized_email and normalize_email(str(row.get("email") or "")) == normalized_email:
            candidates.append(row)
            continue
        if normalized_uri and str(row.get("invitee_uri") or "").strip() == normalized_uri:
            candidates.append(row)
            continue
        if match_text:
            fields = [
                str(row.get("email") or ""),
                str(row.get("name") or ""),
                str(row.get("company") or ""),
            ]
            if any(_fuzzy_match(value, match_text) for value in fields):
                candidates.append(row)

    if not candidates:
        raise BootstrapError("No Calendly booking matched the criteria")
    if len(candidates) > 1:
        lines = [
            f"  - {row.get('email')} | {row.get('name')} | {row.get('company')} | {row.get('start_time')}"
            for row in candidates
        ]
        raise BootstrapError(
            "Multiple Calendly bookings matched; narrow with --email or --invitee-uri:\n"
            + "\n".join(lines)
        )
    return candidates[0]


def sequence_kind_for_meeting(
    scheduled_at: str | None,
    category: LeadCategory,
) -> SequenceKind:
    if not scheduled_at or not scheduled_at.strip():
        return "none"
    if category != "agence":
        return "main"
    weekday = meeting_weekday_paris(scheduled_at)
    if weekday in ("Mon", "Tue", "Wed"):
        return "recovery"
    return "main"


def has_any_sequence_started(client: Client, lead_id: str) -> bool:
    response = (
        client.table("booking_email_jobs")
        .select("id")
        .eq("lead_id", lead_id)
        .limit(1)
        .execute()
    )
    return bool(response.data)


def _build_schedule_preview(
    scheduled_at: str,
    *,
    category: LeadCategory,
    sequence: SequenceKind,
) -> dict[str, str]:
    if sequence == "main":
        plan = plan_main_schedule(scheduled_at, category=category)
        preview = {
            "immediate": format_paris(plan["immediate"]),
            "h48_confirm": format_paris(plan["h48_confirm"]),
            "h24_relance": format_paris(plan["h24_relance"]),
        }
        if category == "agence":
            preview["h20_cancel"] = format_paris(plan["h20_cancel"])
        return preview

    if sequence == "recovery":
        try:
            weekday_plan = plan_recovery_by_meeting_weekday(scheduled_at)
            return {
                "role_seq_48": format_paris(weekday_plan["role_seq_48"]),
                "role_seq_24": format_paris(weekday_plan["role_seq_24"]),
                "variant": weekday_plan["variant"],
            }
        except ValueError:
            compressed = plan_role_recovery_schedule(scheduled_at)
            return {
                "role_seq_48": format_paris(compressed["role_seq_48"]),
                "role_seq_24": format_paris(compressed["role_seq_24"]),
                "compressed": "yes" if compressed["compressed"] else "no",
            }

    return {}


def _schedule_warnings(scheduled_at: str) -> list[str]:
    warnings: list[str] = []
    if is_role_recovery_compressed(scheduled_at):
        warnings.append("Meeting is within 48h — some send times are clamped to now")
    h48 = hours_before(scheduled_at, 48)
    if h48 <= datetime.now(UTC):
        warnings.append("H-48 window already passed — h48_confirm will send immediately")
    return warnings


def upsert_booked_lead(
    client: Client,
    booking: dict[str, Any],
    *,
    category: LeadCategory = "agence",
) -> dict[str, Any]:
    """Create or update a MEETING_BOOKED lead from a Calendly booking row."""
    email = normalize_email(str(booking.get("email") or ""))
    if not email:
        raise BootstrapError("Calendly booking has no email")

    scheduled_at = str(booking.get("start_time") or "").strip()
    if not scheduled_at:
        raise BootstrapError("Calendly booking has no start_time")

    booked_at = datetime.now(UTC).isoformat()
    payload = {
        "invitee_uri": booking.get("invitee_uri"),
        "event_uri": booking.get("event_uri"),
    }
    questions = booking.get("questions") or {}
    existing_slug = str(booking.get("lead_link") or "").strip() or None
    if not existing_slug:
        existing_lookup = find_by_email(client, email)
        if existing_lookup:
            existing_slug = str(existing_lookup[1].get("slug") or "").strip() or None

    if category == "agence":
        return provision_or_update_role_recovery_lead(
            client,
            email=email,
            first_name=booking.get("first_name"),
            company=booking.get("company"),
            scheduled_at=scheduled_at,
            calendly_invitee_uri=booking.get("invitee_uri"),
            calendly_payload=payload,
            calendly_questions=questions,
            booked_at=booked_at,
            slug=existing_slug,
        )

    existing = find_by_email(client, email)
    resolved_slug = (
        str(booking.get("lead_link") or "").strip()
        or (existing[1].get("slug") if existing else "")
        or generate_unique_slug(client)
    )
    patch: dict[str, Any] = {
        "statut": "MEETING_BOOKED",
        "first_name": booking.get("first_name"),
        "company": booking.get("company"),
        "scheduled_at": scheduled_at,
        "booked_at": booked_at,
        "calendly_invitee_uri": booking.get("invitee_uri"),
        "calendly_payload": payload,
        "calendly_questions": questions,
        "slug": resolved_slug,
        **_url_fields(resolved_slug, email),
    }

    if existing:
        existing_category, lead = existing
        if existing_category != category:
            raise BootstrapError(
                f"Existing lead is in {existing_category}, expected {category}"
            )
        return update_lead(client, category=category, lead_id=lead["id"], patch=patch)

    return insert_lead(
        client,
        category=category,
        email=email,
        slug=resolved_slug,
        first_name=booking.get("first_name"),
        company=booking.get("company"),
        statut="MEETING_BOOKED",
        calendly_questions=questions,
        scheduled_at=scheduled_at,
        calendly_invitee_uri=booking.get("invitee_uri"),
        calendly_payload=payload,
        booked_at=booked_at,
    )


def bootstrap_untracked_booking(
    *,
    email: str | None = None,
    match: str | None = None,
    invitee_uri: str | None = None,
    category: LeadCategory = "agence",
    dry_run: bool = True,
    force: bool = False,
) -> BootstrapResult:
    """Find an untracked Calendly booking and provision + preview (or execute via CLI)."""
    booking = find_calendly_booking(email=email, match=match, invitee_uri=invitee_uri)

    if booking.get("tracked"):
        raise BootstrapError(
            "Booking is already tracked (utm_content + lead). "
            "The Calendly webhook should have started the sequence."
        )

    scheduled_at = str(booking.get("start_time") or "").strip()
    if not scheduled_at:
        raise BootstrapError("Calendly booking has no scheduled_at")

    sequence = sequence_kind_for_meeting(scheduled_at, category)
    if sequence == "none":
        raise BootstrapError("Could not determine sequence kind (missing scheduled_at)")

    client = get_client()
    lead_id = str(booking.get("lead_id") or "").strip()
    if lead_id and has_any_sequence_started(client, lead_id) and not force:
        raise BootstrapError(
            f"Sequence already started for lead {lead_id}. Re-run with --force to continue."
        )

    warnings = _schedule_warnings(scheduled_at)
    preview = _build_schedule_preview(scheduled_at, category=category, sequence=sequence)

    result = BootstrapResult(
        ok=True,
        dry_run=dry_run,
        email=str(booking.get("email") or ""),
        company=str(booking.get("company") or ""),
        scheduled_at=scheduled_at,
        sequence=sequence,
        tracked=bool(booking.get("tracked")),
        scheduled_preview=preview,
        warnings=warnings,
    )

    if dry_run:
        existing = find_by_email(client, result.email)
        if existing:
            result.lead_id = str(existing[1].get("id") or "")
            result.slug = str(existing[1].get("slug") or "")
        result.reason = "dry_run"
        return result

    lead = upsert_booked_lead(client, booking, category=category)
    result.lead_id = str(lead.get("id") or "")
    result.slug = str(lead.get("slug") or "")
    result.reason = "upserted"
    return result
