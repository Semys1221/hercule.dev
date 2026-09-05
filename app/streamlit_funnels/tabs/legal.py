"""CVG & legal leaf renderers."""

from __future__ import annotations

import streamlit as st

from audiences import Audience
from legal_content import get_audience_legal_markdown

DOC_TYPE_BY_LEAF: dict[str, str] = {
    "legal_cgv": "cgv",
    "legal_mentions": "mentions",
    "legal_confidentialite": "confidentialite",
    "legal_faq": "faq",
}

DOC_LABELS: dict[str, str] = {
    "legal_cgv": "CGV",
    "legal_mentions": "Mentions légales",
    "legal_confidentialite": "Confidentialité",
    "legal_faq": "FAQ",
}


def render_legal_doc(audience: Audience, leaf: str) -> None:
    doc_type = DOC_TYPE_BY_LEAF[leaf]
    label = DOC_LABELS[leaf]
    markdown = get_audience_legal_markdown(audience, doc_type)  # type: ignore[arg-type]

    st.caption(
        "Aperçu lecture seule. L'édition écrira dans `doc/tech-stack/` et synchronisera le site."
    )
    st.text_area(
        label,
        value=markdown,
        height=480,
        disabled=True,
        key=f"legal_preview_{audience}_{doc_type}",
    )
