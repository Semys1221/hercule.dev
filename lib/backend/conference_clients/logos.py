"""Fetch a header logo from a cabinet site and store it as WebP."""

from __future__ import annotations

import io
import re
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None  # type: ignore[assignment]

USER_AGENT = (
    "Mozilla/5.0 (compatible; HerculeConferenceLogoBot/1.0; +https://hercule.dev)"
)
TIMEOUT = (10, 20)
MAX_HEIGHT = 128
MAX_BYTES = 2_000_000

_LOGO_HINT = re.compile(r"logo", re.I)
_SKIP_SRC = re.compile(r"sprite|placeholder|avatar|photo|banner|og-image", re.I)


def _abs_url(src: str, base: str) -> str | None:
    raw = (src or "").strip()
    if not raw or raw.startswith("data:"):
        return None
    return urljoin(base, raw)


def pick_logo_url(html: str, page_url: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    scoped = soup.find("header") or soup.find(attrs={"role": "banner"})
    search_root = scoped or soup

    candidates: list[str] = []
    fallback: list[str] = []

    for img in search_root.find_all("img"):
        alt = str(img.get("alt") or "")
        cls = " ".join(img.get("class") or [])
        src = str(img.get("src") or img.get("data-src") or "")
        if _SKIP_SRC.search(src):
            continue
        url = _abs_url(src, page_url)
        if not url:
            continue
        hinted = bool(_LOGO_HINT.search(src) or _LOGO_HINT.search(alt) or _LOGO_HINT.search(cls))
        if hinted:
            candidates.append(url)
        elif scoped is not None:
            fallback.append(url)

    for link in soup.find_all("link", rel=True):
        rel = " ".join(link.get("rel") or []).lower()
        if "icon" in rel or rel == "shortcut icon":
            continue
        href = str(link.get("href") or "")
        if _LOGO_HINT.search(href) or _LOGO_HINT.search(rel):
            url = _abs_url(href, page_url)
            if url:
                candidates.append(url)

    for url in (*candidates, *fallback):
        path = urlparse(url).path.lower()
        if path.endswith(".svg"):
            continue
        return url
    return None


def _to_webp(raw: bytes) -> bytes:
    if Image is None:
        raise RuntimeError("Pillow is required to convert logos to WebP")
    image = Image.open(io.BytesIO(raw))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA")
    width, height = image.size
    if height > MAX_HEIGHT and height > 0:
        ratio = MAX_HEIGHT / height
        resample = getattr(getattr(Image, "Resampling", Image), "LANCZOS")
        image = image.resize((max(1, int(width * ratio)), MAX_HEIGHT), resample)
    out = io.BytesIO()
    image.save(out, format="WEBP", quality=85, method=6)
    return out.getvalue()


def fetch_logo_bytes(website: str, *, session: requests.Session | None = None) -> tuple[bytes | None, str]:
    http = session or requests.Session()
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,image/webp,image/*"}
    try:
        page = http.get(website, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        page.raise_for_status()
    except requests.RequestException as exc:
        return None, f"homepage_failed:{exc}"

    content_type = (page.headers.get("Content-Type") or "").lower()
    if "text/html" not in content_type and not page.text.lstrip().startswith("<"):
        return None, "homepage_not_html"

    logo_url = pick_logo_url(page.text, page.url)
    if not logo_url:
        return None, "logo_not_found"

    try:
        asset = http.get(logo_url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        asset.raise_for_status()
    except requests.RequestException as exc:
        return None, f"logo_download_failed:{exc}"

    if len(asset.content) > MAX_BYTES:
        return None, "logo_too_large"
    if len(asset.content) < 32:
        return None, "logo_too_small"

    try:
        return _to_webp(asset.content), "ok"
    except Exception as exc:  # noqa: BLE001
        return None, f"logo_convert_failed:{exc}"


def fetch_and_store_logo(
    candidate: dict[str, Any],
    dest_dir,
) -> tuple[str | None, str]:
    raw, reason = fetch_logo_bytes(candidate["website"])
    if raw is None:
        return None, reason
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{candidate['slug']}.webp"
    path = dest_dir / filename
    path.write_bytes(raw)
    return f"/conference/clients/{filename}", reason
