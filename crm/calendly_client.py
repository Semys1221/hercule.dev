"""Calendly API client for booking listings and role recovery."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import httpx

from config import _env
from supabase_repo import (
    find_by_calendly_invitee_uri,
    find_by_email,
    find_by_slug,
    get_client,
    normalize_email,
)

CALENDLY_API = "https://api.calendly.com"

BookingCategory = Literal["agence", "entreprise"]

SequenceType = Literal["main", "role_recovery"]
SequenceStatus = Literal["none", "started", "confirmed", "cancelled"]


def require_calendly_token() -> str:
    token = _env("CALENDLY_API_TOKEN")
    if not token:
        raise RuntimeError("Set CALENDLY_API_TOKEN in crm/.env")
    return token


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {require_calendly_token()}"}


def _get_json(path: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            f"{CALENDLY_API}{path}",
            headers=_headers(),
            params=params,
        )
        response.raise_for_status()
        return response.json()


def _paginate(path: str, *, params: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    next_token = ""
    while True:
        query = dict(params)
        if next_token:
            query["page_token"] = next_token
        payload = _get_json(path, params=query)
        items.extend(payload.get("collection") or [])
        next_token = str(payload.get("pagination", {}).get("next_page_token") or "")
        if not next_token:
            break
    return items


def get_current_user_uri() -> str:
    payload = _get_json("/users/me")
    uri = str((payload.get("resource") or {}).get("uri") or "").strip()
    if not uri:
        raise RuntimeError("Calendly /users/me returned no user uri")
    return uri


def _company_from_questions(questions: list[dict[str, Any]]) -> str | None:
    keys = ("entreprise", "société", "societe", "company", "agence", "cabinet")
    for item in questions:
        question = str(item.get("question") or "").lower()
        answer = str(item.get("answer") or "").strip()
        if answer and any(key in question for key in keys):
            return answer
    return None


def _first_name(full_name: str) -> str | None:
    trimmed = full_name.strip()
    if not trimmed:
        return None
    return trimmed.split()[0]


def _is_booked_statut(statut: str | None) -> bool:
    return statut in {"MEETING_BOOKED", "CONFIRMED", "BOOKED"}


def _detect_tracked(*, utm_content: str, lead: dict[str, Any] | None) -> bool:
    return bool(utm_content) and lead is not None


def _detect_sequence_type(
    *,
    utm_content: str,
    lead: dict[str, Any] | None,
) -> SequenceType:
    slug = str(lead.get("slug") or "").strip() if lead else ""
    statut = str(lead.get("statut") or "") if lead else ""
    if utm_content and slug:
        return "main"
    if _is_booked_statut(statut) and slug:
        return "main"
    return "role_recovery"


def _detect_sequence_status(lead: dict[str, Any] | None) -> SequenceStatus:
    if not lead:
        return "none"
    statut = str(lead.get("statut") or "")
    if statut == "CANCELLED":
        return "cancelled"
    if statut == "CONFIRMED":
        return "confirmed"
    return "none"


def _resolve_booking_category(
    *,
    utm_content: str,
    lookup: tuple[BookingCategory, dict[str, Any]] | None,
) -> BookingCategory:
    if lookup:
        return lookup[0]
    if utm_content:
        slug_lookup = find_by_slug(get_client(), utm_content)
        if slug_lookup:
            return slug_lookup[0]
    return "agence"


def _resolve_lead_lookup(
    *,
    invitee_email: str,
    utm_content: str,
    invitee_uri: str,
) -> tuple[BookingCategory, dict[str, Any]] | None:
    client = get_client()
    lookup = find_by_email(client, invitee_email)
    if lookup:
        return lookup
    if utm_content:
        lookup = find_by_slug(client, utm_content)
        if lookup:
            return lookup
    if invitee_uri:
        lookup = find_by_calendly_invitee_uri(client, invitee_uri)
        if lookup:
            return lookup
    return None


def _build_booking_row(
    *,
    invitee: dict[str, Any],
    event_uri: str,
    event_start: str,
) -> dict[str, Any]:
    email = normalize_email(str(invitee.get("email") or ""))
    invitee_uri = str(invitee.get("uri") or "").strip()
    tracking = invitee.get("tracking") or {}
    utm_content = str(tracking.get("utm_content") or "").strip()
    questions = invitee.get("questions_and_answers") or []
    if not isinstance(questions, list):
        questions = []
    lookup = _resolve_lead_lookup(
        invitee_email=email,
        utm_content=utm_content,
        invitee_uri=invitee_uri,
    )
    lead = lookup[1] if lookup else None
    lead_email = normalize_email(str(lead.get("email") or "")) if lead else ""
    booking_category = _resolve_booking_category(utm_content=utm_content, lookup=lookup)
    tracked = _detect_tracked(utm_content=utm_content, lead=lead)
    sequence_type = _detect_sequence_type(utm_content=utm_content, lead=lead)
    sequence_status = _detect_sequence_status(lead)

    return {
        "email": email,
        "lead_email": lead_email if lead_email and lead_email != email else "",
        "name": str(invitee.get("name") or "").strip(),
        "first_name": _first_name(str(invitee.get("name") or "")),
        "company": _company_from_questions(questions),
        "start_time": event_start,
        "invitee_uri": invitee_uri,
        "event_uri": event_uri,
        "utm_content": utm_content,
        "questions": {
            str(item.get("question") or ""): str(item.get("answer") or "")
            for item in questions
            if isinstance(item, dict)
        },
        "lead_id": lead.get("id") if lead else None,
        "lead_category": lookup[0] if lookup else None,
        "booking_category": booking_category,
        "lead_link": lead.get("slug") if lead else None,
        "lead_statut": lead.get("statut") if lead else None,
        "booked_at": lead.get("booked_at") if lead else None,
        "scheduled_at": lead.get("scheduled_at") if lead else None,
        "calendly_join_url": lead.get("calendly_join_url") if lead else None,
        "calendly_reschedule_url": lead.get("calendly_reschedule_url") if lead else None,
        "calendly_cancel_url": lead.get("calendly_cancel_url") if lead else None,
        "calendly_links_synced_at": lead.get("calendly_links_synced_at") if lead else None,
        "provisioned": bool(lead and lead.get("slug")),
        "tracked": tracked,
        "sequence_type": sequence_type,
        "sequence_status": sequence_status,
    }


def list_all_bookings(*, days_back: int = 30, days_ahead: int = 30) -> list[dict[str, Any]]:
    """All active Calendly invitees in the window, with tracking metadata."""
    user_uri = get_current_user_uri()
    now = datetime.now(UTC)
    min_time = now - timedelta(days=days_back)
    max_time = now + timedelta(days=days_ahead)

    events = _paginate(
        "/scheduled_events",
        params={
            "user": user_uri,
            "status": "active",
            "min_start_time": min_time.isoformat().replace("+00:00", "Z"),
            "max_start_time": max_time.isoformat().replace("+00:00", "Z"),
            "count": 100,
        },
    )

    rows: list[dict[str, Any]] = []
    for event in events:
        event_uri = str(event.get("uri") or "")
        event_uuid = event_uri.rstrip("/").split("/")[-1]
        event_start = str(event.get("start_time") or "")
        invitees = _paginate(
            f"/scheduled_events/{event_uuid}/invitees",
            params={"count": 100},
        )
        for invitee in invitees:
            email = normalize_email(str(invitee.get("email") or ""))
            if not email:
                continue
            rows.append(
                _build_booking_row(
                    invitee=invitee,
                    event_uri=event_uri,
                    event_start=event_start,
                )
            )
    rows.sort(key=lambda row: str(row.get("start_time") or ""))
    return rows


def list_untracked_bookings(*, days_ahead: int = 30) -> list[dict[str, Any]]:
    """Bookings not yet booked in Supabase — legacy filter for CRM Sequence tab."""
    rows: list[dict[str, Any]] = []
    for row in list_all_bookings(days_ahead=days_ahead):
        statut = str(row.get("lead_statut") or "")
        if statut in {"MEETING_BOOKED", "CONFIRMED", "BOOKED"}:
            continue
        rows.append(row)
    return rows
