"""Supabase access for agence demandes Streamlit editor (table removed)."""

from __future__ import annotations

from typing import Any


def list_all_cards() -> list[dict[str, Any]]:
    return []


def list_demandes() -> list[dict[str, Any]]:
    return []


def list_teasers() -> list[dict[str, Any]]:
    return []


def get_card(_external_id: str) -> dict[str, Any] | None:
    return None


def update_demande(_external_id: str, _fields: dict[str, Any]) -> None:
    raise RuntimeError("agence_demandes table removed — carousel disabled")


def update_teaser(_external_id: str, _fields: dict[str, Any]) -> None:
    raise RuntimeError("agence_demandes table removed — carousel disabled")
