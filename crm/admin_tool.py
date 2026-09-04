"""Hercule CRM — Streamlit lead list, manual add, Unibox, Instantly provisioning."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parent))

from booking_templates import list_templates, send_test_email, upsert_templates
from config import (
    env_source_label,
    instantly_patch_concurrency,
    settings,
    temporary_base_url_for,
)
from crm_api import post_json, start_role_recovery_sequence
from calendly_client import list_untracked_bookings
from instantly_client import (
    count_leads_in_campaign,
    format_resource_label,
    get_instantly_client,
    leads_to_dataframe,
)
from pipeline import (
    detect_email_column,
    provision_from_csv,
    provision_from_instantly_leads,
    rows_to_dataframe,
)
from slug import build_confirm_url, build_lead_urls
from supabase_repo import (
    find_by_email,
    get_client,
    list_all_leads,
    provision_lead,
    provision_or_update_role_recovery_lead,
    reset_client_cache,
)

st.set_page_config(page_title="Hercule CRM", layout="wide")
st.title("Hercule CRM")
st.caption(
    "Leads Supabase (agence / entreprise). Booking agence: "
    f"`{settings.tracking_base_url_agence}/{{slug}}` · entreprise: "
    f"`{settings.tracking_base_url_entreprise}/{{slug}}` · confirmation: "
    f"`{settings.confirm_base_url}/{{slug}}?email={{email}}` — Instantly "
    "`{{reservation_agence_link}}` / `{{reservation_entreprise_link}}` / "
    "`{{confirmation_agence_link}}`"
)

LEAD_STATUTS = [
    "NOTBOOKED",
    "CLICKED",
    "MEETING_BOOKED",
    "CONFIRMED",
    "CANCELLED",
]


def _init_state() -> None:
    defaults = {
        "campaign_id": None,
        "campaign_name": None,
        "instantly_campaigns": None,
        "campaign_leads_df": None,
        "last_result_rows": None,
        "crm_leads": None,
        "selected_lead_id": None,
        "unibox_rows": None,
        "pending_statut_changes": None,
        "leads_editor_version": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def _reload_leads() -> None:
    st.session_state.crm_leads = list_all_leads()


def _lead_urls(lead: dict) -> dict[str, str | None]:
    slug = (lead.get("slug") or "").strip()
    email = (lead.get("email") or "").strip()
    stored = {
        "reservation_agence_link": (lead.get("reservation_agence_link") or "").strip() or None,
        "reservation_entreprise_link": (
            (lead.get("reservation_entreprise_link") or "").strip() or None
        ),
        "confirmation_agence_link": (
            (lead.get("confirmation_agence_link") or "").strip() or None
        ),
    }
    if stored["reservation_agence_link"] and stored["reservation_entreprise_link"]:
        if stored["confirmation_agence_link"]:
            return stored
    if not slug:
        return stored
    computed = build_lead_urls(slug, email)
    return {
        "reservation_agence_link": stored["reservation_agence_link"]
        or computed["reservation_agence_link"],
        "reservation_entreprise_link": stored["reservation_entreprise_link"]
        or computed["reservation_entreprise_link"],
        "confirmation_agence_link": stored["confirmation_agence_link"]
        or computed["confirmation_agence_link"],
    }


def _is_role_recovery_compressed(start_time: str | None) -> bool:
    if not start_time:
        return False
    try:
        normalized = start_time.replace("Z", "+00:00")
        start = datetime.fromisoformat(normalized)
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return start - now < timedelta(hours=48)
    except ValueError:
        return False


def _fetch_sequence_bookings() -> list[dict]:
    bookings = list_untracked_bookings()
    st.session_state.sequence_bookings = bookings
    return bookings


def _is_meeting_booked(statut: str | None) -> bool:
    return statut in ("MEETING_BOOKED", "BOOKED")


def _status_side_effects(old_statut: str, new_statut: str) -> list[str]:
    if old_statut == new_statut:
        return []
    messages: list[str] = []
    if new_statut == "MEETING_BOOKED" and not _is_meeting_booked(old_statut):
        messages.append("Déclencher la séquence d'emails Resend (immediate + relances) ?")
    if old_statut == "MEETING_BOOKED" and new_statut == "CONFIRMED":
        messages.append("Les relances en attente (h48, h24, h20) seront annulées.")
    return messages


LEADS_EDITOR_COLUMNS = [
    "category",
    "first_name",
    "email",
    "company",
    "statut",
    "slug",
    "reservation_agence_link",
    "reservation_entreprise_link",
    "confirmation_agence_link",
    "scheduled_at",
    "confirmed_at",
    "updated_at",
    "id",
    "_original_statut",
]


def _build_leads_editor_df(leads: list[dict]) -> pd.DataFrame:
    rows: list[dict] = []
    for lead in leads:
        statut = lead.get("statut") if lead.get("statut") in LEAD_STATUTS else "NOTBOOKED"
        rows.append(
            {
                "category": lead.get("category"),
                "first_name": lead.get("first_name"),
                "email": lead.get("email"),
                "company": lead.get("company"),
                "statut": statut,
                "slug": lead.get("slug"),
                "reservation_agence_link": lead.get("reservation_agence_link"),
                "reservation_entreprise_link": lead.get("reservation_entreprise_link"),
                "confirmation_agence_link": lead.get("confirmation_agence_link"),
                "scheduled_at": lead.get("scheduled_at"),
                "confirmed_at": lead.get("confirmed_at"),
                "updated_at": lead.get("updated_at"),
                "id": lead.get("id"),
                "_original_statut": statut,
            }
        )
    return pd.DataFrame(rows, columns=LEADS_EDITOR_COLUMNS)


def _detect_statut_changes(edited: pd.DataFrame) -> list[dict]:
    changes: list[dict] = []
    for _, row in edited.iterrows():
        old_statut = str(row.get("_original_statut") or "")
        new_statut = str(row.get("statut") or "")
        if old_statut != new_statut:
            changes.append(
                {
                    "id": row.get("id"),
                    "category": row.get("category"),
                    "email": row.get("email"),
                    "old_statut": old_statut,
                    "new_statut": new_statut,
                    "side_effects": _status_side_effects(old_statut, new_statut),
                }
            )
    return changes


def _apply_statut_change(
    change: dict,
    *,
    resend_mode: str | None = None,
    scheduled_at: str | None = None,
) -> None:
    post_json(
        "/api/link-tracking/sync-status",
        {
            "lead_id": change["id"],
            "category": change["category"],
            "statut": change["new_statut"],
        },
    )
    if (
        change["new_statut"] == "MEETING_BOOKED"
        and resend_mode
        and resend_mode != "Do not trigger"
    ):
        payload: dict = {
            "lead_id": change["id"],
            "category": change["category"],
            "mode": "scheduled" if resend_mode == "Schedule" else "now",
        }
        if resend_mode == "Schedule" and scheduled_at:
            payload["scheduled_at"] = scheduled_at
        post_json("/api/booking-communication/trigger", payload)


@st.dialog("Confirmer les modifications de statut")
def _confirm_statut_changes_dialog(changes: list[dict]) -> None:
    st.markdown("Les changements suivants déclenchent des actions :")
    for change in changes:
        st.write(
            f"- **{change['email']}** : `{change['old_statut']}` → `{change['new_statut']}`"
        )
        for msg in change.get("side_effects") or []:
            st.caption(msg)

    needs_resend = any(
        c["new_statut"] == "MEETING_BOOKED" and not _is_meeting_booked(c["old_statut"])
        for c in changes
    )
    resend_mode = "Do not trigger"
    scheduled_at = ""
    if needs_resend:
        resend_mode = st.radio(
            "Séquence Resend (leads passant en MEETING_BOOKED)",
            ["Trigger now", "Schedule", "Do not trigger"],
            key="dialog_resend_mode",
        )
        if resend_mode == "Schedule":
            scheduled_at = st.text_input(
                "Démarrage séquence (ISO, ex. 2026-09-10T09:00:00+02:00)",
                key="dialog_resend_schedule",
            )

    col_confirm, col_cancel = st.columns(2)
    with col_confirm:
        if st.button("Confirmer", type="primary", key="dialog_confirm_statut"):
            try:
                for change in changes:
                    mode = resend_mode if (
                        change["new_statut"] == "MEETING_BOOKED"
                        and not _is_meeting_booked(change["old_statut"])
                    ) else None
                    _apply_statut_change(
                        change,
                        resend_mode=mode,
                        scheduled_at=scheduled_at or None,
                    )
                st.session_state.pending_statut_changes = None
                st.session_state.leads_editor_version = None
                _reload_leads()
                st.toast(f"{len(changes)} statut(s) mis à jour.")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_cancel:
        if st.button("Annuler", key="dialog_cancel_statut"):
            st.session_state.pending_statut_changes = None
            st.session_state.leads_editor_version = None
            st.rerun()

def _table_with_bulk_select(
    state_key: str,
    version_key: str,
    df: pd.DataFrame,
    *,
    editor_key: str,
) -> pd.DataFrame:
    version_state_key = f"{state_key}_version"
    if (
        version_state_key not in st.session_state
        or st.session_state[version_state_key] != version_key
    ):
        edit_df = df.copy()
        if "select" not in edit_df.columns:
            edit_df.insert(0, "select", False)
        else:
            edit_df["select"] = False
        st.session_state[state_key] = edit_df
        st.session_state[version_state_key] = version_key

    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        if st.button("Tout sélectionner", key=f"{editor_key}_all"):
            st.session_state[state_key]["select"] = True
            st.rerun()
    with col2:
        if st.button("Tout désélectionner", key=f"{editor_key}_none"):
            st.session_state[state_key]["select"] = False
            st.rerun()
    with col3:
        selected_count = int(st.session_state[state_key]["select"].sum())
        total = len(st.session_state[state_key])
        st.caption(f"{selected_count} / {total} sélectionnés")

    edited = st.data_editor(
        st.session_state[state_key],
        column_config={"select": st.column_config.CheckboxColumn("Select")},
        disabled=[c for c in st.session_state[state_key].columns if c != "select"],
        hide_index=True,
        use_container_width=True,
        key=f"{editor_key}_editor",
    )
    st.session_state[state_key] = edited
    return edited


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
    if email_type == "immediate":
        first_name_line = "Bonjour Jean,"
    elif email_type == "h20_cancel":
        first_name_line = "Jean,"
    else:
        first_name_line = "Jean,"
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


_init_state()

tab_leads, tab_add, tab_unibox, tab_provision, tab_emails, tab_sequence = st.tabs(
    ["Leads", "Ajouter", "Unibox Instantly", "Provisioning", "Emails Resend", "Sequence"]
)

with tab_leads:
    col_a, col_b = st.columns([1, 4])
    with col_a:
        if st.button("Actualiser", type="primary"):
            try:
                st.session_state.leads_editor_version = None
                _reload_leads()
                st.success("Données rechargées depuis Supabase.")
            except Exception as exc:
                st.error(str(exc))
    with col_b:
        st.caption(
            "Modifiez la colonne **statut** puis cliquez sur Appliquer. "
            "Les actions (emails Resend, annulation relances) demandent confirmation."
        )

    if st.session_state.crm_leads is None:
        try:
            _reload_leads()
        except Exception as exc:
            st.error(str(exc))
            st.session_state.crm_leads = []

    leads = st.session_state.crm_leads or []
    if not leads:
        st.info("Aucun lead. Ajoutez-en manuellement, via Unibox, ou via Provisioning.")
    else:
        statut_filter = st.multiselect(
            "Filtrer par statut",
            LEAD_STATUTS,
            default=LEAD_STATUTS,
            key="leads_statut_filter",
        )
        filtered_leads = [
            lead
            for lead in leads
            if (lead.get("statut") or "NOTBOOKED") in statut_filter
        ]
        st.caption(f"{len(filtered_leads)} / {len(leads)} leads affichés")

        editor_version = f"{len(leads)}:{','.join(statut_filter)}"
        if st.session_state.leads_editor_version != editor_version:
            st.session_state.leads_editor_df = _build_leads_editor_df(filtered_leads)
            st.session_state.leads_editor_version = editor_version

        disabled_cols = [
            c for c in LEADS_EDITOR_COLUMNS if c not in ("statut",)
        ]
        edited = st.data_editor(
            st.session_state.leads_editor_df,
            column_config={
                "statut": st.column_config.SelectboxColumn(
                    "statut",
                    options=LEAD_STATUTS,
                    required=True,
                ),
                "reservation_agence_link": st.column_config.LinkColumn(
                    "reservation_agence_link"
                ),
                "reservation_entreprise_link": st.column_config.LinkColumn(
                    "reservation_entreprise_link"
                ),
                "confirmation_agence_link": st.column_config.LinkColumn(
                    "confirmation_agence_link"
                ),
                "id": None,
                "_original_statut": None,
            },
            disabled=disabled_cols,
            hide_index=True,
            use_container_width=True,
            key="leads_main_editor",
        )
        st.session_state.leads_editor_df = edited

        if st.button("Appliquer les modifications", type="primary", key="apply_statut_changes"):
            changes = _detect_statut_changes(edited)
            if not changes:
                st.info("Aucune modification de statut détectée.")
            elif any(c.get("side_effects") for c in changes):
                st.session_state.pending_statut_changes = changes
                st.rerun()
            else:
                try:
                    for change in changes:
                        _apply_statut_change(change)
                    st.session_state.leads_editor_version = None
                    _reload_leads()
                    st.toast(f"{len(changes)} statut(s) mis à jour.")
                    st.rerun()
                except Exception as exc:
                    st.error(str(exc))

        if st.session_state.pending_statut_changes:
            _confirm_statut_changes_dialog(st.session_state.pending_statut_changes)

        with st.expander("Détail d'un lead"):
            labels = {
                f"{row.get('email')} · {row.get('category')} · {row.get('statut')}": row
                for row in leads
            }
            selected_label = st.selectbox(
                "Lead",
                list(labels.keys()),
                key="lead_detail_select",
            )
            selected = labels[selected_label]
            urls = _lead_urls(selected)
            st.json(
                {
                    "id": selected.get("id"),
                    "email": selected.get("email"),
                    "first_name": selected.get("first_name"),
                    "company": selected.get("company"),
                    "statut": selected.get("statut"),
                    "slug": selected.get("slug"),
                    "reservation_agence_link": urls["reservation_agence_link"],
                    "reservation_entreprise_link": urls["reservation_entreprise_link"],
                    "confirmation_agence_link": urls["confirmation_agence_link"],
                    "scheduled_at": selected.get("scheduled_at"),
                    "confirmed_at": selected.get("confirmed_at"),
                }
            )

with tab_add:
    st.subheader("Ajouter un prospect (sans CSV)")
    category = st.radio("Catégorie", ["agence", "entreprise"], horizontal=True)
    first_name = st.text_input("Prénom / nom")
    email = st.text_input("Email")
    company = st.text_input("Société")
    slug = st.text_input("Slug (laisser vide pour génération auto)")
    statut = st.selectbox("Statut initial", LEAD_STATUTS)
    calendly_json = st.text_area("Réponses Calendly (JSON optionnel)", value="{}")
    send_resend = st.radio(
        "Séquence Resend (si MEETING_BOOKED)",
        ["Do not trigger", "Trigger now", "Schedule"],
        horizontal=True,
    )
    scheduled_at = ""
    if send_resend == "Schedule":
        scheduled_at = st.text_input("Démarrage séquence (ISO)")

    if st.button("Créer le lead", type="primary"):
        if not email or "@" not in email:
            st.error("Email requis.")
        else:
            try:
                client = get_client()
                existing = find_by_email(client, email)
                if existing:
                    st.warning(
                        f"Lead déjà présent dans `{existing[0]}` : {existing[1].get('email')}"
                    )
                    st.json(existing[1])
                else:
                    questions = None
                    if calendly_json.strip():
                        parsed = json.loads(calendly_json)
                        if isinstance(parsed, dict):
                            questions = parsed
                    created = provision_lead(
                        client,
                        category=category,  # type: ignore[arg-type]
                        email=email,
                        first_name=first_name or None,
                        company=company or None,
                        link=slug or None,
                        statut=statut,  # type: ignore[arg-type]
                        calendly_questions=questions,
                    )
                    urls = _lead_urls({**created, "category": category, "email": email})
                    st.success(
                        f"Lead créé · slug `{created.get('slug')}`\n\n"
                        f"Agence: {urls['reservation_agence_link']}\n\n"
                        f"Entreprise: {urls['reservation_entreprise_link']}\n\n"
                        f"Confirmation: {urls['confirmation_agence_link']}"
                    )
                    if statut == "MEETING_BOOKED" and send_resend != "Do not trigger":
                        payload = {
                            "lead_id": created["id"],
                            "category": category,
                            "mode": "scheduled" if send_resend == "Schedule" else "now",
                        }
                        if send_resend == "Schedule":
                            payload["scheduled_at"] = scheduled_at
                        post_json("/api/booking-communication/trigger", payload)
                        st.info("Séquence Resend déclenchée.")
                    _reload_leads()
            except json.JSONDecodeError:
                st.error("JSON Calendly invalide.")
            except Exception as exc:
                st.error(str(exc))

with tab_unibox:
    st.subheader("Importer depuis Instantly Unibox")
    if st.button("Charger les réponses Unibox"):
        try:
            instantly = get_instantly_client()
            rows = instantly.fetch_unibox_replies()
            st.session_state.unibox_rows = rows
            st.session_state.unibox_load_version = len(rows)
            st.success(f"{len(rows)} conversations.")
        except Exception as exc:
            st.error(str(exc))

    unibox = st.session_state.unibox_rows
    if unibox:
        df = pd.DataFrame(unibox)
        version = str(st.session_state.get("unibox_load_version", len(unibox)))
        edited = _table_with_bulk_select(
            "unibox_leads_edit",
            version,
            df,
            editor_key="unibox",
        )
        unibox_category = st.radio(
            "Table cible",
            ["agence", "entreprise"],
            horizontal=True,
            key="unibox_cat",
        )
        if st.button("Importer la sélection"):
            selected = edited[edited["select"] == True]  # noqa: E712
            client = get_client()
            created = skipped = failed = 0
            for _, row in selected.iterrows():
                email = str(row.get("email") or "")
                if not email or "@" not in email:
                    failed += 1
                    continue
                if find_by_email(client, email):
                    skipped += 1
                    continue
                try:
                    provision_lead(
                        client,
                        category=unibox_category,  # type: ignore[arg-type]
                        email=email,
                    )
                    created += 1
                except Exception:
                    failed += 1
            st.success(f"Créés {created} · déjà présents {skipped} · échecs {failed}")
            _reload_leads()
            if created:
                st.toast(f"{created} lead(s) importé(s) — visible dans l'onglet Leads.")

with tab_provision:
    st.subheader("1. Campagne Instantly — REPLACE des variables de lien")
    st.caption(
        "Les leads restent dans la campagne. Chaque provision **remplace** "
        "`custom_variables` par uniquement "
        "`reservation_agence_link`, `reservation_entreprise_link`, "
        "`confirmation_agence_link` et `statut` — les anciennes colonnes "
        "`link` / `confirm_link` sont rayées."
    )

    instantly = None
    try:
        instantly = get_instantly_client()
        if st.session_state.instantly_campaigns is None:
            with st.spinner("Chargement des campagnes Instantly…"):
                st.session_state.instantly_campaigns = instantly.list_all_campaigns()
    except Exception as exc:
        st.error(f"Instantly connection failed: {exc}")
        st.session_state.instantly_campaigns = st.session_state.instantly_campaigns or []

    if st.button("Rafraîchir les campagnes"):
        try:
            instantly = instantly or get_instantly_client()
            with st.spinner("Chargement des campagnes Instantly…"):
                st.session_state.instantly_campaigns = instantly.list_all_campaigns()
            st.rerun()
        except Exception as exc:
            st.error(str(exc))

    campaigns = st.session_state.instantly_campaigns or []

    if campaigns:
        labels = {
            format_resource_label(c.get("name"), c["id"]): c for c in campaigns
        }
        selected_label = st.selectbox("Campaign", list(labels.keys()), key="campaign_select")
        selected_campaign = labels[selected_label]
        st.session_state.campaign_id = selected_campaign["id"]
        st.caption(f"Campaign ID: `{selected_campaign['id']}`")

        count_key = f"campaign_lead_count_{selected_campaign['id']}"
        if count_key not in st.session_state:
            with st.spinner("Comptage des leads Instantly…"):
                try:
                    st.session_state[count_key] = count_leads_in_campaign(
                        selected_campaign["id"]
                    )
                except Exception as exc:
                    st.session_state[count_key] = None
                    st.warning(f"Impossible de compter les leads : {exc}")

        expected_total = st.session_state.get(count_key)
        if expected_total is not None:
            st.info(f"Cette campagne contient **{expected_total:,}** leads (Instantly).".replace(",", " "))

        load_min = min(50, expected_total) if expected_total else 50
        load_default = (
            max(load_min, min(500, expected_total)) if expected_total else 500
        )
        load_limit = st.number_input(
            "Max leads à charger (par requête)",
            min_value=load_min,
            max_value=10000,
            value=load_default,
            step=50,
            help=(
                "Limite par clic sur « Load leads ». "
                "Les grosses campagnes peuvent contenir des milliers de leads."
            ),
        )
        load_all = st.checkbox(
            "Charger toute la campagne (peut prendre plusieurs minutes)",
            value=False,
        )
        if expected_total and expected_total > 10000 and not load_all:
            st.caption(
                f"La campagne a {expected_total:,} leads — cochez « Charger toute la campagne » "
                "ou augmentez la limite pour tout récupérer.".replace(",", " ")
            )

        if st.button("Load leads from campaign", type="primary"):
            if instantly is None:
                st.error("Instantly client unavailable.")
            else:
                max_leads = None if load_all else int(load_limit)
                progress = st.empty()
                with st.spinner("Fetching leads…"):
                    try:
                        def _on_progress(count: int, pages: int) -> None:
                            progress.caption(
                                f"Fetching leads… {count} chargés (page {pages})"
                            )

                        leads_raw = instantly.fetch_leads_from_campaign(
                            selected_campaign["id"],
                            max_leads=max_leads,
                            on_progress=_on_progress,
                        )
                        progress.empty()
                        st.session_state.campaign_leads_df = leads_to_dataframe(leads_raw)
                        loaded = len(st.session_state.campaign_leads_df)
                        if expected_total is not None:
                            if max_leads is None and loaded == expected_total:
                                st.success(f"Chargés **{loaded}** / **{expected_total}** leads.")
                            elif max_leads is not None and loaded >= max_leads:
                                st.success(
                                    f"Chargés **{loaded}** leads (limite {load_limit} / "
                                    f"{expected_total} dans la campagne)."
                                )
                            elif loaded != expected_total:
                                st.warning(
                                    f"Chargés **{loaded}** leads, **{expected_total}** "
                                    "attendus dans Instantly — vérifiez la campagne."
                                )
                            else:
                                st.success(f"Chargés **{loaded}** / **{expected_total}** leads.")
                        else:
                            st.success(f"Loaded {loaded} leads.")
                    except Exception as exc:
                        progress.empty()
                        st.error(f"Failed to load leads: {exc}")

    if st.session_state.campaign_leads_df is not None:
        df = st.session_state.campaign_leads_df.copy()
        campaign_id = st.session_state.get("campaign_id") or "unknown"
        version = f"{campaign_id}:{len(df)}"
        edited = _table_with_bulk_select(
            "campaign_leads_edit",
            version,
            df,
            editor_key="campaign",
        )
        selected = edited[edited["select"] == True]  # noqa: E712
        category = st.radio(
            "Catégorie Supabase",
            ["agence", "entreprise"],
            horizontal=True,
            key="prov_cat",
        )
        patch_vars = st.checkbox(
            "REPLACE Instantly custom_variables (3 liens + statut, wipe des anciennes)",
            value=True,
        )
        instantly_only = st.checkbox(
            "Instantly only (re-sync)",
            value=False,
            help="Skip Supabase writes for existing leads; PATCH Instantly only.",
        )
        if "instantly_patch_workers" not in st.session_state:
            st.session_state.instantly_patch_workers = instantly_patch_concurrency()
        instantly_workers = st.slider(
            "Instantly concurrency",
            min_value=1,
            max_value=16,
            value=st.session_state.instantly_patch_workers,
            key="instantly_patch_workers",
            help="Parallel PATCH workers (default from INSTANTLY_PATCH_CONCURRENCY).",
        )
        if st.button("Provision / re-sync selected leads", type="primary"):
            if instantly is None:
                st.error("Instantly client unavailable.")
            elif selected.empty:
                st.warning("Select at least one lead.")
            else:
                selected_leads = [
                    {
                        "id": row.get("instantly_lead_id"),
                        "email": row.get("email"),
                        "first_name": row.get("first_name"),
                        "company_name": row.get("company_name"),
                        "website": row.get("website"),
                    }
                    for _, row in selected.iterrows()
                ]
                progress = st.progress(0.0, text="Provisioning…")
                try:
                    _PHASE_WEIGHT = {"prepare": 0.05, "supabase": 0.25, "instantly": 0.70}
                    _PHASE_ORDER = ("prepare", "supabase", "instantly")
                    _PHASE_LABELS = {
                        "prepare": "Préparation",
                        "supabase": "Supabase",
                        "instantly": "Instantly",
                    }

                    def _provision_progress(
                        phase: str, done: int, total: int, label: str
                    ) -> None:
                        idx = (
                            _PHASE_ORDER.index(phase)
                            if phase in _PHASE_ORDER
                            else 0
                        )
                        phase_frac = done / total if total else 1.0
                        base = sum(_PHASE_WEIGHT[p] for p in _PHASE_ORDER[:idx])
                        weight = _PHASE_WEIGHT.get(phase, 0.33)
                        overall = min(base + phase_frac * weight, 1.0)
                        phase_name = _PHASE_LABELS.get(phase, phase)
                        detail = f"{phase_name} {done}/{total}"
                        if label:
                            detail += f" — {label}"
                        progress.progress(overall, text=detail)

                    result = provision_from_instantly_leads(
                        category=category,  # type: ignore[arg-type]
                        campaign_id=st.session_state.campaign_id or "",
                        selected_leads=selected_leads,
                        instantly=instantly,
                        patch_instantly=patch_vars,
                        instantly_only=instantly_only,
                        instantly_workers=instantly_workers,
                        on_progress=_provision_progress,
                    )
                    progress.progress(1.0, text="Terminé")
                    st.session_state.last_result_rows = result.rows
                    skipped_part = (
                        f" · Skipped SB: {result.skipped}" if result.skipped else ""
                    )
                    if result.partial_supabase and result.patched:
                        st.warning(
                            f"Partial Supabase write: {result.created} created, "
                            f"{result.updated} updated, "
                            f"{result.insert_failed} insert failed, "
                            f"{result.update_failed} update failed — "
                            f"Instantly patched {result.patched}. Re-run Provision to resume."
                        )
                    elif result.partial_supabase:
                        failed_parts = []
                        if result.insert_failed:
                            failed_parts.append(f"{result.insert_failed} insert failed")
                        if result.update_failed:
                            failed_parts.append(f"{result.update_failed} update failed")
                        failed_text = ", ".join(failed_parts) or "some writes failed"
                        st.warning(
                            f"Partial Supabase write: {result.created} created, "
                            f"{result.updated} updated, {failed_text}. "
                            "Re-run Provision to resume."
                        )
                    st.success(
                        f"Created: {result.created} · Updated: {result.updated} · "
                        f"Patched: {result.patched}{skipped_part} · Failed: {result.failed}"
                    )
                    if result.errors:
                        with st.expander("Warnings / errors"):
                            if result.partial_supabase:
                                st.info(
                                    "Some rows were saved before the error. "
                                    "Re-select the same leads and click Provision again to finish."
                                )
                            for err in result.errors:
                                st.write(f"- {err}")
                    _reload_leads()
                    st.toast(
                        f"{result.created + result.updated} lead(s) "
                        "provisionné(s) — visible dans l'onglet Leads."
                    )
                except Exception as exc:
                    st.error(f"Provisioning failed: {exc}")

    st.divider()
    st.subheader("CSV optionnel (export / push)")
    uploaded = st.file_uploader("Upload cleaned CSV", type=["csv"])
    if uploaded is not None:
        csv_df = pd.read_csv(uploaded)
        st.dataframe(csv_df.head(5), use_container_width=True)
        email_col = detect_email_column(csv_df) or st.selectbox(
            "Email column", csv_df.columns.tolist()
        )
        category_csv = st.radio(
            "Catégorie",
            ["agence", "entreprise"],
            horizontal=True,
            key="csv_category",
        )
        if st.button("Provision from CSV"):
            try:
                result = provision_from_csv(
                    category=category_csv,  # type: ignore[arg-type]
                    df=csv_df,
                    email_column=email_col or "email",
                    campaign_id=st.session_state.get("campaign_id"),
                )
                st.session_state.last_result_rows = result.rows
                st.success(
                    f"Created: {result.created} · Skipped: {result.skipped} · Failed: {result.failed}"
                )
                _reload_leads()
                st.toast(
                    f"{result.created} lead(s) provisionné(s) — visible dans l'onglet Leads."
                )
            except Exception as exc:
                st.error(str(exc))

    if st.session_state.last_result_rows:
        export_df = rows_to_dataframe(st.session_state.last_result_rows)
        st.download_button(
            "Download CSV with slug + full links",
            data=export_df.to_csv(index=False).encode("utf-8-sig"),
            file_name="link_tracking_leads.csv",
            mime="text/csv",
        )

with tab_emails:
    st.subheader("Séquence Resend — emails de réservation")
    st.caption(
        "Modèle par catégorie (agence / entreprise). "
        "Les variables sont remplacées à l'envoi."
    )
    email_category = st.radio(
        "Catégorie",
        ["agence", "entreprise"],
        horizontal=True,
        key="email_template_category",
    )
    if email_category == "entreprise":
        st.info("Entreprise : seul l'email immédiat est envoyé après réservation.")
    test_to = st.text_input(
        "Email de test",
        value="nanguy29@gmail.com",
        key="email_test_to",
    )
    cache_key = f"email_templates_{email_category}"
    if st.button("Recharger les modèles", key="reload_email_templates"):
        st.session_state.pop(cache_key, None)
        st.rerun()

    if cache_key not in st.session_state:
        try:
            st.session_state[cache_key] = list_templates(email_category)  # type: ignore[arg-type]
        except Exception as exc:
            st.error(f"Impossible de charger les modèles : {exc}")
            st.session_state[cache_key] = []

    templates = st.session_state.get(cache_key) or []
    visible_types = {"immediate"} if email_category == "entreprise" else None
    if not templates:
        st.info("Aucun modèle chargé. Vérifiez la connexion Supabase.")
    else:
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
                    key=f"email_subject_{email_category}_{email_type}",
                )
                body = st.text_area(
                    "Corps (texte brut)",
                    value=template.get("body") or "",
                    height=220,
                    key=f"email_body_{email_category}_{email_type}",
                )
                col_preview, col_test = st.columns(2)
                with col_preview:
                    if st.button("Aperçu", key=f"email_preview_{email_category}_{email_type}"):
                        preview_subject, preview_body = _preview_email_template(
                            email_type,
                            subject,
                            body,
                        )
                        st.markdown(f"**Objet :** {preview_subject}")
                        st.text(preview_body)
                with col_test:
                    if st.button("Envoyer test", key=f"email_test_{email_category}_{email_type}"):
                        try:
                            result = send_test_email(
                                to=test_to.strip() or "nanguy29@gmail.com",
                                category=email_category,  # type: ignore[arg-type]
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

        if st.button("Enregistrer les modèles", type="primary", key="save_email_templates"):
            try:
                upsert_templates(email_category, edited_templates)  # type: ignore[arg-type]
                st.session_state.pop(cache_key, None)
                st.success(f"Modèles enregistrés pour `{email_category}`.")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))

with tab_sequence:
    st.subheader("Sequence — role recovery")
    st.caption(
        "Calendly bookings without slug tracking (`utm_content`). Provision a lead, "
        f"then send the 2-email role recovery sequence. Confirmation page: "
        f"`{settings.temporary_base_url}/{{slug}}?email={{email}}`"
    )

    if "sequence_bookings" not in st.session_state:
        st.session_state.sequence_bookings = None

    col_load, col_refresh, col_clear = st.columns([1, 1, 3])
    with col_load:
        if st.button("Charger Calendly", type="primary", key="load_sequence_bookings"):
            try:
                bookings_loaded = _fetch_sequence_bookings()
                st.success(
                    f"{len(bookings_loaded)} réservation(s) sans tracking."
                )
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_refresh:
        if st.button("Actualiser", key="refresh_sequence_bookings"):
            try:
                bookings_loaded = _fetch_sequence_bookings()
                st.toast(
                    f"{len(bookings_loaded)} réservation(s) rechargée(s) depuis Calendly."
                )
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_clear:
        if st.button("Vider la liste", key="clear_sequence_bookings"):
            st.session_state.sequence_bookings = None
            st.rerun()

    bookings = st.session_state.sequence_bookings
    if bookings is None:
        st.info("Cliquez sur « Charger Calendly » pour lister les réservations non trackées.")
    elif not bookings:
        st.success("Aucune réservation non trackée sur les 30 prochains jours.")
    else:
        temp_base = temporary_base_url_for("agence")
        display_rows = []
        for row in bookings:
            slug = row.get("lead_link") or ""
            email = row.get("email") or ""
            temp_url = (
                build_confirm_url(temp_base, slug, email)
                if slug
                else ""
            )
            compressed = _is_role_recovery_compressed(row.get("start_time"))
            display_rows.append(
                {
                    "select": False,
                    "email": email,
                    "name": row.get("name") or "",
                    "company": row.get("company") or "",
                    "start_time": row.get("start_time") or "",
                    "compressed": "oui (10 min)" if compressed else "non",
                    "utm_content": row.get("utm_content") or "",
                    "provisioned": bool(row.get("provisioned")),
                    "temporary_url": temp_url,
                    "lead_id": row.get("lead_id") or "",
                    "invitee_uri": row.get("invitee_uri") or "",
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
            },
            disabled=[
                "email",
                "name",
                "company",
                "start_time",
                "compressed",
                "utm_content",
                "provisioned",
                "temporary_url",
                "lead_id",
                "invitee_uri",
            ],
            hide_index=True,
            use_container_width=True,
            key="sequence_bookings_editor",
        )

        selected = edited[edited["select"] == True]  # noqa: E712
        st.caption(f"{len(selected)} / {len(edited)} sélectionné(s)")

        col_provision, col_send = st.columns(2)
        with col_provision:
            if st.button(
                "Provisionner la sélection",
                type="primary",
                key="provision_sequence_selection",
            ):
                if selected.empty:
                    st.warning("Sélectionnez au moins une ligne.")
                else:
                    client = get_client()
                    ok = 0
                    errors: list[str] = []
                    booking_by_email = {row["email"]: row for row in bookings}
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
                            source["provisioned"] = True
                            ok += 1
                        except Exception as exc:
                            errors.append(f"{item['email']}: {exc}")
                    st.session_state.sequence_bookings = bookings
                    if ok:
                        st.success(f"{ok} lead(s) provisionné(s).")
                    for err in errors:
                        st.error(err)
                    st.rerun()

        with col_send:
            if st.button("Envoyer la séquence", key="send_sequence_selection"):
                if selected.empty:
                    st.warning("Sélectionnez au moins une ligne provisionnée.")
                else:
                    ok = 0
                    errors: list[str] = []
                    for _, item in selected.iterrows():
                        if not item.get("lead_id"):
                            errors.append(f"{item['email']}: lead non provisionné")
                            continue
                        try:
                            result = start_role_recovery_sequence(
                                lead_id=str(item["lead_id"]),
                                category="agence",
                                email=str(item["email"]),
                            )
                            if result.get("started"):
                                ok += 1
                            else:
                                errors.append(
                                    f"{item['email']}: {result.get('reason', 'not_started')}"
                                )
                        except Exception as exc:
                            errors.append(f"{item['email']}: {exc}")
                    if ok:
                        st.success(f"Séquence démarrée pour {ok} lead(s).")
                    for err in errors:
                        st.error(err)

with st.sidebar:
    st.header("Status")
    st.caption(f"Env: `{env_source_label()}`")
    if st.button("Recharger .env"):
        reset_client_cache()
        st.session_state.crm_leads = None
        st.rerun()
    try:
        get_client()
        st.success("Supabase connected")
    except Exception as exc:
        st.error(f"Supabase: {exc}")
    try:
        get_instantly_client()
        st.success("Instantly connected")
    except Exception as exc:
        st.warning(f"Instantly: {exc}")
    st.caption(f"Backend: `{settings.crm_backend_url}`")
    try:
        import requests as _requests

        ping = _requests.get(f"{settings.crm_backend_url}/api/booking/config", timeout=3)
        if ping.ok:
            st.success("Next.js backend connected")
        else:
            st.warning(f"Next.js backend HTTP {ping.status_code}")
    except Exception:
        st.warning(
            "Next.js backend offline — l'onglet Emails Resend fonctionne via Supabase/Resend. "
            "Lancez `pnpm run dev` pour les changements de statut et séquences."
        )
    st.caption(
        "Templates Instantly: `{{reservation_agence_link}}` · "
        "`{{reservation_entreprise_link}}` · `{{confirmation_agence_link}}`"
    )
