"""Emails tab."""

from __future__ import annotations

import streamlit as st

from audiences import Audience
from components.placeholder import render_placeholder

PRE_CLOSE_TABS = {
    "Outreach": "npm run streamlit-scraper",
    "Subsequence": "npm run streamlit-subsequence",
    "Reply prompt": "npm run streamlit-reply-agent",
    "Booking": "npm run streamlit-booking-resend",
}

CLOSE_TABS = {
    "Onboarding": "booking-communication / séquences post-signature (à venir)",
    "Notifications": "matching / post-RDV notifications (à venir)",
}


def render_emails_tab(audience: Audience) -> None:
    phase = st.sidebar.radio(
        "Phase email",
        options=["PRE-CLOSE", "CLOSE"],
        key=f"emails_phase_{audience}",
        horizontal=True,
    )

    if phase == "PRE-CLOSE":
        _render_phase(audience, PRE_CLOSE_TABS, phase)
    else:
        _render_phase(audience, CLOSE_TABS, phase)


def _render_phase(audience: Audience, tabs: dict[str, str], phase: str) -> None:
    labels = list(tabs.keys())
    selected = st.radio(
        "Sous-section",
        options=labels,
        key=f"emails_sub_{phase}_{audience}",
        horizontal=True,
    )
    tool_hint = tabs[selected]
    render_placeholder(
        f"Emails — {phase} — {selected}",
        f"Shell {audience}. Outil associé : `{tool_hint}`.",
    )
