"""Historique tab."""

from __future__ import annotations

from datetime import datetime

import pandas as pd
import streamlit as st

from history import EMAIL_TYPE_LABELS as HISTORY_EMAIL_TYPE_LABELS
from history import load_history_rows
from schedule import PARIS_TZ


def render_history_tab() -> None:
    st.subheader("Historique des envois")
    st.caption(
        "Suivi des emails booking : date d'envoi, engagement (ouverture/clic) "
        "et confirmation de présence pour les emails avec lien de confirm."
    )

    col_refresh, col_limit = st.columns([1, 2])
    with col_refresh:
        if st.button("Actualiser l'historique", type="primary", key="history_refresh"):
            st.session_state.history_loaded = True
            st.rerun()
    with col_limit:
        limit = st.number_input(
            "Nombre max de lignes",
            min_value=50,
            max_value=2000,
            value=500,
            step=50,
            key="history_limit",
        )

    f1, f2, f3, f4 = st.columns(4)
    with f1:
        category_filter = st.selectbox(
            "Catégorie",
            ["all", "agence", "entreprise"],
            format_func=lambda v: {
                "all": "Toutes",
                "agence": "Agence",
                "entreprise": "Entreprise",
            }[v],
            key="history_category",
        )
    with f2:
        email_type_options = ["all", *HISTORY_EMAIL_TYPE_LABELS.keys()]
        email_type_filter = st.selectbox(
            "Type email",
            email_type_options,
            format_func=lambda v: "Tous" if v == "all" else HISTORY_EMAIL_TYPE_LABELS.get(v, v),
            key="history_email_type",
        )
    with f3:
        job_status_filter = st.selectbox(
            "Statut envoi",
            ["all", "sent", "pending", "failed", "cancelled"],
            format_func=lambda v: {
                "all": "Tous",
                "sent": "Envoyé",
                "pending": "En attente",
                "failed": "Échec",
                "cancelled": "Annulé",
            }[v],
            key="history_job_status",
        )
    with f4:
        confirm_filter = st.selectbox(
            "Confirmation",
            ["all", "waiting", "confirmed", "na"],
            format_func=lambda v: {
                "all": "Toutes",
                "waiting": "En attente",
                "confirmed": "Confirmé",
                "na": "N/A",
            }[v],
            key="history_confirm_filter",
        )

    f5, f6, f7 = st.columns([2, 1, 1])
    with f5:
        email_search = st.text_input("Rechercher par email", key="history_email_search")
    with f6:
        date_from = st.date_input("Du", value=None, key="history_date_from")
    with f7:
        date_to = st.date_input("Au", value=None, key="history_date_to")

    date_from_dt = (
        datetime.combine(date_from, datetime.min.time()).replace(tzinfo=PARIS_TZ)
        if date_from
        else None
    )
    date_to_dt = (
        datetime.combine(date_to, datetime.max.time()).replace(tzinfo=PARIS_TZ)
        if date_to
        else None
    )

    try:
        rows = load_history_rows(
            limit=int(limit),
            category=category_filter,  # type: ignore[arg-type]
            email_type=None if email_type_filter == "all" else email_type_filter,
            job_status=None if job_status_filter == "all" else job_status_filter,
            confirmation_filter=confirm_filter,  # type: ignore[arg-type]
            email_search=email_search,
            date_from=date_from_dt,
            date_to=date_to_dt,
        )
    except Exception as exc:
        st.error(f"Impossible de charger l'historique : {exc}")
        return

    if not rows:
        st.info("Aucun envoi ne correspond aux filtres.")
        return

    display_cols = [
        "date_envoi",
        "destinataire",
        "prenom",
        "societe",
        "categorie",
        "type_email",
        "statut_envoi",
        "ouvert",
        "clique",
        "repondu",
        "confirmation",
        "rdv_prevu",
        "resend_id",
    ]
    df = pd.DataFrame(rows)[display_cols]
    df.columns = [
        "Date envoi",
        "Destinataire",
        "Prénom",
        "Société",
        "Catégorie",
        "Type email",
        "Statut envoi",
        "Ouvert",
        "Cliqué",
        "Répondu",
        "Confirmation",
        "RDV prévu",
        "Resend ID",
    ]
    st.caption(f"{len(df)} ligne(s) affichée(s).")
    st.dataframe(df, use_container_width=True, hide_index=True)
