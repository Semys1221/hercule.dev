"""Instantly subsequence bypass — Streamlit operations dashboard."""

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
    webhook_public_url,
    webhook_secret,
)
from send_queue import Step, dispatch_bulk, fetch_queue
from shared.instantly_client import InstantlyClient, format_resource_label, list_all_campaigns
from supabase_repo import fetch_analytics, list_configs, list_templates, save_config, save_template

st.set_page_config(page_title="Streamlit Subsequence", layout="wide")
st.title("Streamlit Subsequence")
st.caption("Webhook → Unibox Reply API → dashboard bulk sends. No cron.")

TAB_WORKFLOW, TAB_SETUP, TAB_TEMPLATES, TAB_ENVOIS, TAB_ANALYTICS = st.tabs(
    ["Workflow", "Setup", "Templates", "Envois", "Analytics"]
)

WORKFLOW_MERMAID = """
flowchart TB
  subgraph prodOnly [Production only]
    WH[lead_interested webhook]
    NextJS["/api/webhooks/instantly"]
    E1Auto[Positive Email 1 auto]
    WH --> NextJS --> E1Auto
  end

  subgraph dashboard [Streamlit dashboard local or prod]
    Queue[Lead queue with checkboxes]
    ReplyCheck[Unibox reply since last send]
    StatusFilter[Hide non-Interested Positive queues]
    BulkSend[Bulk send button]
    Queue --> ReplyCheck --> StatusFilter --> BulkSend
  end
"""

POSITIVE_STEPS: list[tuple[Step, str]] = [
    ("interested_email1", "Email 1 — Rattrapage manuel"),
    ("interested_email2", "Email 2"),
    ("interested_email3", "Email 3"),
]

NO_REPLY_STEPS: list[tuple[Step, str]] = [
    ("no_reply_email1", "Email 1 — Envoi manuel"),
    ("no_reply_email2", "Email 2"),
]

TEMPLATE_KEYS = (
    "interested_email1",
    "interested_email2",
    "interested_email3",
    "no_reply_email1",
    "no_reply_email2",
)


def _config_labels(configs: list[dict]) -> dict[str, str]:
    return {
        f"{c.get('campaign_name', c['campaign_id'])} ({c['campaign_id'][:8]}…)": c["campaign_id"]
        for c in configs
    }


def _render_send_section(
    *,
    step: Step,
    title: str,
    sequence: str,
    configs: list[dict],
    config_by_id: dict[str, dict],
) -> None:
    st.markdown(f"**{title}**")
    if not configs:
        st.warning("Save at least one campaign config in Setup.")
        return

    labels = _config_labels(configs)
    chosen_label = st.selectbox(
        "Campaign",
        options=list(labels.keys()),
        key=f"campaign_{step}",
    )
    campaign_id = labels[chosen_label]
    config = config_by_id[campaign_id]

    col1, col2, col3 = st.columns(3)
    with col1:
        max_leads = st.number_input(
            "Max leads",
            min_value=1,
            max_value=500,
            value=100,
            key=f"max_{step}",
        )
    with col2:
        dry_run = st.checkbox("Dry run", value=True, key=f"dry_{step}")
    with col3:
        refresh = st.button("Refresh leads", key=f"refresh_{step}")

    cache_key = f"queue_{step}_{campaign_id}"
    if refresh or cache_key not in st.session_state:
        with st.spinner("Loading queue…"):
            try:
                client = InstantlyClient(require_instantly_api_key())
                st.session_state[cache_key] = fetch_queue(
                    campaign_id=campaign_id,
                    step=step,
                    sequence=sequence,  # type: ignore[arg-type]
                    config=config,
                    max_leads=int(max_leads),
                    client=client,
                )
            except Exception as exc:
                st.error(str(exc))
                return

    queue = st.session_state.get(cache_key, [])
    st.caption(f"{len(queue)} eligible lead(s)")

    if not queue:
        return

    df = pd.DataFrame(
        [
            {
                "Envoyer": row.envoyer,
                "Email": row.email,
                "Prénom": row.first_name,
                "Statut": row.interest_label,
                "Répondu depuis dernier envoi": "Oui" if row.replied_since_last else "Non",
                "Dernier envoi": row.last_sent_at or "—",
            }
            for row in queue
        ]
    )

    edited = st.data_editor(
        df,
        column_config={
            "Envoyer": st.column_config.CheckboxColumn("Envoyer", default=True),
        },
        disabled=["Email", "Prénom", "Statut", "Répondu depuis dernier envoi", "Dernier envoi"],
        hide_index=True,
        use_container_width=True,
        key=f"editor_{step}",
    )

    selected_count = int(edited["Envoyer"].sum())
    st.write(f"**{selected_count}** lead(s) selected")

    if st.button(f"Envoyer {title} aux leads cochés", key=f"send_{step}"):
        selected_emails = {
            str(row["Email"]).strip().lower()
            for _, row in edited.iterrows()
            if row["Envoyer"]
        }
        selected_leads = [row.raw for row in queue if row.email in selected_emails]

        if dry_run:
            st.info(f"Dry run: would send to {len(selected_leads)} lead(s).")
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
                step=step,
                leads=selected_leads,
                dry_run=False,
                config=config,
                on_progress=on_progress,
            )

        st.session_state.pop(cache_key, None)
        st.metric("Sent", result.sent)
        st.metric("Skipped", result.skipped)
        st.metric("Failed", result.failed)
        if result.errors:
            st.error("\n".join(result.errors[:10]))


with TAB_WORKFLOW:
    st.subheader("Dashboard-first model")
    st.markdown(
        """
1. **Production webhook only:** Instantly fires `lead_interested` → Next.js sends **Positive Reply Email 1** instantly.
2. **Everything else from this dashboard** (works locally and in prod via Instantly API):
   - Positive Reply Email 1 backlog (manual catch-up)
   - Positive Reply Email 2 & 3 (bulk, checkbox-gated)
   - No Reply Email 1 & 2 (bulk, checkbox-gated)
3. **Reply detection:** leads who replied since the previous step are **unchecked by default**.
4. **Positive Reply queues:** leads no longer Interested are hidden.
5. **No cron jobs** — all follow-ups are operator-triggered from **Envois**.

Rate limit: ~3 s between sends (Instantly `/emails` ≈ 20 req/min).
        """
    )
    st.markdown("```mermaid\n" + WORKFLOW_MERMAID.strip() + "\n```")
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
    existing = existing_configs.get(selected_campaign_id, {})

    subsequences = client.list_subsequences(selected_campaign_id)
    subseq_options = {
        format_resource_label(s.get("name"), str(s.get("id") or "")): str(s.get("id") or "")
        for s in subsequences
        if s.get("id")
    }
    subseq_labels = ["— none —", *list(subseq_options.keys())]

    def _default_subseq_label(stored_id: str | None) -> int:
        if not stored_id:
            return 0
        for idx, label in enumerate(subseq_labels):
            if label != "— none —" and subseq_options.get(label) == stored_id:
                return idx
        return 0

    interested_label = st.selectbox(
        "Interested subsequence (native, to bypass)",
        options=subseq_labels,
        index=_default_subseq_label(existing.get("interested_subsequence_id")),
    )
    no_reply_label = st.selectbox(
        "No Reply subsequence (native, to bypass)",
        options=subseq_labels,
        index=_default_subseq_label(existing.get("no_reply_subsequence_id")),
    )

    waiting_value = st.number_input(
        "Waiting for reply — Instantly interest_value (custom label)",
        min_value=-30000,
        max_value=30000,
        value=int(existing.get("waiting_for_reply_interest_value") or 0),
        help="Numeric value from Instantly Lead Labels for your custom status.",
    )

    if st.button("Save campaign config"):
        save_config(
            {
                "campaign_id": selected_campaign_id,
                "campaign_name": selected_label.split(" (")[0],
                "interested_subsequence_id": subseq_options.get(interested_label)
                if interested_label != "— none —"
                else None,
                "no_reply_subsequence_id": subseq_options.get(no_reply_label)
                if no_reply_label != "— none —"
                else None,
                "waiting_for_reply_interest_value": int(waiting_value),
            }
        )
        st.success("Config saved.")

    st.divider()
    st.subheader("Webhook registration")

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
        if st.button("Register lead_interested webhook", disabled=not secret):
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

    st.caption("Variables: {{first_name}}, {{last_name}}, {{company_name}}, {{subject}}")

with TAB_ENVOIS:
    st.subheader("Envois")
    configs = list_configs()
    config_by_id = {c["campaign_id"]: c for c in configs}

    pos_tab, nr_tab = st.tabs(["Positive Reply", "No Reply"])

    with pos_tab:
        for step, title in POSITIVE_STEPS:
            _render_send_section(
                step=step,
                title=title,
                sequence="positive",
                configs=configs,
                config_by_id=config_by_id,
            )
            st.divider()

    with nr_tab:
        for step, title in NO_REPLY_STEPS:
            _render_send_section(
                step=step,
                title=title,
                sequence="no_reply",
                configs=configs,
                config_by_id=config_by_id,
            )
            st.divider()

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
