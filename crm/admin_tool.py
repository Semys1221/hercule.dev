"""Hercule CRM — Streamlit lead list, manual add, Unibox, Instantly provisioning."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parent))

from booking_templates import list_templates, send_test_email, upsert_templates
from config import env_source_label, settings
from crm_api import post_json
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
from supabase_repo import (
    find_by_email,
    get_client,
    list_all_leads,
    provision_lead,
    reset_client_cache,
)

st.set_page_config(page_title="Hercule CRM", layout="wide")
st.title("Hercule CRM")
st.caption(
    "Leads Supabase (agence / entreprise). Tracking agence: "
    f"`{settings.tracking_base_url_agence}/{{slug}}` · entreprise: "
    f"`{settings.tracking_base_url_entreprise}/{{slug}}` — Instantly `{{{{link}}}}`"
)


def _init_state() -> None:
    defaults = {
        "campaign_id": None,
        "campaign_name": None,
        "campaign_leads_df": None,
        "last_result_rows": None,
        "crm_leads": None,
        "selected_lead_id": None,
        "unibox_rows": None,
        "pending_booked_lead": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def _reload_leads() -> None:
    st.session_state.crm_leads = list_all_leads()


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
        "?code=exemple-slug&email=jean@example.com"
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
}

EMAIL_TYPE_VARS = {
    "immediate": "{{firstNameLine}}, {{date}}, {{heure}}",
    "h48_confirm": "{{firstNameLine}}, {{confirmUrl}}",
    "h24_relance": "{{firstNameLine}}, {{confirmUrl}}",
    "h20_cancel": "{{firstNameLine}}, {{date}}, {{heure}}",
}

LEAD_STATUTS = [
    "NOTBOOKED",
    "CLICKED",
    "MEETING_BOOKED",
    "CONFIRMED",
    "CANCELLED",
]


_init_state()

tab_leads, tab_add, tab_unibox, tab_provision, tab_emails = st.tabs(
    ["Leads", "Ajouter", "Unibox Instantly", "Provisioning", "Emails Resend"]
)

with tab_leads:
    col_a, col_b = st.columns([1, 4])
    with col_a:
        if st.button("Actualiser", type="primary"):
            try:
                _reload_leads()
                st.success("Données rechargées depuis Supabase.")
            except Exception as exc:
                st.error(str(exc))
    with col_b:
        st.caption("Recharge Supabase. Instantly est mis à jour uniquement lors d’un changement de statut.")

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
        display = pd.DataFrame(leads)
        keep = [
            c
            for c in [
                "category",
                "first_name",
                "email",
                "company",
                "statut",
                "link",
                "scheduled_at",
                "confirmed_at",
                "updated_at",
                "id",
            ]
            if c in display.columns
        ]
        st.dataframe(display[keep], hide_index=True, use_container_width=True)

        labels = {
            f"{row.get('email')} · {row.get('category')} · {row.get('statut')}": row
            for row in leads
        }
        selected_label = st.selectbox("Détail / statut", list(labels.keys()))
        selected = labels[selected_label]
        st.json(
            {
                "id": selected.get("id"),
                "email": selected.get("email"),
                "first_name": selected.get("first_name"),
                "company": selected.get("company"),
                "statut": selected.get("statut"),
                "link": selected.get("link"),
                "scheduled_at": selected.get("scheduled_at"),
                "confirmed_at": selected.get("confirmed_at"),
            }
        )

        new_statut = st.selectbox(
            "Nouveau statut",
            LEAD_STATUTS,
            index=LEAD_STATUTS.index(
                selected.get("statut")
                if selected.get("statut") in LEAD_STATUTS
                else "NOTBOOKED"
            ),
        )

        if st.button("Enregistrer le statut"):
            if new_statut == "MEETING_BOOKED" and selected.get("statut") != "MEETING_BOOKED":
                st.session_state.pending_booked_lead = selected
                st.rerun()
            else:
                try:
                    post_json(
                        "/api/link-tracking/sync-status",
                        {
                            "lead_id": selected["id"],
                            "category": selected["category"],
                            "statut": new_statut,
                        },
                    )
                    _reload_leads()
                    st.success("Statut mis à jour (Supabase + Instantly).")
                except Exception as exc:
                    st.error(str(exc))

        pending = st.session_state.pending_booked_lead
        if pending:
            st.warning(
                "This lead is being marked as MEETING BOOKED. "
                "Do you want to trigger the booking communication sequence?"
            )
            mode = st.radio(
                "Séquence Resend",
                ["Trigger now", "Schedule", "Do not trigger"],
                key="booked_mode",
            )
            scheduled_at = None
            if mode == "Schedule":
                scheduled_at = st.text_input(
                    "Date et heure de démarrage (ISO, ex. 2026-09-10T09:00:00+02:00)",
                    key="booked_schedule",
                )
            if st.button("Confirmer MEETING BOOKED"):
                try:
                    post_json(
                        "/api/link-tracking/sync-status",
                        {
                            "lead_id": pending["id"],
                            "category": pending["category"],
                            "statut": "MEETING_BOOKED",
                        },
                    )
                    if mode != "Do not trigger":
                        payload = {
                            "lead_id": pending["id"],
                            "category": pending["category"],
                            "mode": "scheduled" if mode == "Schedule" else "now",
                        }
                        if mode == "Schedule":
                            payload["scheduled_at"] = scheduled_at
                        post_json("/api/booking-communication/trigger", payload)
                    st.session_state.pending_booked_lead = None
                    _reload_leads()
                    st.success("Lead marqué MEETING_BOOKED.")
                    st.rerun()
                except Exception as exc:
                    st.error(str(exc))
            if st.button("Annuler"):
                st.session_state.pending_booked_lead = None
                st.rerun()

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
                    st.success(f"Lead créé · slug `{created.get('link')}`")
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

with tab_provision:
    st.subheader("1. Campagne Instantly — injecter `{{link}}`")
    st.caption(
        "Les leads restent dans la campagne. PATCH custom_variables.link "
        "pour les templates Instantly."
    )

    try:
        instantly = get_instantly_client()
        campaigns = instantly.list_all_campaigns()
    except Exception as exc:
        st.error(f"Instantly connection failed: {exc}")
        campaigns = []
        instantly = None

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
            "Patch Instantly custom_variables (link + statut)",
            value=True,
        )
        if st.button("Provision selected leads", type="primary"):
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
                with st.spinner("Provisioning…"):
                    try:
                        result = provision_from_instantly_leads(
                            category=category,  # type: ignore[arg-type]
                            campaign_id=st.session_state.campaign_id or "",
                            selected_leads=selected_leads,
                            instantly=instantly,
                            patch_instantly=patch_vars,
                        )
                        st.session_state.last_result_rows = result.rows
                        st.success(
                            f"Created: {result.created} · Patched: {result.patched} · "
                            f"Skipped: {result.skipped} · Failed: {result.failed}"
                        )
                        if result.errors:
                            with st.expander("Warnings / errors"):
                                for err in result.errors:
                                    st.write(f"- {err}")
                        _reload_leads()
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
            except Exception as exc:
                st.error(str(exc))

    if st.session_state.last_result_rows:
        export_df = rows_to_dataframe(st.session_state.last_result_rows)
        st.download_button(
            "Download CSV with link column",
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
    st.caption("Templates Instantly: utilisez `{{link}}`")
