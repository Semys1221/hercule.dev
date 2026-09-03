"""Taxonomy-based lead qualification — type/category/subtypes only (not company name)."""

from __future__ import annotations

import json
import re
from typing import Any, Literal

AUTO_SEA_RE = re.compile(
    r"(?<![a-z])sea(?![a-z]).{0,40}(automobile|exploitation|vhu|garage)|"
    r"(automobile|exploitation|vhu|garage).{0,40}(?<![a-z])sea(?![a-z])",
    re.I,
)

Verdict = Literal["accepted", "rejected"]


def _normalize_subtypes(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        parts = [str(item).strip() for item in value if item]
        return ", ".join(parts)
    if isinstance(value, str):
        text = value.strip()
        if text.startswith("[") and text.endswith("]"):
            try:
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return ", ".join(str(item).strip() for item in parsed if item)
            except json.JSONDecodeError:
                pass
        return text
    return str(value).strip()


def taxonomy_text(business: dict[str, Any]) -> str:
    """Concatenate Outscraper type, category, subtypes (excludes company name)."""
    raw_parts = [
        str(business.get("type") or "").strip(),
        str(business.get("category") or "").strip(),
        _normalize_subtypes(business.get("subtypes")),
    ]
    return " | ".join(part for part in raw_parts if part).lower()


def taxonomy_fields(business: dict[str, Any]) -> dict[str, str]:
    """Separate Outscraper taxonomy fields for CSV and Instantly custom variables."""
    return {
        "Type": str(business.get("type") or "").strip(),
        "Category": str(business.get("category") or "").strip(),
        "Subtypes": _normalize_subtypes(business.get("subtypes")),
    }


def format_category_display(business: dict[str, Any]) -> str:
    """Human-readable category for CSV export."""
    raw_parts = [
        str(business.get("type") or "").strip(),
        str(business.get("category") or "").strip(),
        _normalize_subtypes(business.get("subtypes")),
    ]
    return " | ".join(part for part in raw_parts if part)


def _match_keyword(text: str, keywords: list[str]) -> str | None:
    for keyword in keywords:
        if keyword in text:
            return keyword
    return None


def detect_service_from_taxonomy(text: str) -> str:
    text_lower = str(text).lower()
    if "référencement" in text_lower or "referencement" in text_lower or "seo" in text_lower:
        return "SEO"
    if "google ads" in text_lower or (
        re.search(r"(?<![a-z])sea(?![a-z])", text_lower) and not AUTO_SEA_RE.search(text_lower)
    ):
        return "Google Ads"
    if "facebook ads" in text_lower or "meta ads" in text_lower:
        return "Facebook Ads"
    return "Marketing Digital"


def classify_agency(business: dict[str, Any], config: dict) -> Verdict:
    return "accepted" if is_valid_agency(business, config) else "rejected"


def is_valid_agency(business: dict[str, Any], config: dict) -> bool:
    return rejection_reason(business, config) is None


def _acceptable_keywords(config: dict) -> list[str]:
    """Union of direct + indirect + broad accept lists (deduped, longest first)."""
    seen: set[str] = set()
    merged: list[str] = []
    for key in (
        "DIRECT_GROWTH_KEYWORDS",
        "INDIRECT_GROWTH_KEYWORDS",
        "BROAD_ACCEPT_KEYWORDS",
        "ALLOWED_KEYWORDS",
    ):
        for kw in config.get(key) or []:
            normalized = str(kw).strip().lower()
            if normalized and normalized not in seen:
                seen.add(normalized)
                merged.append(normalized)
    merged.sort(key=len, reverse=True)
    return merged


def rejection_reason(business: dict[str, Any], config: dict) -> str | None:
    tax = taxonomy_text(business)
    if not tax.strip():
        return "empty taxonomy (type/category/subtypes missing)"

    if AUTO_SEA_RE.search(tax):
        return "automotive SEA false positive"

    blocked = config.get("BLOCKED_KEYWORDS") or []
    hit = _match_keyword(tax, blocked)
    if hit:
        return f"blocked vertical: {hit}"

    acceptable = _acceptable_keywords(config)
    hit = _match_keyword(tax, acceptable)
    if hit:
        return None

    return "no matching agency taxonomy"
