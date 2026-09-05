"""Onboarding tab."""

from __future__ import annotations

import streamlit as st

from audiences import Audience
from components.placeholder import render_placeholder
from fiches.form import render_fiche_form


def render_onboarding_tab(audience: Audience) -> None:
    tab_funnel, tab_form = st.tabs(["Funnel", "Fiche form"])

    with tab_funnel:
        render_placeholder(
            "Onboarding funnel",
            f"Parcours onboarding {audience} — contenu à venir.",
        )

    with tab_form:
        render_fiche_form(audience)
