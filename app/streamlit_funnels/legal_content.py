"""Audience-aware legal markdown loader."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Literal

from audiences import Audience

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DOC_DIR = _REPO_ROOT / "doc" / "tech-stack"
_AGENCE_FAQ_PATH = _REPO_ROOT / "lib" / "site" / "agence-faq.ts"
_FRONT_CLIENT_PATH = _DOC_DIR / "deliverance" / "front-client.md"

LegalDocType = Literal["cgv", "mentions", "confidentialite", "faq"]


def _read_doc_file(filename: str) -> str:
    return (_DOC_DIR / filename).read_text(encoding="utf-8")


def get_cgv_markdown(audience: Audience) -> str:
    if audience == "agence":
        return _read_doc_file("cvg_master.md")
    return _read_doc_file("cvg_entreprise.md")


def get_mentions_legales_markdown() -> str:
    return _read_doc_file("mentions_legales.md")


def get_confidentialite_markdown() -> str:
    return _read_doc_file("confidentialite.md")


def _parse_agence_faq_ts() -> str:
    if not _AGENCE_FAQ_PATH.is_file():
        return "# FAQ agence\n\nSource introuvable."
    raw = _AGENCE_FAQ_PATH.read_text(encoding="utf-8")
    entries = re.findall(
        r'question:\s*"([^"]+)"[\s\S]*?answer:\s*"([^"]+)"',
        raw,
    )
    lines = ["# FAQ agence", ""]
    for question, answer in entries:
        lines.append(f"## {question}")
        lines.append("")
        lines.append(answer)
        lines.append("")
    return "\n".join(lines).strip()


def _extract_entreprise_faq_markdown() -> str:
    if not _FRONT_CLIENT_PATH.is_file():
        return "# FAQ entreprise\n\nSource introuvable."
    raw = _FRONT_CLIENT_PATH.read_text(encoding="utf-8")
    start = raw.find("### Questions entreprise")
    if start < 0:
        return "# FAQ entreprise\n\nSection introuvable dans front-client.md."
    section = raw[start:]
    end = section.find("---", 10)
    if end > 0:
        section = section[:end]
    lines = ["# FAQ entreprise", ""]
    rows = re.findall(r"\| E\d+ \| ([^|]+) \| ([^|]+) \|", section)
    for question, answer in rows:
        lines.append(f"## {question.strip()}")
        lines.append("")
        lines.append(answer.strip())
        lines.append("")
    return "\n".join(lines).strip()


def get_faq_markdown(audience: Audience) -> str:
    if audience == "agence":
        return _parse_agence_faq_ts()
    return _extract_entreprise_faq_markdown()


def get_audience_legal_markdown(audience: Audience, doc_type: LegalDocType) -> str:
    if doc_type == "cgv":
        return get_cgv_markdown(audience)
    if doc_type == "mentions":
        return get_mentions_legales_markdown()
    if doc_type == "confidentialite":
        return get_confidentialite_markdown()
    return get_faq_markdown(audience)
