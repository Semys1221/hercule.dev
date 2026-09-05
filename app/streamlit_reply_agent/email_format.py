"""Format plain-text AI replies into HTML with Hercule link and signature rules."""

from __future__ import annotations

import html
import re
from typing import Literal

from lead_links import TargetType, resolve_lead_cta_link

HERCULE_WEBSITE_URL = "https://hercule.dev"
BEATRICE_SIGNATURE = "Béatrice Meyer"

_RESERVATION_PATH_RE = re.compile(r"reservation(?:-entreprise)?\.html", re.I)
_URL_RE = re.compile(
    r"https?://[^\s<>]+|(?:www\.)?hercule\.dev[/\w\-.?=&%]*",
    re.I,
)


def _normalize_plain_text(text: str) -> str:
    return (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()


def _has_reservation_url(text: str) -> bool:
    return bool(_RESERVATION_PATH_RE.search(text))


def _is_reservation_url(url: str) -> bool:
    return bool(_RESERVATION_PATH_RE.search(url))


def _is_hercule_site_url(url: str) -> bool:
    return "hercule.dev" in url.lower() and not _is_reservation_url(url)


def _normalize_url(url: str) -> str:
    cleaned = url.strip().rstrip(".,;)")
    if cleaned.lower().startswith("www."):
        return f"https://{cleaned}"
    if "hercule.dev" in cleaned.lower() and not cleaned.lower().startswith("http"):
        return f"https://{cleaned.lstrip('/')}"
    return cleaned


def _signature_index(text: str) -> int:
    for marker in (BEATRICE_SIGNATURE, "Beatrice Meyer"):
        idx = text.rfind(marker)
        if idx >= 0:
            return idx
    return -1


def ensure_beatrice_signature(text: str) -> str:
    """Ensure Béatrice Meyer signature and hercule.dev link below it."""
    if _signature_index(text) < 0:
        text = f"{text.rstrip()}\n\n{BEATRICE_SIGNATURE}"

    idx = _signature_index(text)
    after_signature = text[idx:].lower()
    if "hercule.dev" not in after_signature:
        text = f"{text.rstrip()}\n{HERCULE_WEBSITE_URL}"
    return text


def ensure_cta_present(text: str, cta_link: str) -> str:
    """Append reservation CTA URL when missing from the body."""
    if not cta_link.strip():
        return text
    if cta_link in text or _has_reservation_url(text):
        return text
    return f"{text.rstrip()}\n\nRéservez un créneau ici : {cta_link}"


def _anchor_for_url(url: str) -> str:
    normalized = _normalize_url(url)
    escaped_href = html.escape(normalized, quote=True)
    if _is_reservation_url(url):
        return f'<a href="{escaped_href}">Réserver</a>'
    if _is_hercule_site_url(url) or "hercule.dev" in url.lower():
        return f'<a href="{escaped_href}">hercule.dev</a>'
    escaped_url = html.escape(url, quote=False)
    return f'<a href="{escaped_href}">{escaped_url}</a>'


def _plain_to_linked_html(plain: str) -> str:
    parts: list[str] = []
    last = 0
    for match in _URL_RE.finditer(plain):
        start, end = match.span()
        if start > last:
            parts.append(html.escape(plain[last:start], quote=False))
        parts.append(_anchor_for_url(match.group(0)))
        last = end
    if last < len(plain):
        parts.append(html.escape(plain[last:], quote=False))
    return "".join(parts)


def _paragraphs_from_linked_text(linked: str) -> str:
    blocks = [block for block in linked.split("\n\n") if block.strip()]
    paragraphs: list[str] = []
    for block in blocks:
        inner = block.replace("\n", "<br/>")
        paragraphs.append(f"<p>{inner}</p>")
    return "".join(paragraphs)


def plain_text_to_html(text: str) -> str:
    """Legacy escape-only HTML wrapper (no link formatting)."""
    escaped = html.escape(text, quote=False)
    return _paragraphs_from_linked_text(escaped)


def format_reply_html(
    text: str,
    *,
    lead_email: str | None = None,
    target_type: TargetType | None = None,
    cta_link: str | None = None,
) -> str:
    """Convert plain reply text to HTML with Réserver / hercule.dev anchors."""
    body = _normalize_plain_text(text)
    if not body:
        body = BEATRICE_SIGNATURE

    resolved_cta = (cta_link or "").strip()
    if not resolved_cta and lead_email and target_type:
        resolved_cta = resolve_lead_cta_link(lead_email, target_type)
    if resolved_cta:
        body = ensure_cta_present(body, resolved_cta)

    body = ensure_beatrice_signature(body)
    linked = _plain_to_linked_html(body)
    return _paragraphs_from_linked_text(linked)
