"""Calendly Contacts API client (read/create/patch)."""

from __future__ import annotations

import time
from typing import Any

import httpx

from calendly_client import require_calendly_token

CALENDLY_API = "https://api.calendly.com"
MAX_RETRIES = 5


class CalendlyContactsError(RuntimeError):
    """Expected Calendly Contacts API failure."""


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {require_calendly_token()}"}


def _contact_uuid(uri: str) -> str:
    trimmed = uri.strip().rstrip("/")
    return trimmed.split("/")[-1]


def _request(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
    attempt: int = 0,
) -> dict[str, Any]:
    with httpx.Client(timeout=30.0) as client:
        response = client.request(
            method,
            f"{CALENDLY_API}{path}",
            headers=_headers(),
            params=params,
            json=json_body,
        )

    if response.status_code == 429 and attempt < MAX_RETRIES:
        retry_after = response.headers.get("Retry-After", "2")
        try:
            wait_s = max(int(retry_after), 1)
        except ValueError:
            wait_s = 2
        time.sleep(wait_s)
        return _request(
            method,
            path,
            params=params,
            json_body=json_body,
            attempt=attempt + 1,
        )

    if response.status_code == 403:
        raise CalendlyContactsError(
            "Calendly token missing contacts:read/contacts:write scopes. "
            "Regenerate CALENDLY_API_TOKEN with Contacts permissions."
        )

    if not response.is_success:
        body = response.text
        raise CalendlyContactsError(
            f"Calendly Contacts {method} {path} HTTP {response.status_code}: {body}"
        )

    data = response.json()
    return data if isinstance(data, dict) else {}


def preflight_contacts_scope() -> None:
    """Verify the token can list contacts."""
    _request("GET", "/contacts", params={"count": 1})


def get_contact_by_email(email: str) -> dict[str, Any] | None:
    normalized = email.strip().lower()
    if not normalized:
        return None

    payload = _request("GET", "/contacts", params={"email": normalized, "count": 5})
    for item in payload.get("collection") or []:
        if not isinstance(item, dict):
            continue
        emails = item.get("emails") or []
        for entry in emails:
            if not isinstance(entry, dict):
                continue
            if str(entry.get("email") or "").strip().lower() == normalized:
                return item
    return None


def create_contact(name: str, email: str) -> dict[str, Any]:
    normalized = email.strip().lower()
    body = {
        "name": name.strip() or normalized,
        "emails": [{"email": normalized, "is_primary": True}],
    }
    payload = _request("POST", "/contacts", json_body=body)
    resource = payload.get("resource")
    if not isinstance(resource, dict):
        raise CalendlyContactsError("Calendly POST /contacts returned no resource")
    return resource


def patch_contact_company(contact_uri: str, company: str) -> dict[str, Any]:
    uuid = _contact_uuid(contact_uri)
    payload = _request(
        "PATCH",
        f"/contacts/{uuid}",
        json_body={"company": company.strip()},
    )
    resource = payload.get("resource")
    if not isinstance(resource, dict):
        raise CalendlyContactsError(f"Calendly PATCH /contacts/{uuid} returned no resource")
    return resource


def contact_company(contact: dict[str, Any]) -> str:
    return str(contact.get("company") or "").strip()
