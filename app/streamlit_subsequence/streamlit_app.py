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
    require_instantly_api_key,
    webhook_auto_send_enabled,
    webhook_public_url,
    webhook_secret,
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
from shared.instantly_client import InstantlyClient, format_resource_label, list_all_campaigns
from supabase_repo import (
    fetch_analytics,
    list_configs,
    list_templates,
    save_config,
    save_template,
    set_webhook_auto_send_enabled,
)

st.set_page_config(page_title="Streamlit Subsequence", layout="wide")
st.title("Streamlit Subsequence")
st.caption("CRM étapes 0–3 → Unibox reply → envois contrôlés par l’opérateur.")

TAB_WORKFLOW, TAB_SETUP, TAB_TEMPLATES, TAB_ENVOIS, TAB_ANALYTICS = st.tabs(
    ["Workflow", "Setup", "Templates", "Envois", "Analytics"]
)

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


def _config_labels(configs: list[dict]) -> dict[str, str]:
    return {
        f"{c.get('campaign_name', c['campaign_id'])} ({c['campaign_id'][:8]}…)": c["campaign_id"]
        for c in configs
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


def _render_pipeline_panel(configs: list[dict]) -> None:
    if not configs:
        st.warning("Save at least one campaign config in Setup.")
        return

    labels = _config_labels(configs)
    chosen_label = st.selectbox(
        "Campaign",
        options=list(labels.keys()),
        key="campaign_pipeline",
    )
    campaign_id = labels[chosen_label]

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
            html = render_template_html(flow, preview_lead)
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

    if flow and st.button("Envoyer aux leads cochés", key=f"send_{step}"):
        selected_leads = [row.raw for row in queue if row.email in selected_emails]

        if dry_run:
            st.info(
                f"Mode test : enverrait `{flow}` à **{len(selected_leads)}** lead(s). "
                "Aucun email Instantly, aucun event Supabase, aucun changement d'étape."
            )
            return

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

        st.session_state.pop(cache_key, None)
        st.metric("Sent", result.sent)
        st.metric("Skipped", result.skipped)
        st.metric("Failed", result.failed)
        if result.errors:
            st.error("\n".join(result.errors[:10]))


with TAB_WORKFLOW:
    st.subheader("CRM pipeline")
    if webhook_auto_send_enabled():
        st.success("Webhook auto-send: **Actif** (réglage Supabase — voir Setup)")
    else:
        st.warning(
            "Webhook auto-send: **En pause**. Activez-le dans Setup → Webhook registration."
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
    st.info(f"Production webhook URL: `{webhook_public_url()}`")

with TAB_SETUP:
    st.subheader("Campaign configuration")

    try:
        api_key = require_instantly_api_key()
        client = InstantlyClient(api_key)
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

    existing_configs = {c["campaign_id"]: c for c in list_configs()}
    default_campaign = env("INSTANTLY_BYPASS_CAMPAIGN_ID")
    default_label = next(
        (label for label, cid in campaign_options.items() if cid == default_campaign),
        next(iter(campaign_options.keys()), ""),
    )

    selected_label = st.selectbox(
        "Campaign",
        options=list(campaign_options.keys()),
        index=list(campaign_options.keys()).index(default_label)
        if default_label in campaign_options
        else 0,
    )
    selected_campaign_id = campaign_options[selected_label]

    if st.button("Save campaign config"):
        save_config(
            {
                "campaign_id": selected_campaign_id,
                "campaign_name": selected_label.split(" (")[0],
            }
        )
        st.success("Config saved.")

    st.divider()
    st.subheader("Webhook registration")

    webhook_enabled = webhook_auto_send_enabled()
    if webhook_enabled:
        st.success("Auto-send webhook: **Actif**")
    else:
        st.warning("Auto-send webhook: **En pause**")

    toggle_col1, toggle_col2 = st.columns(2)
    with toggle_col1:
        if st.button(
            "Activer le webhook auto-send",
            disabled=webhook_enabled,
            key="webhook_enable",
        ):
            set_webhook_auto_send_enabled(True)
            st.rerun()
    with toggle_col2:
        if st.button(
            "Mettre en pause",
            disabled=not webhook_enabled,
            key="webhook_pause",
        ):
            set_webhook_auto_send_enabled(False)
            st.rerun()

    st.caption(
        "Ce réglage s'applique à la production et au local (même base Supabase). "
        "Mettre en pause depuis Streamlit local affecte immédiatement le webhook Vercel."
    )

    st.code(webhook_public_url())
    secret = webhook_secret()
    if not secret:
        st.warning("Set INSTANTLY_BYPASS_WEBHOOK_SECRET (or CRON_SECRET) before registering.")

    webhooks = client.list_webhooks()
    st.write("Existing Instantly webhooks")
    if webhooks:
        st.dataframe(
            [
                {
                    "name": w.get("name"),
                    "event_type": w.get("event_type"),
                    "url": w.get("target_hook_url"),
                    "status": w.get("status"),
                }
                for w in webhooks
            ],
            use_container_width=True,
        )
    else:
        st.caption("No webhooks registered.")

    col1, col2 = st.columns(2)
    with col1:
        if st.button(
            "Register lead_interested webhook",
            disabled=not secret or not webhook_enabled,
            help="Activez le webhook auto-send avant d'enregistrer chez Instantly.",
        ):
            headers = {"Authorization": f"Bearer {secret}"}
            created = client.create_webhook(
                target_hook_url=webhook_public_url(),
                event_type="lead_interested",
                name="Hercule Interested Bypass",
                campaign=selected_campaign_id,
                headers=headers,
            )
            st.success(f"Webhook created: {created.get('id', 'ok')}")
    with col2:
        to_delete = st.selectbox(
            "Delete webhook",
            options=["—"] + [str(w.get("id")) for w in webhooks if w.get("id")],
        )
        if st.button("Delete selected webhook", disabled=to_delete == "—"):
            client.delete_webhook(to_delete)
            st.success("Webhook deleted.")

with TAB_TEMPLATES:
    st.subheader("Email templates")
    templates = list_templates()
    template_map = {t["template_key"]: t for t in templates}

    for key in TEMPLATE_KEYS:
        row = template_map.get(key, {"subject": "", "body_html": ""})
        st.markdown(f"**{key}**")
        subject = st.text_input(f"Subject ({key})", value=row.get("subject", ""), key=f"sub_{key}")
        body = st.text_area(
            f"Body HTML ({key})",
            value=row.get("body_html", ""),
            height=160,
            key=f"body_{key}",
        )
        if st.button(f"Save {key}", key=f"save_{key}"):
            save_template(key, subject, body)
            st.success(f"Saved {key}.")

    st.caption(
        "Variables: {{reservation_agence_link}}, {{first_name}}, "
        "{{last_name}}, {{company_name}}. Subject unused — thread subject is kept."
    )

with TAB_ENVOIS:
    st.subheader("Envois")
    configs = list_configs()
    _render_pipeline_panel(configs)

with TAB_ANALYTICS:
    st.subheader("Live analytics")
    try:
        stats = fetch_analytics()
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
        st.caption("No failed events.")
