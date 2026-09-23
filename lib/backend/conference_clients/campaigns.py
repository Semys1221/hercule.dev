"""Classify Instantly campaign names into conference verticals."""

from __future__ import annotations

import re
from typing import Literal

Category = Literal["accounting", "brokerage"]

def _bare_campaign_name(name: str) -> str:
    """Drop emoji and punctuation so '🧚‍♂️ DEC' compares as DEC."""
    text = re.sub(r"[^\w\s]", " ", name or "", flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip().upper()


def classify_campaign_name(name: str) -> Category | None:
    """Only the Instantly campaigns named DEC and CIF. Not IAS, DCE, or 'Médecins (CIF)'."""
    bare = _bare_campaign_name(name)
    if bare == "DEC":
        return "accounting"
    if bare == "CIF":
        return "brokerage"
    return None
