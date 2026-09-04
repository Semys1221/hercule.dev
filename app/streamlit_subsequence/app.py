"""Instantly subsequence — Streamlit operations dashboard."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st

_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from config import (
    env,
    is_valid_webhook_target_url,
    require_instantly_api_key,
    webhook_auto_send_enabled,
    webhook_public_url,
    webhook_secret,
    webhook_url_error,
)
from onboarding import (
    copy_is_complete,
    derive_onboarding_status,
    e1_copy_is_ready,
    explain_webhook_miss,
    find_campaign_webhook,
    initialize_campaign,
    is_webhook_active,
)
from send_queue import (
    DEFAULT_FLOW_BY_STEP,
    PIPELINE_STEPS,
    SENDABLE_FLOWS,
    Flow,
    PipelineStep,
    dispatch_bulk,
    fetch_pipeline_leads,
    leads_for_step,
    move_pipeline_leads,
    render_template_html,
)
from send_window import format_paris_slot, is_within_send_window, next_send_slot
from unibox_classify import derive_step_from_flows, is_no_show_status
from unibox_thread import (
    fetch_latest_reply,
    render_conversation_html,
    thread_subject,
)
from shared.instantly_client import InstantlyClient, format_resource_label, list_all_campaigns
from supabase_repo import (
    fetch_analytics,
    get_config,
    list_templates,
    save_template,
    set_campaign_webhook_auto_send_enabled,
    sync_webhook_id,
)

st.set_page_config(page_title="Streamlit Subsequence", layout="wide")
st.title("Streamlit Subsequence")
st.caption("CRM étapes 0–3 → Unibox reply → envois contrôlés par l’opérateur.")

FLOW_LABELS: dict[Flow, str] = {
    "interested_email1": "Email 1 — Précisions + audit (webhook auto ou manuel)",
    "interested_email2": "Email 2 — Confirmation Calendly",
    "interested_email3": "Email 3 — Retrait de liste",
}

STEP_LABELS: dict[PipelineStep, str] = {
    "step_0": "Étape 0 — En attente E1",
    "step_1": "Étape 1 — E1 envoyé",
    "step_2": "Étape 2 — E2 envoyé",
    "step_3": "Étape 3 — Terminé",
    "replies_to_handle": "Réponses à traiter",
}

TEMPLATE_KEYS = (
    "interested_email1",
    "interested_email2",
    "interested_email3",
)

STATUS_LABELS = {
    "not_initialized": "Non initialisé",
    "copy_incomplete": "Copy incomplet",
    "webhook_incomplete": "Webhook manquant",
    "ready": "Prêt",
}


def _queue_to_dataframe(queue: list) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Envoyer": row.envoyer,
                "Email": row.email,
                "Prénom": row.first_name,
                "Statut": row.interest_label,
                "Étape": STEP_LABELS[row.step],
                "Répondu depuis envoi Hercule": "Oui" if row.replied_since_last_send else "Non",
                "Lien OK": "Non" if row.missing_reservation_link else "Oui",
                "Emails déjà envoyés": ", ".join(row.sent_flows) if row.sent_flows else "—",
                "Dernier envoi Hercule": row.last_sent_at or "—",
            }
            for row in queue
        ]
    )


def _render_sequence_form(campaign_id: str, templates: list[dict], *, key_prefix: str) -> None:
    template_map = {t["template_key"]: t for t in templates}
    for key in TEMPLATE_KEYS:
        row = template_map.get(key, {"subject": "", "body_html": ""})
        st.markdown(f"**{FLOW_LABELS.get(key, key)}**")
        sub_key = f"{key_prefix}_sub_{campaign_id}_{key}"
        body_key = f"{key_prefix}_body_{campaign_id}_{key}"
        if sub_key not in st.session_state:
            st.session_state[sub_key] = row.get("subject", "")
        if body_key not in st.session_state:
            st.session_state[body_key] = row.get("body_html", "")
        subject = st.text_input(f"Subject ({key})", key=sub_key)
        body = st.text_area(f"Body HTML ({key})", height=160, key=body_key)
        if st.button(f"Save {key}", key=f"{key_prefix}_save_{campaign_id}_{key}"):
            save_template(campaign_id, key, subject, body)
            for prefix in ("setup", "templates"):
                st.session_state.pop(f"{prefix}_sub_{campaign_id}_{key}", None)
                st.session_state.pop(f"{prefix}_body_{campaign_id}_{key}", None)
            st.success(f"Saved {key}.")
            st.rerun()
    st.caption(
        "Variables: {{reservation_agence_link}}, {{first_name}}, "
        "{{last_name}}, {{company_name}}. Subject unused — thread subject is kept. "
        "`reservation_agence_link` n’est exigé à l’envoi que s’il apparaît dans le HTML."
    )


def _render_conversation_panel(
    *,
    campaign_id: str,
    queue: list,
    selected_emails: set[str],
    step: PipelineStep,
) -> None:
    st.subheader("Conversation Unibox")
    if not queue:
        st.caption("Aucun lead dans cette étape.")
        return

    email_options = [row.email for row in queue]
    default_email = email_options[0]
    if len(selected_emails) == 1:
        default_email = next(iter(selected_emails))

    default_index = email_options.index(default_email) if default_email in email_options else 0
    conv_email = st.selectbox(
        "Lead",
        options=email_options,
        index=default_index,
        format_func=lambda e: next(
            (f"{r.first_name} — {r.email}" if r.first_name else r.email for r in queue if r.email == e),
            e,
        ),
        key=f"conv_lead_{step}_{campaign_id}",
    )

    lead_row = next((r for r in queue if r.email == conv_email), None)
    if not lead_row:
        return

    load_key = f"thread_{campaign_id}_{conv_email}"
    if st.button("Charger la dernière réponse", key=f"load_conv_{step}_{conv_email}"):
        try:
            client = InstantlyClient(require_instantly_api_key())
            messages = fetch_latest_reply(
                client,
                lead_email=conv_email,
                campaign_id=campaign_id,
                lead_first_name=lead_row.first_name,
            )
            st.session_state[load_key] = messages
        except Exception as exc:
            st.error(str(exc))

    if load_key not in st.session_state:
        st.info("Cliquez **Charger la dernière réponse** pour afficher la dernière réponse du lead.")
        return

    messages = st.session_state[load_key]
    interest_status = lead_row.raw.get("lt_interest_status")
    is_no_show = is_no_show_status(
        int(interest_status) if interest_status is not None else None
    )
    detected_flows = set(lead_row.sent_flows)
    derived_step = derive_step_from_flows(detected_flows, is_no_show=is_no_show)

    if messages:
        st.caption(f"**Sujet :** {thread_subject(messages)}")
    st.caption(
        f"**CRM :** {STEP_LABELS[lead_row.step]} · "
        f"**Détecté :** {STEP_LABELS.get(derived_step, derived_step)} "  # type: ignore[arg-type]
        f"({', '.join(sorted(detected_flows)) or '—'})"
    )

    if lead_row.step != derived_step and lead_row.step != "replies_to_handle":
        st.warning(
            f"Écart CRM vs Unibox : étape dashboard **{STEP_LABELS[lead_row.step]}**, "
            f"fingerprints → **{STEP_LABELS.get(derived_step, derived_step)}**."  # type: ignore[arg-type]
        )

    if not messages:
        st.info("Aucune réponse reçue pour ce lead.")
        return

    st.markdown(render_conversation_html(messages), unsafe_allow_html=True)


def _render_pipeline_panel(campaign_id: str, *, send_enabled: bool = True) -> None:
    window_open = is_within_send_window()
    next_slot = next_send_slot()
    next_slot_label = format_paris_slot(next_slot)
    if window_open:
        st.success("Fenêtre d'envoi : lun–ven, 8h–17h (Paris) — **Ouverte**")
    else:
        st.warning(
            "Fenêtre d'envoi : lun–ven, 8h–17h (Paris) — **Fermée**  \n"
            f"Prochain créneau : **{next_slot_label}**"
        )

    if not send_enabled:
        st.warning("Remplissez l'email 1 dans Setup ou Templates avant d'envoyer.")

    step = st.radio(
        "Étape CRM",
        options=PIPELINE_STEPS,
        format_func=lambda s: STEP_LABELS[s],
        horizontal=True,
        key="envois_step",
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        max_leads = st.number_input(
            "Max leads Instantly",
            min_value=1,
            max_value=500,
            value=100,
            key="max_pipeline",
        )
    with col2:
        dry_run = st.checkbox(
            "Mode test (dry run)",
            value=True,
            key="dry_pipeline",
            help=(
                "En mode test : le bouton Envoyer affiche uniquement combien de leads "
                "seraient traités — aucun email Instantly, aucun event Supabase, "
                "aucun changement d'étape. Décochez pour l'envoi réel."
            ),
        )
    with col3:
        default_flow = DEFAULT_FLOW_BY_STEP[step]
        if default_flow:
            flow_labels = [FLOW_LABELS[f] for f in SENDABLE_FLOWS]
            default_index = SENDABLE_FLOWS.index(default_flow)
            chosen_flow_label = st.selectbox(
                "Email to send",
                options=flow_labels,
                index=default_index,
                key="flow_pipeline",
            )
            flow: Flow | None = SENDABLE_FLOWS[flow_labels.index(chosen_flow_label)]
        else:
            st.caption("Pas d'envoi auto depuis cette étape — déplacez le lead d'abord.")
            flow = None
    with col4:
        refresh = st.button("Fetch Interested + sync CRM", key="fetch_pipeline")

    if dry_run:
        st.caption(
            "Mode test actif — le bouton Envoyer n'enverra rien. "
            "Utilisez Aperçu email pour lire le contenu."
        )

    show_preview = st.checkbox("Aperçu email", value=False, key="preview_pipeline")
    if show_preview and flow:
        preview_lead = None
        cache_key = f"pipeline_{campaign_id}"
        cached_queue = st.session_state.get(cache_key)
        if cached_queue:
            preview_options = ["Variables par défaut"] + [row.email for row in cached_queue]
            preview_choice = st.selectbox(
                "Aperçu avec le lead",
                options=preview_options,
                key="preview_lead_pipeline",
            )
            if preview_choice != "Variables par défaut":
                match = next((row for row in cached_queue if row.email == preview_choice), None)
                if match:
                    preview_lead = match.raw
        try:
            html = render_template_html(flow, preview_lead, campaign_id=campaign_id)
            with st.expander(f"Aperçu — {FLOW_LABELS[flow]}", expanded=True):
                st.markdown(html, unsafe_allow_html=True)
        except Exception as exc:
            st.error(f"Impossible de charger l'aperçu : {exc}")

    cache_key = f"pipeline_{campaign_id}"
    fetch_meta_key = "fetch_meta_pipeline"
    editor_key = f"editor_pipeline_{campaign_id}_{step}"
    current_meta = (campaign_id, int(max_leads))

    if st.session_state.get(fetch_meta_key) != current_meta:
        st.session_state.pop(cache_key, None)
        st.session_state[fetch_meta_key] = current_meta

    if refresh:
        progress_bar = st.progress(0.0)
        status_text = st.empty()
        try:
            client = InstantlyClient(require_instantly_api_key())

            def on_progress(current: int, total: int, message: str) -> None:
                progress_bar.progress(min(current / max(total, 1), 1.0))
                status_text.caption(message)

            st.session_state[cache_key] = fetch_pipeline_leads(
                campaign_id=campaign_id,
                max_leads=int(max_leads),
                client=client,
                on_progress=on_progress,
            )
            for key in list(st.session_state.keys()):
                if str(key).startswith(f"editor_pipeline_{campaign_id}_"):
                    st.session_state.pop(key, None)
            progress_bar.empty()
            status_text.empty()
        except Exception as exc:
            progress_bar.empty()
            status_text.empty()
            st.error(str(exc))
            return

    all_queue = st.session_state.get(cache_key)
    if all_queue is None:
        st.info("Cliquez sur **Fetch Interested + sync CRM** pour charger les leads.")
        return

    queue = leads_for_step(all_queue, step)
    counts = {s: len(leads_for_step(all_queue, s)) for s in PIPELINE_STEPS}
    st.caption(
        " · ".join(f"{STEP_LABELS[s].split(' — ')[0]}: {counts[s]}" for s in PIPELINE_STEPS)
    )
    st.caption(f"{len(queue)} lead(s) dans **{STEP_LABELS[step]}**")

    if not queue:
        st.warning("Aucun lead dans cette étape.")
        return

    missing_links = sum(1 for row in queue if row.missing_reservation_link)
    if missing_links:
        st.warning(f"{missing_links} lead(s) missing `reservation_agence_link` — they will fail on send.")

    if editor_key not in st.session_state:
        st.session_state[editor_key] = _queue_to_dataframe(queue)

    left_col, right_col = st.columns([3, 2])

    with left_col:
        sel_col1, sel_col2, move_col, _ = st.columns([1, 1, 2, 1])
        with sel_col1:
            if st.button("Tout sélectionner", key=f"select_all_{step}"):
                df_all = st.session_state[editor_key].copy()
                df_all["Envoyer"] = True
                st.session_state[editor_key] = df_all
                st.rerun()
        with sel_col2:
            if st.button("Tout désélectionner", key=f"deselect_all_{step}"):
                df_none = st.session_state[editor_key].copy()
                df_none["Envoyer"] = False
                st.session_state[editor_key] = df_none
                st.rerun()
        with move_col:
            target_step = st.selectbox(
                "Déplacer les cochés vers",
                options=["—"] + list(PIPELINE_STEPS),
                format_func=lambda s: "—" if s == "—" else STEP_LABELS[s],
                key=f"move_target_{step}",
            )

        edited = st.data_editor(
            st.session_state[editor_key],
            column_config={
                "Envoyer": st.column_config.CheckboxColumn("Envoyer", default=True),
            },
            disabled=[
                "Email",
                "Prénom",
                "Statut",
                "Étape",
                "Répondu depuis envoi Hercule",
                "Lien OK",
                "Emails déjà envoyés",
                "Dernier envoi Hercule",
            ],
            hide_index=True,
            use_container_width=True,
            key=f"data_editor_{step}_{campaign_id}",
        )
        st.session_state[editor_key] = edited

        selected_emails = {
            str(row["Email"]).strip().lower()
            for _, row in edited.iterrows()
            if row["Envoyer"]
        }
        selected_count = len(selected_emails)
        if flow:
            st.write(f"**{selected_count}** lead(s) selected → **{FLOW_LABELS[flow]}**")
            if selected_count > 0:
                if window_open:
                    st.caption(f"{selected_count} lead(s) → envoi **immédiat**")
                else:
                    st.caption(
                        f"{selected_count} lead(s) → programmés pour **{next_slot_label}**"
                    )
        else:
            st.write(f"**{selected_count}** lead(s) selected")

        if st.button("Déplacer les leads cochés", key=f"move_{step}"):
            if target_step == "—" or not selected_emails:
                st.warning("Cochez des leads et choisissez une étape cible.")
            else:
                move_pipeline_leads(campaign_id, list(selected_emails), target_step)
                for row in all_queue:
                    if row.email in selected_emails:
                        row.step = target_step
                st.session_state[cache_key] = all_queue
                st.success(f"{selected_count} lead(s) déplacé(s) vers {STEP_LABELS[target_step]}.")
                st.rerun()

        send_clicked = st.button(
            "Envoyer aux leads cochés",
            key=f"send_{step}",
            disabled=not send_enabled or not flow,
        )
        if flow and send_clicked:
            selected_leads = [row.raw for row in queue if row.email in selected_emails]

            if dry_run:
                preview = dispatch_bulk(
                    campaign_id=campaign_id,
                    flow=flow,
                    leads=selected_leads,
                    dry_run=True,
                )
                if window_open:
                    st.info(
                        f"Mode test : **{preview.sent}** lead(s) seraient envoyés "
                        f"**maintenant**, **{preview.scheduled}** programmé(s), "
                        f"**{preview.skipped}** ignoré(s)."
                    )
                else:
                    slot_text = preview.scheduled_slot_label or next_slot_label
                    st.info(
                        f"Mode test : **{preview.scheduled}** lead(s) seraient "
                        f"programmés pour **{slot_text}**, "
                        f"**{preview.skipped}** ignoré(s)."
                    )
            else:
                log_box = st.empty()
                logs: list[str] = []
                progress = st.progress(0.0)

                def on_progress(email: str) -> None:
                    logs.append(email)
                    log_box.text("\n".join(logs[-12:]))
                    progress.progress(min(len(logs) / max(len(selected_leads), 1), 1.0))

                with st.spinner("Sending…"):
                    result = dispatch_bulk(
                        campaign_id=campaign_id,
                        flow=flow,
                        leads=selected_leads,
                        dry_run=False,
                        on_progress=on_progress,
                    )

                if result.sent > 0:
                    st.toast(f"{result.sent} email(s) envoyé(s) maintenant", icon="✅")
                if result.scheduled > 0:
                    slot_text = result.scheduled_slot_label or next_slot_label
                    st.toast(
                        f"{result.scheduled} email(s) programmé(s) pour {slot_text}",
                        icon="🕐",
                    )

                st.session_state.pop(cache_key, None)
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Envoyés", result.sent)
                m2.metric("Programmés", result.scheduled)
                m3.metric("Ignorés", result.skipped)
                m4.metric("Échecs", result.failed)
                if result.errors:
                    st.error("\n".join(result.errors[:10]))

    with right_col:
        _render_conversation_panel(
            campaign_id=campaign_id,
            queue=queue,
            selected_emails=selected_emails,
            step=step,
        )


try:
    api_key = require_instantly_api_key()
    instantly_client = InstantlyClient(api_key)
    campaigns = list_all_campaigns()
except ValueError as exc:
    st.error(str(exc))
    st.stop()

campaign_options = {
    format_resource_label(c.get("name"), str(c.get("id") or "")): str(c.get("id") or "")
    for c in campaigns
    if c.get("id")
}

if not campaign_options:
    st.warning("No Instantly campaigns found.")
    st.stop()

default_campaign = env("INSTANTLY_BYPASS_CAMPAIGN_ID")
default_label = next(
    (label for label, cid in campaign_options.items() if cid == default_campaign),
    next(iter(campaign_options.keys()), ""),
)
selected_label = st.selectbox(
    "Campagne Instantly",
    options=list(campaign_options.keys()),
    index=list(campaign_options.keys()).index(default_label)
    if default_label in campaign_options
    else 0,
    key="global_campaign",
)
selected_campaign_id = campaign_options[selected_label]
selected_campaign_name = selected_label.split(" (")[0]
selected_config = get_config(selected_campaign_id)
templates = list_templates(selected_campaign_id)
public_url = webhook_public_url()
webhooks = instantly_client.list_webhooks()
matched_webhook = find_campaign_webhook(
    webhooks,
    campaign_id=selected_campaign_id,
    target_url=public_url,
)
existing_webhook = find_campaign_webhook(
    webhooks,
    campaign_id=selected_campaign_id,
    target_url=public_url,
    require_active=False,
)
inactive_webhook = (
    existing_webhook
    if existing_webhook and not is_webhook_active(existing_webhook)
    else None
)
if matched_webhook and selected_config:
    live_webhook_id = str(matched_webhook.get("id") or "")
    stored_webhook_id = str(selected_config.get("webhook_id") or "")
    if live_webhook_id and live_webhook_id != stored_webhook_id:
        sync_webhook_id(selected_campaign_id, live_webhook_id)
        selected_config = get_config(selected_campaign_id)
onboarding_status = derive_onboarding_status(
    has_config=selected_config is not None,
    has_webhook=matched_webhook is not None,
    copy_complete=copy_is_complete(templates),
)
webhook_miss_reason = (
    explain_webhook_miss(
        webhooks,
        campaign_id=selected_campaign_id,
        target_url=public_url,
    )
    if onboarding_status == "webhook_incomplete"
    else None
)
url_error = webhook_url_error()

status_col, action_col = st.columns([3, 1])
with status_col:
    if onboarding_status == "ready":
        st.success(f"Statut : **{STATUS_LABELS[onboarding_status]}**")
    elif onboarding_status == "copy_incomplete":
        st.info(f"Statut : **{STATUS_LABELS[onboarding_status]}** — remplissez Email 1, 2 et 3.")
    else:
        st.warning(f"Statut : **{STATUS_LABELS[onboarding_status]}**")
    if webhook_miss_reason:
        st.caption(webhook_miss_reason)

if url_error:
    st.error(url_error)

global_webhook_on = webhook_auto_send_enabled()
if not global_webhook_on:
    st.error(
        "Kill-switch global webhook : **en pause** (`instantly_bypass_settings`). "
        "Aucun E1 auto ne part, quelle que soit la campagne."
    )

with action_col:
    can_init = (
        onboarding_status in {"not_initialized", "webhook_incomplete"}
        and is_valid_webhook_target_url(public_url)
    )
    init_label = "Réactiver le webhook" if inactive_webhook else "Initialiser"
    if st.button(init_label, disabled=not can_init, key="init_campaign"):
        try:
            initialize_campaign(
                instantly_client,
                campaign_id=selected_campaign_id,
                campaign_name=selected_campaign_name,
                target_url=public_url,
                secret=webhook_secret(),
            )
            if inactive_webhook:
                st.success("Webhook Instantly réactivé (headers + resume).")
            else:
                st.success("Campagne initialisée (config, templates, webhook).")
            st.rerun()
        except Exception as exc:
            st.error(str(exc))

TAB_WORKFLOW, TAB_SETUP, TAB_TEMPLATES, TAB_ENVOIS, TAB_ANALYTICS = st.tabs(
    ["Workflow", "Setup", "Templates", "Envois", "Analytics"]
)

with TAB_WORKFLOW:
    st.subheader("CRM pipeline")
    campaign_webhook_on = bool(
        selected_config and selected_config.get("webhook_auto_send_enabled", True)
    )
    if onboarding_status == "webhook_incomplete":
        if inactive_webhook:
            error_at = str(inactive_webhook.get("timestamp_error") or "").strip()
            since = f" (coupé le {error_at})" if error_at else ""
            st.error(
                f"Webhook Instantly inactif{since} — aucun E1 auto ne partira. "
                "Cliquez **Réactiver le webhook**."
            )
        else:
            st.error(
                "Webhook Instantly manquant — aucun E1 auto ne partira. "
                "Cliquez **Initialiser** (après correction de l'URL si nécessaire)."
            )
    elif not global_webhook_on:
        st.warning("Kill-switch global en pause — voir le bandeau en haut de page.")
    elif not campaign_webhook_on:
        st.warning("Webhook auto-send (cette campagne) : **En pause**. Activez-le dans Setup.")
    elif onboarding_status == "ready":
        st.success("Webhook auto-send (cette campagne) : **Actif**")
    elif selected_config:
        st.info(
            "Webhook auto-send activé en config, mais la campagne n'est pas encore prête "
            "(copy ou webhook incomplet)."
        )
    st.markdown(
        """
1. **Étape 0** — lead Interested, pas encore d'email de suivi Hercule. Webhook `lead_interested` + envoi E1 (ou envoi manuel).
2. **Étape 1** — E1 précisions envoyé. Prochain envoi : E2 confirmation.
3. **Étape 2** — E2 envoyé. Prochain envoi : E3 clôture → Instantly **Not Interested (-1)**.
4. **Étape 3** — séquence terminée.
5. **Réponses à traiter** — le lead a répondu en étape 1, 2 ou 3 (détection Unibox au Fetch). Déplacement manuel possible.
6. Le tag Instantly **Interested** ne change qu'à l'envoi de E3. L'étape CRM est la seule source de vérité.
        """
    )
    st.info(f"Production webhook URL: `{public_url}`")

with TAB_SETUP:
    st.subheader("Onboarding")
    if onboarding_status == "not_initialized":
        st.markdown(
            "Cette campagne Instantly n’a pas encore de config Hercule. "
            "**Initialiser** crée la ligne config, des templates E1–E3 vides, "
            "et enregistre le webhook `lead_interested`."
        )
    elif onboarding_status == "copy_incomplete":
        st.markdown("Config présente — remplissez Email 1, 2 et 3 ci-dessous.")
    elif onboarding_status == "webhook_incomplete":
        if inactive_webhook:
            st.markdown(
                "Config présente mais le webhook Instantly est **inactif** "
                "(échecs de livraison). Cliquez **Réactiver le webhook**."
            )
        else:
            st.markdown(
                "Config présente mais webhook Instantly manquant — cliquez **Initialiser**."
            )
        if webhook_miss_reason:
            st.warning(webhook_miss_reason)
    else:
        st.markdown("Campagne prête. Vous pouvez encore éditer le copy ou mettre le webhook en pause.")

    if selected_config:
        st.divider()
        st.subheader("Webhook auto-send (cette campagne)")
        campaign_enabled = bool(selected_config.get("webhook_auto_send_enabled", True))
        if onboarding_status == "webhook_incomplete":
            if inactive_webhook:
                st.error(
                    "Auto-send configuré, mais webhook Instantly inactif — E1 auto impossible."
                )
            else:
                st.error(
                    "Auto-send configuré, mais webhook Instantly absent — E1 auto impossible."
                )
        elif campaign_enabled:
            st.success("Auto-send webhook: **Actif**")
        else:
            st.warning("Auto-send webhook: **En pause**")
        toggle_col1, toggle_col2 = st.columns(2)
        with toggle_col1:
            if st.button(
                "Activer le webhook auto-send",
                disabled=campaign_enabled,
                key="webhook_enable",
            ):
                set_campaign_webhook_auto_send_enabled(selected_campaign_id, True)
                st.rerun()
        with toggle_col2:
            if st.button(
                "Mettre en pause",
                disabled=not campaign_enabled,
                key="webhook_pause",
            ):
                set_campaign_webhook_auto_send_enabled(selected_campaign_id, False)
                st.rerun()
        st.caption(
            "Ce réglage est **par campagne**. Le kill-switch global reste dans "
            "`instantly_bypass_settings` (pause d’urgence toutes campagnes)."
        )

        st.code(public_url)
        if url_error:
            st.error(url_error)

        st.divider()
        st.subheader("Séquences emails")
        _render_sequence_form(selected_campaign_id, templates, key_prefix="setup")

    st.divider()
    st.subheader("Webhooks Instantly")
    if webhooks:
        st.dataframe(
            [
                {
                    "id": w.get("id"),
                    "name": w.get("name"),
                    "event_type": w.get("event_type"),
                    "campaign": w.get("campaign") or w.get("campaign_id"),
                    "url": w.get("target_hook_url"),
                    "status": w.get("status"),
                    "timestamp_error": w.get("timestamp_error"),
                }
                for w in webhooks
            ],
            use_container_width=True,
        )
    else:
        st.caption("No webhooks registered.")

    to_delete = st.selectbox(
        "Delete webhook",
        options=["—"] + [str(w.get("id")) for w in webhooks if w.get("id")],
    )
    if st.button("Delete selected webhook", disabled=to_delete == "—"):
        instantly_client.delete_webhook(to_delete)
        st.success("Webhook deleted.")
        st.rerun()

with TAB_TEMPLATES:
    st.subheader("Email templates")
    if not selected_config:
        st.warning("Initialisez la campagne dans Setup avant d’éditer les templates.")
    else:
        _render_sequence_form(selected_campaign_id, templates, key_prefix="templates")

with TAB_ENVOIS:
    st.subheader("Envois")
    if not selected_config:
        st.warning("Initialisez cette campagne (bouton **Initialiser**) avant d’ouvrir le CRM.")
    else:
        _render_pipeline_panel(
            selected_campaign_id,
            send_enabled=e1_copy_is_ready(templates),
        )

with TAB_ANALYTICS:
    st.subheader("Live analytics")
    try:
        stats = fetch_analytics(selected_campaign_id)
    except ValueError as exc:
        st.error(str(exc))
        st.stop()

    c1, c2, c3 = st.columns(3)
    c1.metric("Instant emails sent", stats["total_sent"])
    c2.metric(
        "Avg latency (ms)",
        stats["avg_latency_ms"] if stats["avg_latency_ms"] is not None else "—",
    )
    c3.metric("Failed events", stats["failed_count"])

    if stats["recent_errors"]:
        st.subheader("Recent errors")
        st.dataframe(stats["recent_errors"], use_container_width=True)
    else:
        st.caption("No failed events for this campaign.")
