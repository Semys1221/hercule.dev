"""CVG & legal tab."""

from __future__ import annotations

import streamlit as st

from audiences import Audience
from legal_content import get_audience_legal_markdown

LEGAL_TABS = {
    "CGV": "cgv",
    "Mentions légales": "mentions",
    "Confidentialité": "confidentialite",
    "FAQ": "faq",
}


def render_legal_tab(audience: Audience) -> None:
    selected_label = st.radio(
        "Document",
        options=list(LEGAL_TABS.keys()),
        key=f"legal_doc_{audience}",
        horizontal=True,
    )
    doc_type = LEGAL_TABS[selected_label]
    markdown = get_audience_legal_markdown(audience, doc_type)

    st.caption(
        "Aperçu lecture seule. L'édition écrira dans `doc/tech-stack/` et synchronisera le site."
    )
    st.text_area(
        selected_label,
        value=markdown,
        height=480,
        disabled=True,
        key=f"legal_preview_{audience}_{doc_type}",
    )
