"""Dashboard tab."""

from __future__ import annotations

from audiences import Audience
from components.placeholder import render_placeholder


def render_dashboard_tab(audience: Audience) -> None:
    render_placeholder(
        "Dashboard KPIs",
        f"KPIs funnel à venir — conversion discovery → closing → booked ({audience}).",
    )
