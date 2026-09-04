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
    SEQUENCE_FLOWS,
    Flow,
    Sequence,
    dispatch_bulk,
    fetch_sequence_leads,
)
from shared.instantly_client import InstantlyClient, format_resource_label, list_all_campaigns
from supabase_repo import fetch_analytics, list_configs, list_templates, save_config, save_template

st.set_page_config(page_title="Streamlit Subsequence", layout="wide")
st.title("Streamlit Subsequence")
st.caption("Interest-status fetch → Unibox reply → operator-controlled sends.")

TAB_WORKFLOW, TAB_SETUP, TAB_TEMPLATES, TAB_ENVOIS, TAB_ANALYTICS = st.tabs(
    ["Workflow", "Setup", "Templates", "Envois", "Analytics"]
)

FLOW_LABELS: dict[Flow, str] = {
    "interested_email1": "Email 1 — Précisions + audit (webhook auto ou manuel)",
    "interested_email2": "Email 2 — Confirmation Calendly",
    "interested_email3": "Email 3 — Retrait de liste",
    "no_show_email1": "Email 1 — Confirmation Calendly",
    "no_show_email2": "Email 2 — Retrait agence",
}

TEMPLATE_KEYS = (
    "interested_email1",
    "interested_email2",
    "interested_email3",
    "no_show_email1",
    "no_show_email2",
)


def _config_labels(configs: list[dict]) -> dict[str, str]:
    return {
        f"{c.get('campaign_name', c['campaign_id'])} ({c['campaign_id'][:8]}…)": c["campaign_id"]
        for c in configs
    }


def _render_sequence_panel(
    *,
    sequence: Sequence,
    fetch_label: str,
    configs: list[dict],
) -> None:
    if not configs:
        st.warning("Save at least one campaign config in Setup.")
        return

    labels = _config_labels(configs)
    chosen_label = st.selectbox(
        "Campaign",
        options=list(labels.keys()),
        key=f"campaign_{sequence}",
    )
    campaign_id = labels[chosen_label]

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        max_leads = st.number_input(
            "Max leads",
            min_value=1,
            max_value=500,
            value=100,
            key=f"max_{sequence}",
        )
    with col2:
        dry_run = st.checkbox("Dry run", value=True, key=f"dry_{sequence}")
    with col3:
        flow_options = SEQUENCE_FLOWS[sequence]
        flow_labels = [FLOW_LABELS[f] for f in flow_options]
        chosen_flow_label = st.selectbox(
            "Email to send",
            options=flow_labels,
            key=f"flow_{sequence}",
        )
        flow = flow_options[flow_labels.index(chosen_flow_label)]
    with col4:
        refresh = st.button(fetch_label, key=f"fetch_{sequence}")

    cache_key = f"sequence_{sequence}_{campaign_id}"
    if refresh or cache_key not in st.session_state:
        with st.spinner("Fetching leads…"):
            try:
                client = InstantlyClient(require_instantly_api_key())
                st.session_state[cache_key] = fetch_sequence_leads(
                    campaign_id=campaign_id,
                    sequence=sequence,
                    max_leads=int(max_leads),
                    client=client,
                )
            except Exception as exc:
                st.error(str(exc))
                return

    queue = st.session_state.get(cache_key, [])
    st.caption(f"{len(queue)} lead(s) with matching interest status")

    if not queue:
        return

    missing_links = sum(1 for row in queue if row.missing_reservation_link)
    if missing_links:
        st.warning(f"{missing_links} lead(s) missing `reservation_agence_link` — they will fail on send.")

    df = pd.DataFrame(
        [
            {
                "Envoyer": row.envoyer,
                "Email": row.email,
                "Prénom": row.first_name,
                "Statut": row.interest_label,
                "Répondu depuis envoi Hercule": "Oui" if row.replied_since_last_send else "Non",
                "Lien OK": "Non" if row.missing_reservation_link else "Oui",
                "Emails déjà envoyés": ", ".join(row.sent_flows) if row.sent_flows else "—",
                "Dernier envoi Hercule": row.last_sent_at or "—",
            }
            for row in queue
        ]
    )

    edited = st.data_editor(
        df,
        column_config={
            "Envoyer": st.column_config.CheckboxColumn("Envoyer", default=True),
        },
        disabled=[
            "Email",
            "Prénom",
            "Statut",
            "Répondu depuis envoi Hercule",
            "Lien OK",
            "Emails déjà envoyés",
            "Dernier envoi Hercule",
        ],
        hide_index=True,
        use_container_width=True,
        key=f"editor_{sequence}",
    )

    selected_count = int(edited["Envoyer"].sum())
    st.write(f"**{selected_count}** lead(s) selected → **{FLOW_LABELS[flow]}**")

    if st.button(f"Envoyer aux leads cochés", key=f"send_{sequence}"):
        selected_emails = {
            str(row["Email"]).strip().lower()
            for _, row in edited.iterrows()
            if row["Envoyer"]
        }
        selected_leads = [row.raw for row in queue if row.email in selected_emails]

        if dry_run:
            st.info(f"Dry run: would send `{flow}` to {len(selected_leads)} lead(s).")
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
    st.subheader("Interest-status model")
    if webhook_auto_send_enabled():
        st.success("Webhook auto-send: **ENABLED** (`INSTANTLY_BYPASS_WEBHOOK_ENABLED=true`)")
    else:
        st.warning(
            "Webhook auto-send: **PAUSED**. Set `INSTANTLY_BYPASS_WEBHOOK_ENABLED=true` on Vercel when ready."
        )
    st.markdown(
        """
1. **Sequence Interested** — fetch `FILTER_LEAD_INTERESTED`; Email 1 auto via webhook (+ manual catch-up).
2. **Sequence No Show** — fetch `FILTER_LEAD_NO_SHOW`; all emails manual.
3. **One fetch per sequence** — operator picks which email to send.
4. **Reply detection** — unchecked by default if lead replied since any Hercule send.
5. **Final emails** (Interested E3, No Show E2) → Instantly status **Not Interested (-1)**.
6. All sends are **Unibox replies** in the existing thread (no custom subject).
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

    if not webhook_auto_send_enabled():
        st.warning(
            "Auto-send is paused — do not register the Instantly webhook until "
            "`INSTANTLY_BYPASS_WEBHOOK_ENABLED=true` is set in production."
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
            disabled=not secret or not webhook_auto_send_enabled(),
            help="Enable INSTANTLY_BYPASS_WEBHOOK_ENABLED=true before registering.",
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
        "Variables: {{reservation_agence_link}}, {{accountSignature}}, {{first_name}}, "
        "{{last_name}}, {{company_name}}. Subject unused — thread subject is kept."
    )

with TAB_ENVOIS:
    st.subheader("Envois")
    configs = list_configs()

    seq1_tab, seq2_tab = st.tabs(["Sequence Interested", "Sequence No Show"])

    with seq1_tab:
        _render_sequence_panel(
            sequence="interested",
            fetch_label="Fetch interested leads",
            configs=configs,
        )

    with seq2_tab:
        _render_sequence_panel(
            sequence="no_show",
            fetch_label="Fetch no-show leads",
            configs=configs,
        )

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
