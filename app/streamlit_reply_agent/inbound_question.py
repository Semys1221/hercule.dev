"""Scheduling intent helpers mirrored from lib/ai-reply-agent/inbound-question.ts."""

from __future__ import annotations

PHONE_REQUEST_KEYWORDS = (
    "téléphone",
    "telephone",
    "appeler",
    "appel ",
    "formulaire",
    "numéro",
    "numero",
    "joignable",
    "rappeler",
)

SCHEDULING_ANSWER_KEYWORDS = (
    "disponib",
    "demain",
    "matin",
    "après-midi",
    "apres-midi",
    "aprem",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
)


def _inbound_probe(text: str) -> str:
    trimmed = (text or "").strip()
    if not trimmed or trimmed == "(empty body)":
        return ""
    without_quoted = trimmed.split("\n>")[0].strip()
    return without_quoted.lower()


def inbound_looks_like_phone_request(text: str) -> bool:
    probe = _inbound_probe(text)
    if not probe:
        return False
    return any(keyword in probe for keyword in PHONE_REQUEST_KEYWORDS)


def inbound_looks_like_scheduling_answer(text: str) -> bool:
    probe = _inbound_probe(text)
    if not probe:
        return False
    import re

    if re.search(r"\d{1,2}\s*h", probe):
        return True
    return any(keyword in probe for keyword in SCHEDULING_ANSWER_KEYWORDS)
