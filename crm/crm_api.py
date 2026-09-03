"""HTTP helpers for Streamlit → Next.js CRM backend."""

from __future__ import annotations

from typing import Any

import requests

from config import crm_backend_headers, settings


def _parse_response(path: str, response: requests.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError:
        data = {"error": response.text}
    if not response.ok:
        raise RuntimeError(
            f"{path} HTTP {response.status_code}: {data.get('error') or data}"
        )
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
