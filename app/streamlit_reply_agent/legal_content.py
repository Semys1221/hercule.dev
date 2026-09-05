"""Shared legal markdown sources for the reply agent knowledge pack."""

from __future__ import annotations

from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DOC_DIR = _REPO_ROOT / "doc" / "tech-stack"


def _read_doc_file(filename: str) -> str:
    return (_DOC_DIR / filename).read_text(encoding="utf-8")


def get_cvg_markdown() -> str:
    return _read_doc_file("cvg_master.md")


def get_mentions_legales_markdown() -> str:
    return _read_doc_file("mentions_legales.md")


def get_confidentialite_markdown() -> str:
    return _read_doc_file("confidentialite.md")


def build_legal_knowledge_markdown() -> str:
    return "\n".join(
        [
            "# Legal knowledge (ground truth)",
            "",
            "## Conditions Générales de Vente",
            get_cvg_markdown(),
            "",
            "## Mentions légales",
            get_mentions_legales_markdown(),
            "",
            "## Politique de confidentialité",
            get_confidentialite_markdown(),
        ]
    )
