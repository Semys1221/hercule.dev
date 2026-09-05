"""Sales tab."""

from __future__ import annotations

import streamlit as st

from audiences import Audience
from components.placeholder import render_placeholder
from demands.mockup_editor import render_mockup_editor

FUNNEL_STAGES = ("Discovery", "Pitch", "Closing")


def render_sales_tab(audience: Audience) -> None:
    tab_funnel, tab_mockup = st.tabs(["Funnel", "Fiches mockup"])

    with tab_funnel:
        _render_funnel(audience)

    with tab_mockup:
        render_mockup_editor(audience)


def _render_funnel(audience: Audience) -> None:
    stage = st.sidebar.radio(
        "Étape funnel",
        options=FUNNEL_STAGES,
        key=f"sales_funnel_stage_{audience}",
        horizontal=True,
    )
    render_placeholder(
        f"Sales — {stage}",
        f"Contenu à venir pour l'étape {stage.lower()} ({audience}).",
    )
