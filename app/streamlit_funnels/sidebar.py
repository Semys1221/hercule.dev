"""Sidebar navigation with cascading dropdowns."""

from __future__ import annotations

import streamlit as st

from audiences import AUDIENCE_LABELS, Audience
from navigation import (
    child_options,
    get_path,
    go_home,
    module_options,
    navigate_back,
    navigate_to,
    path_for_sidebar,
)


def render_sidebar(audience: Audience) -> Audience:
    st.sidebar.header("Navigation")

    audience_labels = {aud: AUDIENCE_LABELS[aud] for aud in ("agence", "entreprise")}
    selected_audience: Audience = st.sidebar.selectbox(
        "Audience",
        options=["agence", "entreprise"],
        index=0 if audience == "agence" else 1,
        format_func=lambda value: audience_labels[value],
        key="sidebar_audience",
    )

    if selected_audience != audience:
        navigate_to([selected_audience])

    current_path = get_path(selected_audience)

    module_id: str | None = None
    section_id: str | None = None
    step_id: str | None = None

    if len(current_path) >= 2:
        modules = module_options()
        module_ids = [item[0] for item in modules]
        module_id = st.sidebar.selectbox(
            "Module",
            options=module_ids,
            index=module_ids.index(current_path[1]) if current_path[1] in module_ids else 0,
            format_func=lambda value: next(label for mid, label in modules if mid == value),
            key="sidebar_module",
        )

    if len(current_path) >= 3 and module_id:
        section_path = path_for_sidebar(selected_audience, module_id, None, None)
        section_children = child_options(section_path)
        if section_children:
            section_ids = [item[0] for item in section_children]
            section_id = st.sidebar.selectbox(
                "Section",
                options=section_ids,
                index=section_ids.index(current_path[2]) if current_path[2] in section_ids else 0,
                format_func=lambda value: next(
                    label for sid, label in section_children if sid == value
                ),
                key="sidebar_section",
            )

    if len(current_path) >= 4 and module_id and section_id:
        step_path = path_for_sidebar(selected_audience, module_id, section_id, None)
        step_children = child_options(step_path)
        if step_children:
            step_ids = [item[0] for item in step_children]
            step_id = st.sidebar.selectbox(
                "Étape",
                options=step_ids,
                index=step_ids.index(current_path[3]) if current_path[3] in step_ids else 0,
                format_func=lambda value: next(
                    label for tid, label in step_children if tid == value
                ),
                key="sidebar_step",
            )

    target_path = path_for_sidebar(selected_audience, module_id, section_id, step_id)
    if target_path != current_path:
        navigate_to(target_path)

    st.sidebar.divider()
    if st.sidebar.button("← Retour", key="sidebar_back", use_container_width=True):
        navigate_back(selected_audience)
    if st.sidebar.button("Accueil", key="sidebar_home", use_container_width=True):
        go_home()

    return selected_audience
