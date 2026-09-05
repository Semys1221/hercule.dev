"""Landing page with agence / entreprise cards."""

from __future__ import annotations

import streamlit as st

from audiences import AUDIENCE_CAPTIONS, AUDIENCE_ICONS, AUDIENCE_LABELS, Audience
from navigation import init_workspace_path


def render_landing() -> None:
    st.title("Funnels")
    st.caption("Cockpit interne — sélectionnez une audience pour accéder aux onglets Sales, Onboarding, Dashboard, CVG et Emails.")

    col_agence, col_entreprise = st.columns(2)

    with col_agence:
        _render_card("agence", col_agence)

    with col_entreprise:
        _render_card("entreprise", col_entreprise)


def _render_card(audience: Audience, column: st.delta_generator.DeltaGenerator) -> None:
    label = AUDIENCE_LABELS[audience]
    icon = AUDIENCE_ICONS[audience]
    caption = AUDIENCE_CAPTIONS[audience]

    with column.container(border=True):
        st.markdown(f"### {icon} {label}")
        st.caption(caption)
        if st.button(f"Ouvrir {label}", key=f"landing_{audience}", use_container_width=True, type="primary"):
            st.session_state["funnel_audience"] = audience
            st.session_state["funnel_view"] = "workspace"
            init_workspace_path(audience)
            st.rerun()
