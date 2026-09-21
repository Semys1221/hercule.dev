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
from legacy import is_legacy_agence_row
from schedule import format_paris, plan_main_schedule
from send_window import apply_send_window_preview

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
    "h48_confirm": "{{firstNameLine}}, {{confirmation_agence_link}} (alias {{confirmUrl}}) · entreprise: {{post_booking_link}}",
    "h24_relance": "{{firstNameLine}}, {{confirmation_agence_link}} (alias {{confirmUrl}}) · entreprise: {{date}}, {{heure}}",
    "h20_cancel": "{{firstNameLine}}, {{date}}, {{heure}}",
    "role_seq_48": "{{firstNameLine}}",
    "role_seq_24": "{{firstNameLine}}, {{confirmLink}}",
}

MAIN_AGENCE_TYPES = ["immediate", "h48_confirm", "h24_relance", "h20_cancel"]
ENTREPRISE_TYPES = ["immediate", "h48_confirm", "h24_relance"]
ENTREPRISE_EMAIL_TYPE_LABELS = {
    "immediate": "Email 1 — Confirmation immédiate",
    "h48_confirm": "Email 2 — 48h avant le RDV (préparation)",
    "h24_relance": "Email 3 — 24h rappel",
}
LEGACY_TEMPLATE_TYPES = ["role_seq_48", "role_seq_24"]

SEQUENCE_STATUS_LABELS = {
    "none": "Non démarrée",
    "started": "En cours",
    "confirmed": "Confirmée",
    "cancelled": "Annulée",
}

BOOKING_LINK_COLUMN_CONFIG = {
    "select": st.column_config.CheckboxColumn("Sélection"),
    "lead_email": st.column_config.TextColumn(
        "Email lead (Supabase)",
        help="Renseigné quand l'email Calendly diffère de l'email du lead en base.",
    ),
    "calendly_join_url": st.column_config.LinkColumn(
        "Rejoindre la réunion",
        display_text="Ouvrir",
    ),
    "calendly_reschedule_url": st.column_config.LinkColumn(
        "Replanifier la réunion",
        display_text="Ouvrir",
    ),
    "calendly_cancel_url": st.column_config.LinkColumn(
        "Annuler la réunion",
        display_text="Ouvrir",
    ),
    "lead_id": None,
    "_sequence_status_raw": None,
}

BOOKING_TABLE_DISABLED_COLUMNS = [
    "email",
    "lead_email",
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
    "calendly_join_url",
    "calendly_reschedule_url",
    "calendly_cancel_url",
    "lead_id",
    "_sequence_status_raw",
]


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


def format_send_time(
    iso_value: str | None,
    fallback: datetime | None,
    *,
    email_type: str | None = None,
) -> str:
    parsed: datetime | None = None
    if iso_value:
        parsed = parse_iso_dt(iso_value)
    if parsed is None:
        parsed = fallback
    if parsed is not None and email_type:
        parsed = apply_send_window_preview(email_type, parsed)
    return format_paris(parsed)


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
            "send_email_1": format_send_time(
                job_times.get("immediate"), plan["immediate"], email_type="immediate"
            ),
            "send_email_2": format_send_time(
                job_times.get("h48_confirm"), plan["h48_confirm"], email_type="h48_confirm"
            ),
            "send_email_3": format_send_time(
                job_times.get("h24_relance"), plan["h24_relance"], email_type="h24_relance"
            ),
            "send_email_4": "—",
            "job_email_1": job_status_label(job_status.get("immediate", "")),
            "job_email_2": job_status_label(job_status.get("h48_confirm", "")),
            "job_email_3": job_status_label(job_status.get("h24_relance", "")),
            "job_email_4": "—",
        }

    return {
        "send_email_1": format_send_time(
            job_times.get("immediate"), plan["immediate"], email_type="immediate"
        ),
        "send_email_2": format_send_time(
            job_times.get("h48_confirm"), plan["h48_confirm"], email_type="h48_confirm"
        ),
        "send_email_3": format_send_time(
            job_times.get("h24_relance"), plan["h24_relance"], email_type="h24_relance"
        ),
        "send_email_4": format_send_time(
            job_times.get("h20_cancel"), plan["h20_cancel"], email_type="h20_cancel"
        ),
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


def booking_filter_stats(
    bookings: list[dict[str, Any]],
    *,
    category: Category,
) -> dict[str, int]:
    rows = filter_bookings(bookings, category=category, filter_mode="Toutes")
    tracked = sum(1 for row in rows if row.get("tracked"))
    if category == "agence":
        legacy = sum(1 for row in rows if is_legacy_agence_row(row))
        auto_eligible = sum(
            1 for row in rows if not is_legacy_agence_row(row)
        )
    else:
        legacy = 0
        auto_eligible = len(rows)
    return {
        "total": len(rows),
        "tracked": tracked,
        "untracked": len(rows) - tracked,
        "legacy": legacy,
        "auto_eligible": auto_eligible,
    }


def format_booking_stats_message(
    stats: dict[str, int],
    *,
    category: Category,
    filter_mode: str | None = None,
    empty: bool = False,
) -> str:
    title = "agence" if category == "agence" else "entreprise"
    parts = [f"{stats['total']} réservation(s) {title} chargée(s)"]
    if category == "agence" and stats["legacy"]:
        parts.append(f"{stats['legacy']} legacy (onglet Agence Legacy)")
    if stats["untracked"]:
        parts.append(f"{stats['untracked']} non trackée(s)")
    if category == "agence":
        parts.append(f"{stats['auto_eligible']} éligible(s) auto")
    else:
        parts.append(f"{stats['auto_eligible']} au total")
    message = " : ".join([parts[0], ", ".join(parts[1:])]) if len(parts) > 1 else parts[0]
    if empty and filter_mode:
        message += f" — aucune pour le filtre « {filter_mode} »"
    return message


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
                stats = booking_filter_stats(loaded, category=category)
                st.success(format_booking_stats_message(stats, category=category))
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_refresh:
        if st.button("Actualiser", key=f"{key_prefix}_refresh"):
            try:
                loaded = fetch_bookings()
                stats = booking_filter_stats(loaded, category=category)
                st.toast(format_booking_stats_message(stats, category=category))
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_clear:
        if st.button("Vider la liste", key=f"{key_prefix}_clear"):
            st.session_state.bookings = None
            st.rerun()


def _link_cell(value: object) -> str:
    text = str(value or "").strip()
    if not text or text.lower() == "none":
        return ""
    return text


def bookings_dataframe(
    filtered: list[dict[str, Any]],
    *,
    category: Category,
) -> pd.DataFrame:
    display_rows = []
    for row in filtered:
        schedule_cols = build_schedule_columns(row, category=category)
        sequence_status = str(row.get("sequence_status") or "none")
        lead_email = str(row.get("lead_email") or "").strip()
        item = {
            "select": False,
            "email": row.get("email") or "",
            "lead_email": lead_email,
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
            "calendly_join_url": _link_cell(row.get("calendly_join_url")),
            "calendly_reschedule_url": _link_cell(row.get("calendly_reschedule_url")),
            "calendly_cancel_url": _link_cell(row.get("calendly_cancel_url")),
            "lead_id": row.get("lead_id") or "",
            "_sequence_status_raw": sequence_status,
        }
        display_rows.append(item)
    return pd.DataFrame(display_rows)
