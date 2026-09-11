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


def legal_audience_from_niche_preset(niche_preset_id: str) -> str:
    ident = niche_preset_id.strip().lower()
    if "comptable" in ident:
        return "comptable"
    if (
        "gestion_patrimoine" in ident
        or "conseiller" in ident
        or ident == "cif"
        or ident.startswith("cif_")
    ):
        return "cif"
    return "agence"


def is_comptable_niche_preset(niche_preset_id: str) -> bool:
    return legal_audience_from_niche_preset(niche_preset_id) == "comptable"


def is_cif_niche_preset(niche_preset_id: str) -> bool:
    return legal_audience_from_niche_preset(niche_preset_id) == "cif"


def get_cvg_markdown(*, audience: str = "buyer") -> str:
    if audience == "seller":
        return _read_doc_file("cvg_entreprise.md")
    return _read_doc_file("cvg_master.md")


def get_mentions_legales_markdown() -> str:
    return _read_doc_file("mentions_legales.md")


def get_confidentialite_markdown() -> str:
    return _read_doc_file("confidentialite.md")


def get_ai_reply_knowledge_markdown(*, audience: str = "agence") -> str:
    if audience == "comptable":
        return _read_doc_file("ai-reply-knowledge-comptable.md")
    if audience == "cif":
        return _read_doc_file("ai-reply-knowledge-cif.md")
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


def format_faq_for_audience(audience: str) -> str:
    faq_path = _REPO_ROOT / "content" / "faq" / f"{audience}.json"
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


def format_comptable_faq() -> str:
    return format_faq_for_audience("comptable")


def _speaking_to_label(target_type: str, audience: str) -> str:
    if audience == "comptable":
        return "cabinet EC (Buyer)" if target_type == "buyer" else "dirigeant TPE (Seller)"
    if audience == "cif":
        return "cabinet CIF (Buyer)" if target_type == "buyer" else "dirigeant PME (Seller)"
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
    audience = legal_audience_from_niche_preset(niche_preset_id)
    pack_audience = audience if audience in {"comptable", "cif"} else "agence"
    ai_reply_knowledge = get_ai_reply_knowledge_markdown(audience=pack_audience)
    overview = (_REPO_ROOT / "doc/tech-stack" / "00-overview.md").read_text(encoding="utf-8")

    if pack_audience == "comptable":
        faq_section = format_comptable_faq()
        faq_heading = "## FAQ comptable (Buyer/Seller)"
        faq_fallback = "Cabinet > 3 associés. Dirigeant TPE : service gratuit."
    elif pack_audience == "cif":
        faq_section = format_faq_for_audience("cif")
        faq_heading = "## FAQ CIF (Buyer/Seller)"
        faq_fallback = "Cabinet CIF min. 2 associés. Dirigeant PME : service gratuit."
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
    parts.append(f"Speaking to: {_speaking_to_label(target_type, pack_audience)}")
    return "\n".join(parts)
