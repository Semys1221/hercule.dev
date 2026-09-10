"""Calendly auto-booking helper for reply agent (calls Next.js API)."""

from __future__ import annotations

import os
from typing import Any, Literal

import requests

from config import app_base_url
from legal_content import is_comptable_niche_preset

BookFromInboundMode = Literal["none", "suggest_slots", "try_book"]


def _auto_book_enabled() -> bool:
    return os.getenv("AI_REPLY_AGENT_CALENDLY_AUTO_BOOK", "").strip().lower() == "true"


def _scheduling_mode(inbound_text: str) -> BookFromInboundMode:
    from inbound_question import (
        inbound_looks_like_phone_request,
        inbound_looks_like_scheduling_answer,
    )

    if inbound_looks_like_scheduling_answer(inbound_text):
        return "try_book"
    if inbound_looks_like_phone_request(inbound_text):
        return "suggest_slots"
    return "none"


def resolve_booking_context(
    *,
    campaign_id: str,
    niche_preset_id: str,
    inbound_text: str,
    lead_email: str,
    lead_name: str,
) -> str | None:
    if not _auto_book_enabled():
        return None
    if not is_comptable_niche_preset(niche_preset_id):
        return None

    mode = _scheduling_mode(inbound_text)
    if mode == "none":
        return None

    try:
        response = requests.post(
            f"{app_base_url()}/api/calendly/book-from-inbound",
            json={
                "event": "comptable",
                "leadEmail": lead_email,
                "leadName": lead_name or lead_email,
                "inboundText": inbound_text,
                "mode": mode,
            },
            timeout=45,
        )
        data = response.json()
        if not response.ok or not data.get("ok"):
            return None
        result = data.get("result") or {}
        return _format_booking_context(result)
    except Exception:
        return None


def _format_booking_context(result: dict[str, Any]) -> str | None:
    status = str(result.get("status") or "")
    if status in {"disabled", "skipped", "no_match"}:
        return None
    if status == "already_booked":
        return "\n".join(
            [
                "Un rendez-vous Calendly est déjà planifié pour ce cabinet.",
                f"Créneau : {result.get('slotLabel', '')}.",
                f"Lien de replanification (ne pas inventer) : {result.get('rescheduleUrl', '')}",
                "Confirmez poliment que le créneau est bien noté.",
            ]
        )
    if status == "booked":
        return "\n".join(
            [
                "Un rendez-vous Calendly a été créé automatiquement pour ce cabinet.",
                f"Créneau confirmé : {result.get('slotLabel', '')}.",
                f"Lien de replanification (ne pas inventer) : {result.get('rescheduleUrl', '')}",
                "Confirmez la visio Zoom planifiée ; ne propose pas un appel téléphonique ad hoc.",
            ]
        )
    if status == "suggest_slots":
        slots = result.get("slots") or []
        labels = [
            str(slot.get("label") or "").strip()
            for slot in slots
            if isinstance(slot, dict) and str(slot.get("label") or "").strip()
        ]
        slot_text = " ou ".join(labels) if labels else ""
        return "\n".join(
            [
                "Le cabinet demande un contact téléphonique ou refuse le formulaire.",
                "Demandez à quelles heures il serait disponible cette semaine pour une visio.",
                f"Proposez ces créneaux Calendly (ne pas inventer d'autres horaires) : {slot_text}.",
            ]
        )
    if status == "ambiguous":
        slots = result.get("slots") or []
        labels = [
            str(slot.get("label") or "").strip()
            for slot in slots
            if isinstance(slot, dict) and str(slot.get("label") or "").strip()
        ]
        return "\n".join(
            [
                "Le cabinet a indiqué une disponibilité mais le créneau n'est pas clair.",
                f"Proposez de choisir entre : {' ou '.join(labels)}.",
                "Demandez confirmation du créneau préféré pour planifier la visio.",
            ]
        )
    return None
