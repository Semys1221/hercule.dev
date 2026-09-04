"""HTTP helpers for Streamlit → Next.js CRM backend."""

from __future__ import annotations

from typing import Any

import requests

from config import crm_backend_headers, settings


def _format_http_error(path: str, response: requests.Response, data: dict[str, Any]) -> str:
    if response.status_code == 404 and "<!DOCTYPE html" in (data.get("error") or ""):
        backend = settings.crm_backend_url.rstrip("/")
        return (
            f"{path} introuvable sur {backend}. "
            "Lancez `pnpm dev` et vérifiez `CRM_BACKEND_URL=http://localhost:3000`."
        )
    return f"{path} HTTP {response.status_code}: {data.get('error') or data}"


def _parse_response(path: str, response: requests.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError:
        data = {"error": response.text}
    if not response.ok:
        raise RuntimeError(_format_http_error(path, response, data))
    if not isinstance(data, dict):
        return {"ok": True}
    return data


def get_json(path: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{settings.crm_backend_url.rstrip('/')}{path}"
    response = requests.get(
        url,
        headers=crm_backend_headers(),
        params=params,
        timeout=30,
    )
    return _parse_response(path, response)


def post_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{settings.crm_backend_url.rstrip('/')}{path}"
    response = requests.post(
        url,
        headers=crm_backend_headers(),
        json=payload,
        timeout=30,
    )
    return _parse_response(path, response)


def put_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{settings.crm_backend_url.rstrip('/')}{path}"
    response = requests.put(
        url,
        headers=crm_backend_headers(),
        json=payload,
        timeout=30,
    )
    return _parse_response(path, response)


def start_booking_sequence(
    *,
    lead_id: str,
    category: str,
    mode: str = "now",
    scheduled_at: str | None = None,
    email_types: list[str] | None = None,
    html_by_type: dict[str, bool] | None = None,
    partial: bool = False,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "lead_id": lead_id,
        "category": category,
        "mode": mode,
        "partial": partial,
    }
    if scheduled_at:
        payload["scheduled_at"] = scheduled_at
    if email_types:
        payload["email_types"] = email_types
    if html_by_type:
        payload["html_by_type"] = html_by_type
    return post_json("/api/booking-communication/trigger", payload)


def start_role_recovery_sequence(
    *,
    lead_id: str | None = None,
    category: str = "agence",
    email: str | None = None,
    email_types: list[str] | None = None,
    html_by_type: dict[str, bool] | None = None,
    partial: bool = False,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "category": category,
        "partial": partial,
    }
    if lead_id:
        payload["lead_id"] = lead_id
    if email:
        payload["email"] = email
    if email_types:
        payload["email_types"] = email_types
    if html_by_type:
        payload["html_by_type"] = html_by_type
    return post_json("/api/booking-communication/role-sequence/start", payload)


def render_booking_email(
    *,
    category: str,
    email_type: str | None = None,
    subject: str | None = None,
    body: str | None = None,
    lead_id: str | None = None,
    use_html: bool | None = None,
    sample: bool = False,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "category": category,
        "sample": sample,
    }
    if email_type:
        payload["email_type"] = email_type
    if subject is not None:
        payload["subject"] = subject
    if body is not None:
        payload["body"] = body
    if lead_id:
        payload["lead_id"] = lead_id
    if use_html is not None:
        payload["use_html"] = use_html
    return post_json("/api/booking-communication/render", payload)


def send_booking_email_once(
    *,
    lead_id: str,
    category: str,
    email_type: str,
    subject: str | None = None,
    body: str | None = None,
    use_html: bool | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "lead_id": lead_id,
        "category": category,
        "email_type": email_type,
    }
    if subject is not None:
        payload["subject"] = subject
    if body is not None:
        payload["body"] = body
    if use_html is not None:
        payload["use_html"] = use_html
    return post_json("/api/booking-communication/send-once", payload)
