"""Booking Resend — Calendly reservations + Resend email sequences."""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parents[1]
_CRM_DIR = _REPO_ROOT / "crm"

for path in (_APP_DIR, _CRM_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from auto_tab import render_auto_tab  # noqa: E402
from config import _env, env_source_label, settings  # noqa: E402
from history_tab import render_history_tab  # noqa: E402
from legacy import go_live_at  # noqa: E402
from legacy_tab import render_legacy_tab  # noqa: E402
from templates_ui import render_templates_tab  # noqa: E402

st.set_page_config(page_title="Booking Resend", layout="wide")
st.title("Booking Resend")
st.caption(
    "Séquence auto pour les nouvelles réservations. "
    "Les bookings agence antérieurs au go-live sont dans Agence Legacy."
)

tab_seq, tab_agence, tab_legacy, tab_entreprise, tab_historique = st.tabs(
    [
        "Séquences",
        "Réservations Agence",
        "Agence Legacy",
        "Réservations Entreprise",
        "Historique",
    ]
)

with tab_seq:
    render_templates_tab()

with tab_agence:
    render_auto_tab("agence")

with tab_legacy:
    render_legacy_tab()

with tab_entreprise:
    render_auto_tab("entreprise")

with tab_historique:
    render_history_tab()

with st.sidebar:
    st.header("Status")
    st.caption(f"Env: `{env_source_label()}`")
    st.caption(f"Backend: `{settings.crm_backend_url}`")
    st.caption(f"Go-live: `{go_live_at().isoformat()}`")
    if not _env("CALENDLY_API_TOKEN"):
        st.warning("CALENDLY_API_TOKEN manquant")
    if not _env("RESEND_API_KEY"):
        st.warning("RESEND_API_KEY manquant (tests email)")
