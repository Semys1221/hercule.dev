"""Outscraper taxonomy gate — métier filter on type/category/subtypes only."""

from __future__ import annotations

from typing import Any

from category_filter import taxonomy_text


def matches_taxonomy(
    business: dict[str, Any],
    included_keywords: list[str],
) -> tuple[bool, str]:
    """Return (match, matched_keyword). Uses Outscraper type, category, subtypes."""
    text = taxonomy_text(business)
    if not text:
        return False, ""
    for keyword in included_keywords:
        kw = str(keyword).strip().lower()
        if kw and kw in text:
            return True, kw
    return False, ""
