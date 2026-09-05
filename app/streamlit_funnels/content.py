"""Central funnel content router."""

from __future__ import annotations

import streamlit as st

from audiences import AUDIENCE_LABELS, Audience
from components.hub import render_hub
from navigation import breadcrumb, get_children, is_hub, leaf_key
from tabs.dashboard import render_dashboard_tab
from tabs.emails import render_email_leaf
from tabs.legal import render_legal_doc
from tabs.onboarding import render_onboarding_fiche_form, render_onboarding_funnel
from tabs.sales import render_sales_funnel_stage, render_sales_mockup


def render_funnel_content(audience: Audience, path: list[str]) -> None:
    label = AUDIENCE_LABELS[audience]
    st.title(f"Funnels — {label}")
    st.caption(breadcrumb(path))

    if is_hub(path):
        children = get_children(path)
        if len(path) == 1:
            title = "Choisissez un module"
        elif len(path) == 2:
            title = "Choisissez une section"
        else:
            title = "Choisissez une étape"
        render_hub(title, children, key_prefix=f"hub_{'_'.join(path)}")
        return

    key = leaf_key(path)
    if key is None:
        st.error("Section introuvable.")
        return

    _render_leaf(audience, key)


def _render_leaf(audience: Audience, key: str) -> None:
    if key == "dashboard":
        render_dashboard_tab(audience)
    elif key == "sales_funnel_discovery":
        render_sales_funnel_stage(audience, "Discovery")
    elif key == "sales_funnel_pitch":
        render_sales_funnel_stage(audience, "Pitch")
    elif key == "sales_funnel_closing":
        render_sales_funnel_stage(audience, "Closing")
    elif key == "sales_mockup":
        render_sales_mockup(audience)
    elif key == "onboarding_funnel":
        render_onboarding_funnel(audience)
    elif key == "onboarding_fiche_form":
        render_onboarding_fiche_form(audience)
    elif key.startswith("legal_"):
        render_legal_doc(audience, key)
    elif key.startswith("emails_"):
        render_email_leaf(audience, key)
    else:
        st.error(f"Renderer inconnu : {key}")
