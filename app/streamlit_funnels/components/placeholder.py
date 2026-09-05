"""Empty-state helpers."""

from __future__ import annotations

import streamlit as st


def render_placeholder(title: str, detail: str | None = None) -> None:
    body = detail or "Contenu à venir."
    st.info(f"**{title}** — {body}")
