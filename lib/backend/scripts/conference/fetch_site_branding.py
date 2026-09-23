#!/usr/bin/env python3
"""Fetch company names + logos and store under doc/fetch (WebP, max height 128)."""

from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

_REPO = Path(__file__).resolve().parents[4]
_BACKEND = _REPO / "lib" / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from conference_clients.logos import (  # noqa: E402
    MAX_BYTES,
    MAX_HEIGHT,
    TIMEOUT,
    USER_AGENT,
    _abs_url,
    _to_webp,
    pick_logo_url,
)

OUTPUT_DIR = _REPO / "doc" / "fetch"
LOGO_DIR = OUTPUT_DIR / "logos"
MANIFEST = OUTPUT_DIR / "manifest.json"

SITES = [
    "cdvpatrimoine.com",
    "fundora.fr",
    "renaud-conseil.fr",
    "apsconsult.fr",
    "mynvest.fr",
    "fiscalitedufrontalier.com",
    "apollux-patrimoine.com",
    "lhconseils.fr",
    "etpatrimoine.com",
    "financierematignon.com",
    "yvescastel.com",
]

_LOGO_HINT = re.compile(r"logo", re.I)
_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slug_from_input(domain: str) -> str:
    host = domain.strip().lower()
    host = re.sub(r"^https?://", "", host)
    host = host.split("/")[0].removeprefix("www.")
    slug = _SLUG_RE.sub("-", host).strip("-")
    return slug or "site"


def _clean_title(title: str) -> str:
    text = " ".join(title.split())
    for sep in (" | ", " - ", " – ", " — ", " : "):
        if sep in text:
            return text.split(sep, 1)[0].strip()
    return text


def pick_company_name(soup: BeautifulSoup) -> str | None:
    for key, attr in (
        ("og:site_name", "property"),
        ("og:title", "property"),
        ("twitter:title", "name"),
        ("application-name", "name"),
    ):
        tag = soup.find("meta", attrs={attr: key})
        if tag and tag.get("content"):
            name = _clean_title(str(tag["content"]))
            if name:
                return name

    if soup.title and soup.title.string:
        name = _clean_title(soup.title.string)
        if name:
            return name

    h1 = soup.find("h1")
    if h1:
        text = h1.get_text(" ", strip=True)
        if text:
            return text[:160]
    return None


def pick_logo_url_extended(html: str, page_url: str) -> str | None:
    found = pick_logo_url(html, page_url)
    if found:
        return found

    soup = BeautifulSoup(html, "html.parser")
    scoped = soup.find("header") or soup.find(attrs={"role": "banner"}) or soup

    for img in scoped.find_all("img"):
        alt = str(img.get("alt") or "")
        cls = " ".join(img.get("class") or [])
        src = str(img.get("src") or img.get("data-src") or "")
        if not src:
            continue
        if _LOGO_HINT.search(src) or _LOGO_HINT.search(alt) or _LOGO_HINT.search(cls):
            url = _abs_url(src, page_url)
            if url:
                return url

    for link in soup.find_all("link", rel=True):
        rel = " ".join(link.get("rel") or []).lower()
        if "apple-touch-icon" in rel:
            url = _abs_url(str(link.get("href") or ""), page_url)
            if url:
                return url

    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        url = _abs_url(str(og["content"]), page_url)
        if url:
            return url

    for link in soup.find_all("link", rel=True):
        rel = " ".join(link.get("rel") or []).lower()
        if "icon" in rel:
            url = _abs_url(str(link.get("href") or ""), page_url)
            if url:
                return url

    return None


def _url_candidates(domain: str) -> list[str]:
    raw = domain.strip()
    if raw.startswith("http://") or raw.startswith("https://"):
        return [raw]
    host = raw.removeprefix("www.")
    return [
        f"https://{host}",
        f"https://www.{host}",
        f"http://{host}",
    ]


def _decode_data_url(url: str) -> bytes | None:
    if not url.startswith("data:"):
        return None
    try:
        header, payload = url.split(",", 1)
    except ValueError:
        return None
    if ";base64" in header:
        return base64.b64decode(payload)
    return payload.encode("utf-8")


def _rasterize_if_svg(raw: bytes, source_url: str) -> bytes:
    path = urlparse(source_url).path.lower()
    is_svg = path.endswith(".svg") or b"<svg" in raw[:800].lower()
    if not is_svg:
        return raw
    try:
        import cairosvg  # type: ignore[import-untyped]
    except ImportError:
        raise ValueError("svg_convert_needs_cairosvg") from None
    return cairosvg.svg2png(bytestring=raw)


def download_logo_bytes(logo_url: str, session: requests.Session) -> bytes:
    embedded = _decode_data_url(logo_url)
    if embedded is not None:
        raw = embedded
    else:
        headers = {"User-Agent": USER_AGENT, "Accept": "image/webp,image/*,*/*"}
        asset = session.get(logo_url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        asset.raise_for_status()
        raw = asset.content

    if len(raw) > MAX_BYTES:
        raise ValueError("logo_too_large")
    if len(raw) < 32:
        raise ValueError("logo_too_small")
    return _rasterize_if_svg(raw, logo_url)


def fetch_page(session: requests.Session, domain: str) -> tuple[requests.Response | None, list[str]]:
    notes: list[str] = []
    for url in _url_candidates(domain):
        try:
            page = session.get(
                url,
                headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
                timeout=TIMEOUT,
                allow_redirects=True,
            )
            if page.status_code == 404:
                notes.append(f"404:{url}")
                continue
            page.raise_for_status()
            return page, notes
        except requests.RequestException as exc:
            notes.append(f"fetch_failed:{url}:{exc}")
    return None, notes


def process_site(domain: str, session: requests.Session) -> dict:
    slug = slug_from_input(domain)
    row: dict = {
        "input": domain,
        "slug": slug,
        "website": None,
        "company_name": None,
        "logo_source_url": None,
        "logo_file": None,
        "logo_width": None,
        "logo_height": None,
        "format": "webp",
        "max_height": MAX_HEIGHT,
        "ok": False,
        "notes": [],
    }

    page, fetch_notes = fetch_page(session, domain)
    row["notes"].extend(fetch_notes)
    if page is None:
        return row

    row["website"] = page.url
    ctype = (page.headers.get("Content-Type") or "").lower()
    if "text/html" not in ctype and not page.text.lstrip().startswith("<"):
        row["notes"].append("not_html")
        return row

    soup = BeautifulSoup(page.text, "html.parser")
    row["company_name"] = pick_company_name(soup)
    logo_url = pick_logo_url_extended(page.text, page.url)
    if not logo_url:
        row["notes"].append("logo_not_found")
    if not row["company_name"]:
        row["notes"].append("company_name_not_found")

    if logo_url:
        row["logo_source_url"] = logo_url
        try:
            raw = download_logo_bytes(logo_url, session)
            webp = _to_webp(raw)
            LOGO_DIR.mkdir(parents=True, exist_ok=True)
            logo_path = LOGO_DIR / f"{slug}.webp"
            logo_path.write_bytes(webp)

            from PIL import Image
            import io

            image = Image.open(io.BytesIO(webp))
            row["logo_width"], row["logo_height"] = image.size
            row["logo_file"] = f"logos/{slug}.webp"
        except Exception as exc:  # noqa: BLE001
            row["notes"].append(f"logo_store_failed:{exc}")

    row["ok"] = bool(row["company_name"] and row["logo_file"])
    return row


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    results = [process_site(site, session) for site in SITES]
    manifest = {
        "generated_by": "lib/backend/scripts/conference/fetch_site_branding.py",
        "logo_format": "webp",
        "max_height_px": MAX_HEIGHT,
        "sites": results,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
