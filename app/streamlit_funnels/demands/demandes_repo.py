"""Supabase access for agence_demandes carousel cards."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from config import require_supabase
from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_client() -> Client:
    url, key = require_supabase()
    return create_client(url, key)


def list_all_cards() -> list[dict[str, Any]]:
    resp = (
        get_client()
        .table("agence_demandes")
        .select("*")
        .order("sort_order")
        .execute()
    )
    return resp.data or []


def list_demandes() -> list[dict[str, Any]]:
    return [row for row in list_all_cards() if row.get("record_type") == "demande"]


def list_teasers() -> list[dict[str, Any]]:
    return [row for row in list_all_cards() if row.get("record_type") == "teaser"]


def get_card(external_id: str) -> dict[str, Any] | None:
    resp = (
        get_client()
        .table("agence_demandes")
        .select("*")
        .eq("external_id", external_id)
        .maybe_single()
        .execute()
    )
    return resp.data if resp else None


def update_demande(external_id: str, fields: dict[str, Any]) -> None:
    allowed = {
        "niche",
        "secteur",
        "prestation",
        "budget",
        "taille",
        "zone",
        "disponibilite",
        "origine",
        "status",
        "available_from",
        "available_until",
    }
    payload = {key: value for key, value in fields.items() if key in allowed}
    if not payload:
        return
    get_client().table("agence_demandes").update(payload).eq("external_id", external_id).execute()


def update_teaser(external_id: str, fields: dict[str, Any]) -> None:
    allowed = {"secteur", "titre", "description", "note"}
    payload = {key: value for key, value in fields.items() if key in allowed}
    if not payload:
        return
    get_client().table("agence_demandes").update(payload).eq("external_id", external_id).execute()
