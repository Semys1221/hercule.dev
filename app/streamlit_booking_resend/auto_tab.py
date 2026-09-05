"""Auto booking tabs — observation + cancel remaining follow-ups."""

from __future__ import annotations

from typing import Literal

import streamlit as st

from booking_jobs import cancel_pending_followups
from config import settings
from legacy import is_legacy_agence_row
from shared import (
    BOOKING_LINK_COLUMN_CONFIG,
    BOOKING_TABLE_DISABLED_COLUMNS,
    booking_filter_stats,
    bookings_dataframe,
    filter_bookings,
    format_booking_stats_message,
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
        filtered = [row for row in filtered if not is_legacy_agence_row(row)]

    if not filtered:
        stats = booking_filter_stats(bookings, category=category)
        st.info(
            format_booking_stats_message(
                stats,
                category=category,
                filter_mode=filter_mode,
                empty=True,
            )
        )
        return

    df = bookings_dataframe(filtered, category=category)
    edited = st.data_editor(
        df,
        column_config=BOOKING_LINK_COLUMN_CONFIG,
        disabled=BOOKING_TABLE_DISABLED_COLUMNS,
        hide_index=True,
        use_container_width=True,
        key=f"{key_prefix}_bookings_editor",
    )

    selected = edited[edited["select"] == True]  # noqa: E712
    st.caption(
        f"{len(selected)} / {len(edited)} sélectionné(s) · "
        "Horaires Europe/Paris · job_email_* = statut en base · "
        "liens Calendly = colonnes Rejoindre / Replanifier / Annuler"
    )

    if category != "agence" and category != "entreprise":
        return

    button_label = (
        "Annuler relances restantes"
        if category == "agence"
        else "Annuler relances restantes (H-48 / H-24)"
    )
    if st.button(button_label, key=f"{key_prefix}_cancel_followups"):
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
