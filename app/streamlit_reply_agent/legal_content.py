"""Shared legal markdown sources for the reply agent knowledge pack."""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DOC_DIR = _REPO_ROOT / "doc" / "tech-stack"


def _read_doc_file(filename: str) -> str:
    return (_DOC_DIR / filename).read_text(encoding="utf-8")


def get_cvg_markdown(*, audience: str = "buyer") -> str:
    if audience == "seller":
        return _read_doc_file("cvg_entreprise.md")
    return _read_doc_file("cvg_master.md")


def get_mentions_legales_markdown() -> str:
    return _read_doc_file("mentions_legales.md")


def get_confidentialite_markdown() -> str:
    return _read_doc_file("confidentialite.md")


def get_ai_reply_knowledge_markdown() -> str:
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
    ai_reply_knowledge = get_ai_reply_knowledge_markdown()
    deliverance = (_REPO_ROOT / "doc/tech-stack/deliverance/front-client.md").read_text(
        encoding="utf-8"
    )
    overview = (_REPO_ROOT / "doc/tech-stack/00-overview.md").read_text(encoding="utf-8")
    entreprise_faq = extract_entreprise_faq(deliverance)
    speaking_to = "agence (Buyer)" if target_type == "buyer" else "entreprise (Seller)"

    parts = [
        "# Knowledge pack (ground truth only — do not invent facts outside this pack)",
        "",
        "## Product overview",
        overview[:4000],
        "",
        "## Reply-safe facts (condensed)",
        ai_reply_knowledge,
        "",
        "## Entreprise FAQ (Seller)",
        entreprise_faq or "Entreprise service is free. No commission. Calendly via email.",
        "",
        "## Niche context",
        f"Preset: {niche_preset_id}",
        f"Angle: {niche_angle}",
    ]
    if niche_effectif:
        parts.append(f"Target size: {niche_effectif}")
    parts.append(f"Speaking to: {speaking_to}")
    return "\n".join(parts)
