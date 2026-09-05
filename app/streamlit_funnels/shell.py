"""Workspace chrome and main tab router."""

from __future__ import annotations

import streamlit as st

from audiences import AUDIENCE_LABELS, Audience
from tabs.dashboard import render_dashboard_tab
from tabs.emails import render_emails_tab
from tabs.legal import render_legal_tab
from tabs.onboarding import render_onboarding_tab
from tabs.sales import render_sales_tab


def render_workspace(audience: Audience) -> None:
    label = AUDIENCE_LABELS[audience]

    header_col, back_col = st.columns([5, 1])
    with header_col:
        st.title(f"Funnels — {label}")
        st.caption(f"Funnels › {label}")
    with back_col:
        if st.button("← Retour", key="funnel_back", use_container_width=True):
            st.session_state["funnel_view"] = "landing"
            st.rerun()

    tab_sales, tab_onboarding, tab_dashboard, tab_legal, tab_emails = st.tabs(
        ["Sales", "Onboarding", "Dashboard", "CVG & légal", "Emails"]
    )

    with tab_sales:
        render_sales_tab(audience)

    with tab_onboarding:
        render_onboarding_tab(audience)

    with tab_dashboard:
        render_dashboard_tab(audience)

    with tab_legal:
        render_legal_tab(audience)

    with tab_emails:
        render_emails_tab(audience)
