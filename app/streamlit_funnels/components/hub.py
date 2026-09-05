"""Hub card grid for funnel navigation."""

from __future__ import annotations

import streamlit as st

from navigation import NavNode, navigate_append


def render_hub(title: str, children: dict[str, NavNode], *, key_prefix: str) -> None:
    if not children:
        st.warning("Aucune section disponible.")
        return

    st.subheader(title)
    items = list(children.items())
    cols = st.columns(min(len(items), 3))

    for index, (node_id, node) in enumerate(items):
        with cols[index % len(cols)]:
            with st.container(border=True):
                st.markdown(f"### {node.label}")
                if node.caption:
                    st.caption(node.caption)
                if st.button(
                    f"Ouvrir {node.label}",
                    key=f"{key_prefix}_{node_id}",
                    use_container_width=True,
                    type="primary",
                ):
                    navigate_append(node_id)
