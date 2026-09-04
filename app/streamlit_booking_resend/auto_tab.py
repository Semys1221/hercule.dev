"""Auto booking tabs — observation + cancel remaining follow-ups."""

from __future__ import annotations

from typing import Literal

import streamlit as st

from booking_jobs import cancel_pending_followups
from config import settings
from legacy import is_legacy_agence_row
from shared import (
    bookings_dataframe,
    filter_bookings,
    render_load_controls,
)

Category = Literal["agence", "entreprise"]


def render_auto_tab(category: Category) -> None:
    key_prefix = f"auto_{category}"
    title = "Agence" if category == "agence" else "Entreprise"
    booking_link = (
        settings.tracking_base_url_agence
        if category == "agence"
        else settings.tracking_base_url_entreprise
    )

    st.subheader(f"Réservations {title}")
    st.caption(
        f"Booking link : `{booking_link}/{{slug}}` · "
        "Séquence automatique (webhook Calendly + cron). Observation uniquement."
    )

    render_load_controls(key_prefix=key_prefix, title=title, category=category)

    filter_mode = st.radio(
        "Filtrer",
        ["Toutes", "Trackées", "Non trackées"],
        horizontal=True,
        key=f"{key_prefix}_booking_filter",
    )

    bookings = st.session_state.get("bookings")
    if bookings is None:
        st.info("Cliquez sur « Charger Calendly » pour lister les réservations.")
        return

    filtered = filter_bookings(bookings, category=category, filter_mode=filter_mode)
    if category == "agence":
        filtered = [row for row in filtered if row.get("tracked") and not is_legacy_agence_row(row)]

    if not filtered:
        st.success(f"Aucune réservation {title.lower()} auto pour « {filter_mode} ».")
        return

    df = bookings_dataframe(filtered, category=category)
    edited = st.data_editor(
        df,
        column_config={
            "select": st.column_config.CheckboxColumn("Sélection"),
            "lead_id": None,
            "_sequence_status_raw": None,
        },
        disabled=[
            "email",
            "name",
            "company",
            "start_time",
            "tracked",
            "sequence_status",
            "send_email_1",
            "send_email_2",
            "send_email_3",
            "send_email_4",
            "job_email_1",
            "job_email_2",
            "job_email_3",
            "job_email_4",
            "lead_id",
            "_sequence_status_raw",
        ],
        hide_index=True,
        use_container_width=True,
        key=f"{key_prefix}_bookings_editor",
    )

    selected = edited[edited["select"] == True]  # noqa: E712
    st.caption(
        f"{len(selected)} / {len(edited)} sélectionné(s) · "
        "Horaires Europe/Paris · job_email_* = statut en base"
    )

    if category != "agence":
        return

    if st.button("Annuler relances restantes", key=f"{key_prefix}_cancel_followups"):
        if selected.empty:
            st.warning("Sélectionnez au moins une ligne.")
            return
        ok = 0
        errors: list[str] = []
        for _, item in selected.iterrows():
            lead_id = str(item.get("lead_id") or "").strip()
            email = str(item.get("email") or "")
            if not lead_id:
                errors.append(f"{email}: lead manquant")
                continue
            try:
                cancel_pending_followups(lead_id)
                ok += 1
            except Exception as exc:
                errors.append(f"{email}: {exc}")
        if ok:
            st.success(f"Relances annulées pour {ok} lead(s).")
        for err in errors:
            st.error(err)
        if ok:
            st.rerun()
