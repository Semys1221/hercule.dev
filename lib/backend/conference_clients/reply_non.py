"""Detect short Instantly inbound replies that are a plain « non »."""

from __future__ import annotations

import re
import unicodedata

_MAX_SHORT = 60

_NON_RE = re.compile(
    r"^non"
    r"(?:\s*,)?"
    r"(?:\s+merci(?:\s+beaucoup)?)?"
    r"(?:\s+pas\s+interesse[es]?)?"
    r"[.!?]*"
    r"$"
)


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def normalize_reply(body: str) -> str:
    text = strip_accents(body or "")
    text = text.lower()
    text = text.replace("\r", "\n")
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"envoye depuis mon \S+", " ", text)
    text = re.sub(r"sent from my \S+", " ", text)
    text = re.sub(r"[«»\"'`]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    return " ".join(lines).strip(" .,!")


def is_non_reply(body_plain: str) -> bool:
    """True when the inbound body is a short refusal of the form « non »."""
    normalized = normalize_reply(body_plain)
    if not normalized:
        return False
    if len(normalized) > _MAX_SHORT:
        return False
    compact = re.sub(r"\s+", " ", normalized).strip()
    compact = compact.strip(".,!")
    return bool(_NON_RE.match(compact))
