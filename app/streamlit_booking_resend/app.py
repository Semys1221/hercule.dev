"""Booking Resend — Calendly reservations + Resend email sequences."""

from __future__ import annotations

import re
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

import pandas as pd
import streamlit as st

_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parents[1]
_CRM_DIR = _REPO_ROOT / "crm"

for path in (_APP_DIR, _CRM_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from booking_jobs import (  # noqa: E402
    enrich_sequence_status,
    job_status_by_type,
    scheduled_times_from_jobs,
)
from booking_templates import list_templates, send_test_email, upsert_templates  # noqa: E402
from calendly_client import list_all_bookings  # noqa: E402
from config import _env, env_source_label, settings, temporary_base_url_for  # noqa: E402
from crm_api import start_booking_sequence, start_role_recovery_sequence  # noqa: E402
from schedule import (  # noqa: E402
    format_paris,
    plan_main_schedule,
    plan_role_recovery_schedule,
)
from slug import build_confirm_url  # noqa: E402
from supabase_repo import get_client, provision_or_update_role_recovery_lead  # noqa: E402

Category = Literal["agence", "entreprise"]

EMAIL_TYPE_LABELS = {
    "immediate": "Email 1 — Confirmation immédiate",
    "h48_confirm": "Email 2 — 48h avant le RDV",
    "h24_relance": "Email 3 — 24h relance (si non confirmé)",
    "h20_cancel": "Email 4 — H-20 annulation (si non confirmé)",
    "role_seq_48": "Role recovery — Email 1 (48h avant, 8h Paris)",
    "role_seq_24": "Role recovery — Email 2 (24h avant, lien consulter)",
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
ROLE_RECOVERY_TYPES = ["role_seq_48", "role_seq_24"]

SEQUENCE_TYPE_LABELS = {
    "main": "Principale (immédiat + H-48/H-24/H-20)",
    "role_recovery": "Role recovery (2 emails)",
}

SEQUENCE_STATUS_LABELS = {
    "none": "Non démarrée",
    "started": "En cours",
    "confirmed": "Confirmée",
    "cancelled": "Annulée",
}


def _parse_iso_dt(value: str) -> datetime | None:
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


def _format_send_time(iso_value: str | None, fallback: datetime | None) -> str:
    if iso_value:
        parsed = _parse_iso_dt(iso_value)
        if parsed:
            return format_paris(parsed)
    return format_paris(fallback)


def _job_status_label(status: str) -> str:
    if not status:
        return "—"
    return status


def _build_schedule_columns(row: dict, *, category: Category) -> dict[str, str]:
    start_time = str(row.get("start_time") or "")
    sequence_type = row.get("sequence_type")
    lead_id = row.get("lead_id")
    job_times = scheduled_times_from_jobs(str(lead_id)) if lead_id else {}
    job_status = job_status_by_type(str(lead_id)) if lead_id else {}

    if sequence_type == "role_recovery" and category == "agence":
        plan = plan_role_recovery_schedule(start_time)
        compressed = "oui (10 min)" if plan["compressed"] else "non"
        return {
            "send_email_1": _format_send_time(
                job_times.get("role_seq_48"),
                plan["role_seq_48"],
            ),
            "send_email_2": _format_send_time(
                job_times.get("role_seq_24"),
                plan["role_seq_24"],
            ),
            "send_email_3": "—",
            "send_email_4": "—",
            "job_email_1": _job_status_label(job_status.get("role_seq_48", "")),
            "job_email_2": _job_status_label(job_status.get("role_seq_24", "")),
            "job_email_3": "—",
            "job_email_4": "—",
            "compressed": compressed,
        }

    plan = plan_main_schedule(start_time, category=category)
    if category == "entreprise":
        return {
            "send_email_1": _format_send_time(
                job_times.get("immediate"),
                plan["immediate"],
            ),
            "send_email_2": "—",
            "send_email_3": "—",
            "send_email_4": "—",
            "job_email_1": _job_status_label(job_status.get("immediate", "")),
            "job_email_2": "—",
            "job_email_3": "—",
            "job_email_4": "—",
            "compressed": "—",
        }

    return {
        "send_email_1": _format_send_time(
            job_times.get("immediate"),
            plan["immediate"],
        ),
        "send_email_2": _format_send_time(
            job_times.get("h48_confirm"),
            plan["h48_confirm"],
        ),
        "send_email_3": _format_send_time(
            job_times.get("h24_relance"),
            plan["h24_relance"],
        ),
        "send_email_4": _format_send_time(
            job_times.get("h20_cancel"),
            plan["h20_cancel"],
        ),
        "job_email_1": _job_status_label(job_status.get("immediate", "")),
        "job_email_2": _job_status_label(job_status.get("h48_confirm", "")),
        "job_email_3": _job_status_label(job_status.get("h24_relance", "")),
        "job_email_4": _job_status_label(job_status.get("h20_cancel", "")),
        "compressed": "—",
    }


def _fetch_bookings() -> list[dict]:
    bookings = list_all_bookings()
    for row in bookings:
        row["sequence_status"] = enrich_sequence_status(row)
    st.session_state.bookings = bookings
    return bookings


def _filter_bookings(
    bookings: list[dict],
    *,
    category: Category,
    filter_mode: str,
) -> list[dict]:
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


def _render_template(template: str, vars_map: dict[str, str]) -> str:
    return re.sub(
        r"\{\{(\w+)\}\}",
        lambda match: vars_map.get(match.group(1), ""),
        template,
    )


def _preview_email_template(
    email_type: str,
    subject: str,
    body: str,
) -> tuple[str, str]:
    sample_date = "mercredi 10 septembre 2026"
    sample_heure = "09:00"
    sample_confirm = (
        "https://www.hercule.dev/confirm-reservation.html"
        "/exemple-slug?email=jean@example.com"
    )
    first_name_line = "Bonjour Jean," if email_type == "immediate" else "Jean,"
    vars_map = {
        "firstNameLine": first_name_line,
        "date": sample_date,
        "heure": sample_heure,
        "confirmUrl": sample_confirm,
        "confirmation_agence_link": sample_confirm,
    }
    return (
        _render_template(subject, vars_map),
        _render_template(body, vars_map),
    )


def _render_templates_editor(category: Category, key_prefix: str) -> None:
    st.subheader("Modèles email")
    st.caption("Édition inline des templates Resend pour cette catégorie.")
    if category == "entreprise":
        st.info("Entreprise : seul l'email immédiat est envoyé après réservation.")

    test_to = st.text_input(
        "Email de test",
        value="nanguy29@gmail.com",
        key=f"{key_prefix}_email_test_to",
    )
    cache_key = f"email_templates_{category}"
    if st.button("Recharger les modèles", key=f"{key_prefix}_reload_templates"):
        st.session_state.pop(cache_key, None)
        st.rerun()

    if cache_key not in st.session_state:
        try:
            st.session_state[cache_key] = list_templates(category)  # type: ignore[arg-type]
        except Exception as exc:
            st.error(f"Impossible de charger les modèles : {exc}")
            st.session_state[cache_key] = []

    templates = st.session_state.get(cache_key) or []
    visible_types = {"immediate"} if category == "entreprise" else None
    if not templates:
        st.info("Aucun modèle chargé. Vérifiez la connexion Supabase.")
        return

    edited_templates: list[dict[str, str]] = []
    for template in templates:
        email_type = template.get("email_type", "")
        if visible_types is not None and email_type not in visible_types:
            continue
        label = EMAIL_TYPE_LABELS.get(email_type, email_type)
        with st.expander(label, expanded=email_type == "immediate"):
            st.caption(f"Variables : {EMAIL_TYPE_VARS.get(email_type, '')}")
            subject = st.text_input(
                "Objet",
                value=template.get("subject") or "",
                key=f"{key_prefix}_subject_{email_type}",
            )
            body = st.text_area(
                "Corps (texte brut)",
                value=template.get("body") or "",
                height=220,
                key=f"{key_prefix}_body_{email_type}",
            )
            col_preview, col_test = st.columns(2)
            with col_preview:
                if st.button("Aperçu", key=f"{key_prefix}_preview_{email_type}"):
                    preview_subject, preview_body = _preview_email_template(
                        email_type,
                        subject,
                        body,
                    )
                    st.markdown(f"**Objet :** {preview_subject}")
                    st.text(preview_body)
            with col_test:
                if st.button("Envoyer test", key=f"{key_prefix}_test_{email_type}"):
                    try:
                        result = send_test_email(
                            to=test_to.strip() or "nanguy29@gmail.com",
                            category=category,  # type: ignore[arg-type]
                            email_type=email_type,
                            subject=subject,
                            body=body,
                        )
                        st.success(
                            f"Test envoyé à {result.get('to', test_to)} "
                            f"(Resend id: {result.get('resend_email_id', '—')})"
                        )
                    except Exception as exc:
                        st.error(str(exc))
            edited_templates.append(
                {
                    "email_type": email_type,
                    "subject": subject,
                    "body": body,
                }
            )

    if st.button(
        "Enregistrer les modèles",
        type="primary",
        key=f"{key_prefix}_save_templates",
    ):
        try:
            upsert_templates(category, edited_templates)  # type: ignore[arg-type]
            st.session_state.pop(cache_key, None)
            st.success(f"Modèles enregistrés pour `{category}`.")
            st.rerun()
        except Exception as exc:
            st.error(str(exc))


def _resolve_email_types_for_send(
    *,
    category: Category,
    sequence_type: str,
    send_mode: str,
    main_selected: list[str],
    role_selected: list[str],
    entreprise_immediate: bool,
) -> tuple[list[str] | None, bool]:
    if send_mode == "Séquence complète":
        return None, False

    if category == "entreprise":
        return (["immediate"] if entreprise_immediate else []), True

    if sequence_type == "role_recovery":
        return role_selected, True

    return main_selected, True


def _render_category_tab(category: Category) -> None:
    key_prefix = category
    title = "Agence" if category == "agence" else "Entreprise"
    booking_link = (
        settings.tracking_base_url_agence
        if category == "agence"
        else settings.tracking_base_url_entreprise
    )

    st.subheader(f"Réservations {title}")
    st.caption(
        f"Booking link : `{booking_link}/{{slug}}` · "
        "Charge les RDV Calendly, envoie un ou plusieurs emails Resend."
    )

    if "bookings" not in st.session_state:
        st.session_state.bookings = None

    filter_mode = st.radio(
        "Filtrer",
        ["Toutes", "Trackées", "Non trackées"],
        horizontal=True,
        key=f"{key_prefix}_booking_filter",
    )

    col_load, col_refresh, col_clear = st.columns([1, 1, 3])
    with col_load:
        if st.button("Charger Calendly", type="primary", key=f"{key_prefix}_load"):
            try:
                loaded = _fetch_bookings()
                cat_count = len(_filter_bookings(loaded, category=category, filter_mode="Toutes"))
                st.success(f"{cat_count} réservation(s) {title.lower()} chargée(s).")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_refresh:
        if st.button("Actualiser", key=f"{key_prefix}_refresh"):
            try:
                loaded = _fetch_bookings()
                cat_count = len(_filter_bookings(loaded, category=category, filter_mode="Toutes"))
                st.toast(f"{cat_count} réservation(s) {title.lower()} rechargée(s).")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_clear:
        if st.button("Vider la liste", key=f"{key_prefix}_clear"):
            st.session_state.bookings = None
            st.rerun()

    bookings = st.session_state.bookings
    if bookings is None:
        st.info("Cliquez sur « Charger Calendly » pour lister les réservations.")
    else:
        filtered = _filter_bookings(bookings, category=category, filter_mode=filter_mode)
        if not filtered:
            st.success(f"Aucune réservation {title.lower()} pour « {filter_mode} ».")
        else:
            temp_base = temporary_base_url_for(category)
            display_rows = []
            for row in filtered:
                slug = row.get("lead_link") or ""
                email = row.get("email") or ""
                schedule_cols = _build_schedule_columns(row, category=category)
                temp_url = build_confirm_url(temp_base, slug, email) if slug else ""
                sequence_status = str(row.get("sequence_status") or "none")
                display_rows.append(
                    {
                        "select": True,
                        "email": email,
                        "name": row.get("name") or "",
                        "company": row.get("company") or "",
                        "start_time": row.get("start_time") or "",
                        "tracked": "oui" if row.get("tracked") else "non",
                        "sequence_type": SEQUENCE_TYPE_LABELS.get(
                            str(row.get("sequence_type") or ""),
                            row.get("sequence_type"),
                        ),
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
                        "compressed": schedule_cols["compressed"],
                        "provisioned": "oui" if row.get("provisioned") else "non",
                        "temporary_url": temp_url,
                        "lead_id": row.get("lead_id") or "",
                        "invitee_uri": row.get("invitee_uri") or "",
                        "_sequence_type_raw": row.get("sequence_type"),
                        "_sequence_status_raw": sequence_status,
                    }
                )

            df = pd.DataFrame(display_rows)
            edited = st.data_editor(
                df,
                column_config={
                    "select": st.column_config.CheckboxColumn("Sélection"),
                    "temporary_url": st.column_config.LinkColumn("temporary-reservation"),
                    "lead_id": None,
                    "invitee_uri": None,
                    "_sequence_type_raw": None,
                    "_sequence_status_raw": None,
                },
                disabled=[
                    "email",
                    "name",
                    "company",
                    "start_time",
                    "tracked",
                    "sequence_type",
                    "sequence_status",
                    "send_email_1",
                    "send_email_2",
                    "send_email_3",
                    "send_email_4",
                    "job_email_1",
                    "job_email_2",
                    "job_email_3",
                    "job_email_4",
                    "compressed",
                    "provisioned",
                    "temporary_url",
                    "lead_id",
                    "invitee_uri",
                    "_sequence_type_raw",
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

            send_mode = st.radio(
                "Mode d'envoi",
                ["Séquence complète", "Emails sélectionnés"],
                horizontal=True,
                key=f"{key_prefix}_send_mode",
            )

            main_selected = st.multiselect(
                "Emails principaux (agence trackée)",
                MAIN_AGENCE_TYPES,
                default=MAIN_AGENCE_TYPES,
                format_func=lambda value: EMAIL_TYPE_LABELS.get(value, value),
                key=f"{key_prefix}_main_email_types",
                disabled=category != "agence" or send_mode != "Emails sélectionnés",
            )
            role_selected = st.multiselect(
                "Emails role recovery (agence non trackée)",
                ROLE_RECOVERY_TYPES,
                default=ROLE_RECOVERY_TYPES,
                format_func=lambda value: EMAIL_TYPE_LABELS.get(value, value),
                key=f"{key_prefix}_role_email_types",
                disabled=category != "agence" or send_mode != "Emails sélectionnés",
            )
            entreprise_immediate = st.checkbox(
                "Email de confirmation immédiate",
                value=True,
                key=f"{key_prefix}_entreprise_immediate",
                disabled=category != "entreprise" or send_mode != "Emails sélectionnés",
            )

            if send_mode == "Emails sélectionnés" and category == "agence":
                st.caption(
                    "Les relances H-48/H-24 sans email immédiat déjà envoyé "
                    "peuvent manquer de contexte de thread."
                )

            col_provision, col_send = st.columns(2)
            with col_provision:
                if category == "agence":
                    if st.button(
                        "Provisionner la sélection",
                        type="primary",
                        key=f"{key_prefix}_provision",
                    ):
                        if selected.empty:
                            st.warning("Sélectionnez au moins une ligne.")
                        else:
                            client = get_client()
                            ok = 0
                            errors: list[str] = []
                            booking_by_email = {row["email"]: row for row in filtered}
                            for _, item in selected.iterrows():
                                source = booking_by_email.get(item["email"])
                                if not source:
                                    continue
                                try:
                                    lead = provision_or_update_role_recovery_lead(
                                        client,
                                        email=source["email"],
                                        first_name=source.get("first_name"),
                                        company=source.get("company"),
                                        scheduled_at=source.get("start_time"),
                                        calendly_invitee_uri=source.get("invitee_uri"),
                                        calendly_payload={
                                            "invitee_uri": source.get("invitee_uri"),
                                            "event_uri": source.get("event_uri"),
                                        },
                                        calendly_questions=source.get("questions") or {},
                                    )
                                    source["lead_id"] = lead["id"]
                                    source["lead_link"] = lead.get("slug")
                                    source["lead_category"] = "agence"
                                    source["booking_category"] = "agence"
                                    source["provisioned"] = True
                                    source["sequence_type"] = "main"
                                    source["sequence_status"] = enrich_sequence_status(
                                        source
                                    )
                                    ok += 1
                                except Exception as exc:
                                    errors.append(f"{item['email']}: {exc}")
                            st.session_state.bookings = bookings
                            if ok:
                                st.success(f"{ok} lead(s) provisionné(s).")
                            for err in errors:
                                st.error(err)
                            st.rerun()

            with col_send:
                if st.button("Envoyer", key=f"{key_prefix}_send"):
                    if selected.empty:
                        st.warning("Sélectionnez au moins une ligne.")
                    else:
                        ok = 0
                        errors: list[str] = []
                        booking_by_email = {row["email"]: row for row in filtered}
                        partial = send_mode == "Emails sélectionnés"

                        for _, item in selected.iterrows():
                            source = booking_by_email.get(item["email"])
                            if not source:
                                continue

                            status = str(item.get("_sequence_status_raw") or "")
                            if status == "cancelled":
                                errors.append(f"{item['email']}: réservation annulée")
                                continue
                            if status == "confirmed" and not partial:
                                errors.append(f"{item['email']}: déjà confirmée")
                                continue

                            lead_id = source.get("lead_id") or item.get("lead_id")
                            if not lead_id:
                                errors.append(f"{item['email']}: lead non provisionné")
                                continue

                            sequence_type = str(
                                item.get("_sequence_type_raw")
                                or source.get("sequence_type")
                                or "main"
                            )
                            lead_category = str(
                                source.get("lead_category")
                                or source.get("booking_category")
                                or category
                            )

                            email_types, is_partial = _resolve_email_types_for_send(
                                category=category,
                                sequence_type=sequence_type,
                                send_mode=send_mode,
                                main_selected=main_selected,
                                role_selected=role_selected,
                                entreprise_immediate=entreprise_immediate,
                            )
                            if is_partial and not email_types:
                                errors.append(f"{item['email']}: aucun email sélectionné")
                                continue

                            if (
                                not partial
                                and status in {"started", "confirmed"}
                            ):
                                errors.append(
                                    f"{item['email']}: séquence déjà {status}"
                                )
                                continue

                            try:
                                if sequence_type == "role_recovery" and category == "agence":
                                    result = start_role_recovery_sequence(
                                        lead_id=str(lead_id),
                                        category=lead_category,
                                        email=str(item["email"]),
                                        email_types=email_types,
                                        partial=is_partial or partial,
                                    )
                                else:
                                    result = start_booking_sequence(
                                        lead_id=str(lead_id),
                                        category=lead_category,
                                        mode="now",
                                        email_types=email_types,
                                        partial=is_partial or partial,
                                    )
                                if result.get("started"):
                                    ok += 1
                                else:
                                    errors.append(
                                        f"{item['email']}: "
                                        f"{result.get('reason', 'not_started')}"
                                    )
                            except Exception as exc:
                                errors.append(f"{item['email']}: {exc}")

                        if ok:
                            st.success(f"Envoi déclenché pour {ok} lead(s).")
                            _fetch_bookings()
                        for err in errors:
                            st.error(err)
                        if ok:
                            st.rerun()

    st.divider()
    _render_templates_editor(category, key_prefix)


st.set_page_config(page_title="Booking Resend", layout="wide")
st.title("Booking Resend")
st.caption(
    "Réservations Calendly par booking link (agence / entreprise) et séquences Resend."
)

tab_agence, tab_entreprise = st.tabs(["Réservations Agence", "Réservations Entreprise"])

with tab_agence:
    _render_category_tab("agence")

with tab_entreprise:
    _render_category_tab("entreprise")

with st.sidebar:
    st.header("Status")
    st.caption(f"Env: `{env_source_label()}`")
    st.caption(f"Backend: `{settings.crm_backend_url}`")
    if not _env("CALENDLY_API_TOKEN"):
        st.warning("CALENDLY_API_TOKEN manquant")
    if not _env("RESEND_API_KEY"):
        st.warning("RESEND_API_KEY manquant (tests email)")
