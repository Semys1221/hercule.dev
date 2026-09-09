"""Shared legal markdown sources for the reply agent knowledge pack."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DOC_DIR = _REPO_ROOT / "doc" / "tech-stack"


def _read_doc_file(filename: str) -> str:
    return (_DOC_DIR / filename).read_text(encoding="utf-8")


def is_comptable_niche_preset(niche_preset_id: str) -> bool:
    return "comptable" in niche_preset_id


def get_cvg_markdown(*, audience: str = "buyer") -> str:
    if audience == "seller":
        return _read_doc_file("cvg_entreprise.md")
    return _read_doc_file("cvg_master.md")


def get_mentions_legales_markdown() -> str:
    return _read_doc_file("mentions_legales.md")


def get_confidentialite_markdown() -> str:
    return _read_doc_file("confidentialite.md")


def get_ai_reply_knowledge_markdown(*, comptable: bool = False) -> str:
    if comptable:
        return _read_doc_file("ai-reply-knowledge-comptable.md")
    return _read_doc_file("ai-reply-knowledge.md")


def build_legal_knowledge_markdown(*, audience: str = "buyer") -> str:
    """Full legal bundle for site sync — not used in Grok knowledge pack."""
    return "\n".join(
        [
            "# Legal knowledge (ground truth)",
            "",
            "## Conditions Générales de Vente",
            get_cvg_markdown(audience=audience),
            "",
            "## Mentions légales",
            get_mentions_legales_markdown(),
            "",
            "## Politique de confidentialité",
            get_confidentialite_markdown(),
        ]
    )


def extract_entreprise_faq(markdown: str) -> str:
    start = markdown.find("### Questions entreprise")
    if start < 0:
        return ""
    after_start = markdown[start:]
    hr_match = re.search(r"\n---\n", after_start)
    section = after_start[: hr_match.start()] if hr_match else after_start
    rows: list[str] = []
    for line in section.split("\n"):
        match = re.match(r"^\|\s*E\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$", line)
        if match:
            rows.append(f"Q: {match.group(1)}\nA: {match.group(2)}")
    return "\n\n".join(rows)


def format_comptable_faq() -> str:
    faq_path = _REPO_ROOT / "content" / "faq" / "comptable.json"
    if not faq_path.is_file():
        return ""
    data = json.loads(faq_path.read_text(encoding="utf-8"))
    entries = data.get("entries") or []
    rows: list[str] = []
    for entry in entries:
        question = str(entry.get("question") or "").strip()
        answer = str(entry.get("answer") or "").strip()
        if question and answer:
            rows.append(f"Q: {question}\nA: {answer}")
    return "\n\n".join(rows)


def _speaking_to_label(target_type: str, comptable: bool) -> str:
    if comptable:
        return "cabinet EC (Buyer)" if target_type == "buyer" else "dirigeant TPE (Seller)"
    return "agence (Buyer)" if target_type == "buyer" else "entreprise (Seller)"


@lru_cache(maxsize=32)
def build_knowledge_pack_cached(
    niche_preset_id: str,
    target_type: str,
    niche_angle: str,
    niche_effectif: str,
) -> str:
    return _build_knowledge_pack_uncached(
        niche_preset_id=niche_preset_id,
        target_type=target_type,
        niche_angle=niche_angle,
        niche_effectif=niche_effectif,
    )


def _build_knowledge_pack_uncached(
    *,
    niche_preset_id: str,
    target_type: str,
    niche_angle: str,
    niche_effectif: str,
) -> str:
    comptable = is_comptable_niche_preset(niche_preset_id)
    ai_reply_knowledge = get_ai_reply_knowledge_markdown(comptable=comptable)
    overview = (_REPO_ROOT / "doc/tech-stack/00-overview.md").read_text(encoding="utf-8")

    if comptable:
        faq_section = format_comptable_faq()
        faq_heading = "## FAQ comptable (Buyer/Seller)"
        faq_fallback = "Cabinet > 3 associés. Dirigeant TPE : service gratuit."
    else:
        deliverance = (_REPO_ROOT / "doc/tech-stack/deliverance/front-client.md").read_text(
            encoding="utf-8"
        )
        faq_section = extract_entreprise_faq(deliverance)
        faq_heading = "## Entreprise FAQ (Seller)"
        faq_fallback = "Entreprise service is free. No commission. Calendly via email."

    parts = [
        "# Knowledge pack (ground truth only — do not invent facts outside this pack)",
        "",
        "## Product overview",
        overview[:4000],
        "",
        "## Reply-safe facts (condensed)",
        ai_reply_knowledge,
        "",
        faq_heading,
        faq_section or faq_fallback,
        "",
        "## Niche context",
        f"Preset: {niche_preset_id}",
        f"Angle: {niche_angle}",
    ]
    if niche_effectif:
        parts.append(f"Target size: {niche_effectif}")
    parts.append(f"Speaking to: {_speaking_to_label(target_type, comptable)}")
    return "\n".join(parts)
