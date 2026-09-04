"""Shared helpers for Booking Resend Streamlit tabs."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

import pandas as pd
import streamlit as st

from booking_jobs import (
    enrich_sequence_status,
    job_status_by_type,
    scheduled_times_from_jobs,
)
from calendly_client import list_all_bookings
from crm_api import render_booking_email
from schedule import format_paris, plan_main_schedule

Category = Literal["agence", "entreprise"]

EMAIL_TYPE_LABELS = {
    "immediate": "Email 1 — Confirmation immédiate",
    "h48_confirm": "Email 2 — 48h avant le RDV",
    "h24_relance": "Email 3 — 24h relance (si non confirmé)",
    "h20_cancel": "Email 4 — H-20 annulation (si non confirmé)",
    "role_seq_48": "Legacy — Intro Hercule",
    "role_seq_24": "Legacy — Relance page temporaire",
}

EMAIL_TYPE_VARS = {
    "immediate": "{{firstNameLine}}, {{date}}, {{heure}}",
    "h48_confirm": "{{firstNameLine}}, {{confirmation_agence_link}} (alias {{confirmUrl}})",
    "h24_relance": "{{firstNameLine}}, {{confirmation_agence_link}} (alias {{confirmUrl}})",
    "h20_cancel": "{{firstNameLine}}, {{date}}, {{heure}}",
    "role_seq_48": "{{firstNameLine}}",
    "role_seq_24": "{{firstNameLine}}, {{confirmLink}}",
}

MAIN_AGENCE_TYPES = ["immediate", "h48_confirm", "h24_relance", "h20_cancel"]
ENTREPRISE_TYPES = ["immediate"]
LEGACY_TEMPLATE_TYPES = ["role_seq_48", "role_seq_24"]

SEQUENCE_STATUS_LABELS = {
    "none": "Non démarrée",
    "started": "En cours",
    "confirmed": "Confirmée",
    "cancelled": "Annulée",
}


def parse_iso_dt(value: str) -> datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=UTC)
        return dt
    except ValueError:
        return None


def format_send_time(iso_value: str | None, fallback: datetime | None) -> str:
    if iso_value:
        parsed = parse_iso_dt(iso_value)
        if parsed:
            return format_paris(parsed)
    return format_paris(fallback)


def job_status_label(status: str) -> str:
    return status or "—"


def build_schedule_columns(row: dict[str, Any], *, category: Category) -> dict[str, str]:
    start_time = str(row.get("start_time") or "")
    lead_id = row.get("lead_id")
    job_times = scheduled_times_from_jobs(str(lead_id)) if lead_id else {}
    job_status = job_status_by_type(str(lead_id)) if lead_id else {}
    plan = plan_main_schedule(start_time, category=category)

    if category == "entreprise":
        return {
            "send_email_1": format_send_time(job_times.get("immediate"), plan["immediate"]),
            "send_email_2": "—",
            "send_email_3": "—",
            "send_email_4": "—",
            "job_email_1": job_status_label(job_status.get("immediate", "")),
            "job_email_2": "—",
            "job_email_3": "—",
            "job_email_4": "—",
        }

    return {
        "send_email_1": format_send_time(job_times.get("immediate"), plan["immediate"]),
        "send_email_2": format_send_time(job_times.get("h48_confirm"), plan["h48_confirm"]),
        "send_email_3": format_send_time(job_times.get("h24_relance"), plan["h24_relance"]),
        "send_email_4": format_send_time(job_times.get("h20_cancel"), plan["h20_cancel"]),
        "job_email_1": job_status_label(job_status.get("immediate", "")),
        "job_email_2": job_status_label(job_status.get("h48_confirm", "")),
        "job_email_3": job_status_label(job_status.get("h24_relance", "")),
        "job_email_4": job_status_label(job_status.get("h20_cancel", "")),
    }


def fetch_bookings() -> list[dict[str, Any]]:
    bookings = list_all_bookings()
    for row in bookings:
        row["sequence_status"] = enrich_sequence_status(row)
    st.session_state.bookings = bookings
    return bookings


def filter_bookings(
    bookings: list[dict[str, Any]],
    *,
    category: Category,
    filter_mode: str = "Toutes",
) -> list[dict[str, Any]]:
    rows = [
        row
        for row in bookings
        if str(row.get("booking_category") or row.get("lead_category") or "agence")
        == category
    ]
    if filter_mode == "Trackées":
        return [row for row in rows if row.get("tracked")]
    if filter_mode == "Non trackées":
        return [row for row in rows if not row.get("tracked")]
    return rows


def display_rendered_email(rendered: dict[str, Any]) -> None:
    st.markdown(f"**Objet :** {rendered.get('subject', '')}")
    st.text(rendered.get("text") or "")
    html = rendered.get("html")
    if html:
        with st.expander("Aperçu HTML (React)", expanded=True):
            st.components.v1.html(html, height=520, scrolling=True)


def fetch_rendered_email(
    *,
    category: Category,
    email_type: str,
    subject: str | None = None,
    body: str | None = None,
    lead_id: str | None = None,
    use_html: bool | None = None,
    sample: bool = False,
) -> dict[str, Any]:
    return render_booking_email(
        category=category,
        email_type=email_type,
        subject=subject,
        body=body,
        lead_id=lead_id,
        use_html=use_html,
        sample=sample or not lead_id,
    )


def render_load_controls(*, key_prefix: str, title: str, category: Category) -> None:
    if "bookings" not in st.session_state:
        st.session_state.bookings = None

    col_load, col_refresh, col_clear = st.columns([1, 1, 3])
    with col_load:
        if st.button("Charger Calendly", type="primary", key=f"{key_prefix}_load"):
            try:
                loaded = fetch_bookings()
                cat_count = len(filter_bookings(loaded, category=category, filter_mode="Toutes"))
                st.success(f"{cat_count} réservation(s) {title.lower()} chargée(s).")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_refresh:
        if st.button("Actualiser", key=f"{key_prefix}_refresh"):
            try:
                loaded = fetch_bookings()
                cat_count = len(filter_bookings(loaded, category=category, filter_mode="Toutes"))
                st.toast(f"{cat_count} réservation(s) {title.lower()} rechargée(s).")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_clear:
        if st.button("Vider la liste", key=f"{key_prefix}_clear"):
            st.session_state.bookings = None
            st.rerun()


def bookings_dataframe(
    filtered: list[dict[str, Any]],
    *,
    category: Category,
) -> pd.DataFrame:
    display_rows = []
    for row in filtered:
        schedule_cols = build_schedule_columns(row, category=category)
        sequence_status = str(row.get("sequence_status") or "none")
        item = {
            "select": False,
            "email": row.get("email") or "",
            "name": row.get("name") or "",
            "company": row.get("company") or "",
            "start_time": row.get("start_time") or "",
            "tracked": "oui" if row.get("tracked") else "non",
            "sequence_status": SEQUENCE_STATUS_LABELS.get(
                sequence_status,
                sequence_status,
            ),
            "send_email_1": schedule_cols["send_email_1"],
            "send_email_2": schedule_cols["send_email_2"],
            "send_email_3": schedule_cols["send_email_3"],
            "send_email_4": schedule_cols["send_email_4"],
            "job_email_1": schedule_cols["job_email_1"],
            "job_email_2": schedule_cols["job_email_2"],
            "job_email_3": schedule_cols["job_email_3"],
            "job_email_4": schedule_cols["job_email_4"],
            "lead_id": row.get("lead_id") or "",
            "_sequence_status_raw": sequence_status,
        }
        display_rows.append(item)
    return pd.DataFrame(display_rows)
