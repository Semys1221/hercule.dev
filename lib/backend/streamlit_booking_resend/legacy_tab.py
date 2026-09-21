"""Agence Legacy — manual Intro + Relance (no template editing)."""

from __future__ import annotations

import streamlit as st

from booking_templates import default_use_html
from config import settings
from crm_api import send_booking_email_once
from legacy import (
    RELANCE_OPTIONS,
    RELANCE_STANDARD,
    email_type_for_legacy_slot,
    is_legacy_agence_row,
)
from shared import (
    BOOKING_LINK_COLUMN_CONFIG,
    BOOKING_TABLE_DISABLED_COLUMNS,
    EMAIL_TYPE_LABELS,
    bookings_dataframe,
    display_rendered_email,
    fetch_rendered_email,
    filter_bookings,
    render_load_controls,
)


def render_legacy_tab() -> None:
    key_prefix = "legacy_agence"
    st.subheader("Agence Legacy")
    st.caption(
        f"Bookings agence avant le go-live · `{settings.tracking_base_url_agence}/{{slug}}`. "
        "Hors séquence auto. Envoi manuel uniquement — templates dans l'onglet Séquences."
    )

    render_load_controls(key_prefix=key_prefix, title="Agence Legacy", category="agence")

    bookings = st.session_state.get("bookings")
    if bookings is None:
        st.info("Cliquez sur « Charger Calendly » pour lister les réservations.")
        return

    filtered = [
        row
        for row in filter_bookings(bookings, category="agence", filter_mode="Trackées")
        if is_legacy_agence_row(row)
    ]
    if not filtered:
        st.success("Aucun booking legacy (agence trackée avant le go-live).")
        return

    df = bookings_dataframe(filtered, category="agence")
    edited = st.data_editor(
        df,
        column_config=BOOKING_LINK_COLUMN_CONFIG,
        disabled=BOOKING_TABLE_DISABLED_COLUMNS,
        hide_index=True,
        use_container_width=True,
        key=f"{key_prefix}_bookings_editor",
    )

    selected = edited[edited["select"] == True]  # noqa: E712
    st.caption(f"{len(selected)} / {len(edited)} sélectionné(s)")

    slot = st.radio(
        "Email à envoyer",
        ["intro", "relance"],
        format_func=lambda value: (
            "Intro Hercule" if value == "intro" else "Relance confirmation"
        ),
        horizontal=True,
        key=f"{key_prefix}_slot",
    )
    relance_variant = RELANCE_STANDARD
    if slot == "relance":
        relance_variant = st.radio(
            "Lien de relance",
            list(RELANCE_OPTIONS.keys()),
            format_func=lambda value: RELANCE_OPTIONS[value],
            key=f"{key_prefix}_relance_variant",
        )

    email_type = email_type_for_legacy_slot(slot, relance_variant)
    st.caption(f"Template : {EMAIL_TYPE_LABELS.get(email_type, email_type)}")

    if selected.empty:
        st.info("Sélectionnez un lead pour prévisualiser ou envoyer.")
        return

    first = selected.iloc[0]
    lead_id = str(first.get("lead_id") or "").strip()
    if not lead_id:
        st.warning("Lead non provisionné.")
        return

    col_preview, col_send = st.columns(2)
    with col_preview:
        if st.button("Aperçu", key=f"{key_prefix}_preview"):
            try:
                rendered = fetch_rendered_email(
                    category="agence",
                    email_type=email_type,
                    lead_id=lead_id,
                    use_html=default_use_html(email_type),
                    sample=False,
                )
                display_rendered_email(rendered)
            except Exception as exc:
                st.error(str(exc))
    with col_send:
        if st.button("Envoyer maintenant", type="primary", key=f"{key_prefix}_send"):
            ok = 0
            errors: list[str] = []
            for _, item in selected.iterrows():
                item_lead_id = str(item.get("lead_id") or "").strip()
                email = str(item.get("email") or "")
                if not item_lead_id:
                    errors.append(f"{email}: lead manquant")
                    continue
                try:
                    result = send_booking_email_once(
                        lead_id=item_lead_id,
                        category="agence",
                        email_type=email_type,
                        use_html=default_use_html(email_type),
                    )
                    ok += 1
                    st.success(
                        f"{email} : envoyé "
                        f"(Resend id: {result.get('resend_email_id', '—')})"
                    )
                except Exception as exc:
                    errors.append(f"{email}: {exc}")
            if ok:
                st.success(f"{ok} email(s) envoyé(s).")
            for err in errors:
                st.error(err)
            if ok:
                st.rerun()
