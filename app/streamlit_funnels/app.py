"""Funnels — unified internal cockpit for agence and entreprise."""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parents[1]
_CRM_DIR = _REPO_ROOT / "crm"
_DEMANDS_DIR = _REPO_ROOT / "app" / "streamlit_demands"

for path in (_REPO_ROOT, _APP_DIR, _CRM_DIR, _DEMANDS_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

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
