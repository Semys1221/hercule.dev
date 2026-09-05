"""Funnels — unified internal cockpit for agence and entreprise."""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parents[1]
_CRM_DIR = _REPO_ROOT / "crm"
_DEMANDS_DIR = _REPO_ROOT / "app" / "streamlit_demands"

# streamlit_demands/config.py shadows crm/config.py if both are on sys.path.
_blocked = {str(_DEMANDS_DIR)}
sys.path[:] = [entry for entry in sys.path if entry not in _blocked]

for path in (_APP_DIR, _CRM_DIR):
    path_str = str(path)
    if path_str in sys.path:
        sys.path.remove(path_str)
    sys.path.insert(0, path_str)

from landing import render_landing
from shell import render_workspace

st.set_page_config(page_title="Funnels", layout="wide", page_icon="🔀")

if "funnel_view" not in st.session_state:
    st.session_state["funnel_view"] = "landing"

if st.session_state["funnel_view"] == "landing":
    render_landing()
else:
    audience = st.session_state.get("funnel_audience", "agence")
    render_workspace(audience)
