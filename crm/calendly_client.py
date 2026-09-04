"""Calendly API client for role recovery bookings."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from config import _env
from supabase_repo import find_by_email, get_client, normalize_email

CALENDLY_API = "https://api.calendly.com"


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


def _is_tracked_lead(email: str) -> bool:
    lookup = find_by_email(get_client(), email)
    if not lookup:
        return False
    statut = str(lookup[1].get("statut") or "")
    return statut in {"MEETING_BOOKED", "CONFIRMED", "BOOKED"}


def list_untracked_bookings(*, days_ahead: int = 30) -> list[dict[str, Any]]:
    user_uri = get_current_user_uri()
    now = datetime.now(UTC)
    max_time = now + timedelta(days=days_ahead)

    events = _paginate(
        "/scheduled_events",
        params={
            "user": user_uri,
            "status": "active",
            "min_start_time": now.isoformat().replace("+00:00", "Z"),
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
            tracking = invitee.get("tracking") or {}
            utm_content = str(tracking.get("utm_content") or "").strip()
            if utm_content and _is_tracked_lead(email):
                continue
            if not utm_content and _is_tracked_lead(email):
                continue

            questions = invitee.get("questions_and_answers") or []
            if not isinstance(questions, list):
                questions = []
            lookup = find_by_email(get_client(), email)
            lead = lookup[1] if lookup else None
            rows.append(
                {
                    "email": email,
                    "name": str(invitee.get("name") or "").strip(),
                    "first_name": _first_name(str(invitee.get("name") or "")),
                    "company": _company_from_questions(questions),
                    "start_time": event_start,
                    "invitee_uri": str(invitee.get("uri") or ""),
                    "event_uri": event_uri,
                    "utm_content": utm_content,
                    "questions": {
                        str(item.get("question") or ""): str(item.get("answer") or "")
                        for item in questions
                        if isinstance(item, dict)
                    },
                    "lead_id": lead.get("id") if lead else None,
                    "lead_category": lookup[0] if lookup else None,
                    "lead_link": lead.get("slug") if lead else None,
                    "lead_statut": lead.get("statut") if lead else None,
                    "provisioned": bool(lead and lead.get("slug")),
                }
            )
    rows.sort(key=lambda row: str(row.get("start_time") or ""))
    return rows
