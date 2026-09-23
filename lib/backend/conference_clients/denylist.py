"""Large-group brands excluded from the independent-cabinet grid."""

from __future__ import annotations

DENYLIST_TERMS = (
    "fiducial",
    "cerfrance",
    "in extenso",
    "inextenso",
    "mazars",
    "kpmg",
    "grant thornton",
    "grantthornton",
    "baker tilly",
    "bakertilly",
    "deloitte",
    "ey.com",
    "ernst & young",
    "pwc",
    "pricewaterhouse",
    "bdo france",
    "acrodis",
    "exco",
)


def is_denied(name: str, domain: str) -> bool:
    haystack = f"{name} {domain}".lower()
    return any(term in haystack for term in DENYLIST_TERMS)
