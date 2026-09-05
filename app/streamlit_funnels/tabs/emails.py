"""Emails leaf renderers."""

from __future__ import annotations

from audiences import Audience
from components.placeholder import render_placeholder

EMAIL_TOOL_HINTS: dict[str, str] = {
    "emails_pre_close_outreach": "npm run streamlit-scraper",
    "emails_pre_close_subsequence": "npm run streamlit-subsequence",
    "emails_pre_close_reply_prompt": "npm run streamlit-reply-agent",
    "emails_pre_close_booking": "npm run streamlit-booking-resend",
    "emails_close_onboarding": "booking-communication / séquences post-signature (à venir)",
    "emails_close_notifications": "matching / post-RDV notifications (à venir)",
}

EMAIL_TITLES: dict[str, str] = {
    "emails_pre_close_outreach": "Emails — PRE-CLOSE — Outreach",
    "emails_pre_close_subsequence": "Emails — PRE-CLOSE — Subsequence",
    "emails_pre_close_reply_prompt": "Emails — PRE-CLOSE — Reply prompt",
    "emails_pre_close_booking": "Emails — PRE-CLOSE — Booking",
    "emails_close_onboarding": "Emails — CLOSE — Onboarding",
    "emails_close_notifications": "Emails — CLOSE — Notifications",
}


def render_email_leaf(audience: Audience, leaf: str) -> None:
    title = EMAIL_TITLES.get(leaf, leaf)
    tool_hint = EMAIL_TOOL_HINTS.get(leaf, "à venir")
    render_placeholder(title, f"Shell {audience}. Outil associé : `{tool_hint}`.")
