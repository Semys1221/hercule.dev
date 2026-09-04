import asyncio
import os

import pandas as pd
import streamlit as st

from config_loader import PRESET_LABELS, load_config
from core_logic import clear_local_leads, output_paths, run_scraper_pipeline
from instantly_client import csv_push_stats, push_csv_to_instantly
from scrape_state import detect_recoverable_run, load_scrape_state, target_mode

st.set_page_config(page_title="Agency Scraper", page_icon="⚡", layout="wide")

PRESET_OPTIONS = ["Manual Setup", *PRESET_LABELS.values()]
LABEL_TO_PRESET = {label: preset_id for preset_id, label in PRESET_LABELS.items()}

if "logs" not in st.session_state:
    st.session_state.logs = []
if "last_instantly_pushed" not in st.session_state:
    st.session_state.last_instantly_pushed = 0
if "last_enriched_valid" not in st.session_state:
    st.session_state.last_enriched_valid = 0


def add_log(msg: str) -> None:
    """Append a log line. Safe to call from worker threads."""
    try:
        if "logs" not in st.session_state:
            st.session_state.logs = []
        st.session_state.logs.append(msg)
        if len(st.session_state.logs) > 30:
            st.session_state.logs.pop(0)
        container = st.session_state.get("log_container")
        if container is not None:
            container.code("\n".join(st.session_state.logs), language="shell")
    except Exception:
        return


async def _abort_local(api_key: str, preset_id: str) -> dict:
    return await clear_local_leads(
        cancel_remote=bool(api_key),
        api_key=api_key,
        log_cb=add_log,
        preset=preset_id,
    )


def _pipeline_progress(preset_id: str, config: dict, csv_path: str) -> tuple[int, int, int, int]:
    state_path = output_paths(preset_id).scrape_state
    state = load_scrape_state(state_path)
    target = int(config.get("TARGET_LEADS", 0))
    scraped = int(state.get("leads_saved", 0)) if state else csv_push_stats(csv_path)["total"]
    enriched = int(state.get("leads_enriched_valid", 0)) if state else st.session_state.last_enriched_valid
    pushed = int(state.get("instantly_pushed", 0)) if state else st.session_state.last_instantly_pushed
    return scraped, enriched, pushed, target


st.title("⚡ Lead Engine Dashboard")

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("⚙️ Bootstrap Configuration")

    preset_label = st.selectbox("Select a Profile Configuration:", PRESET_OPTIONS)
    preset_id = LABEL_TO_PRESET.get(preset_label, "")

    if preset_id:
        config = load_config(preset_id, require_keys=False)
        paths = output_paths(preset_id)
        expansion_kw = len(config.get("EXPANSION_KEYWORDS", []))
        expansion_loc = len(config.get("EXPANSION_LOCATIONS", []))
        st.success(
            f"{preset_label} — {config['TARGET_LEADS']:,} Instantly target, "
            f"{len(config['LOCATIONS'])}+{expansion_loc} locations, "
            f"{len(config['KEYWORDS'])}+{expansion_kw} keywords"
        )
    else:
        preset_id = ""
        paths = None
        config = {
            "OUTSCRAPER_API_KEY": "",
            "TARGET_LEADS": 100,
            "TARGET_MODE": "csv_saved",
            "KEYWORDS": [],
            "LOCATIONS": [],
            "EXCLUDE_DOMAINS": [],
            "ALLOWED_KEYWORDS": [],
            "BLOCKED_KEYWORDS": [],
        }
        st.info("Manual setup selected. (Not implemented in this demo)")

    is_preset = bool(preset_id)
    csv_path = paths.csv if paths else ""
    state_path = paths.scrape_state if paths else ""
    recovery = (
        detect_recoverable_run(config, csv_path, state_path=state_path)
        if is_preset
        else None
    )
    has_leftover = bool(recovery and recovery.has_leftover_work)

    dry_run = st.checkbox("Dry run (no Outscraper calls)", value=False, disabled=not is_preset)
    has_instantly = bool(config.get("INSTANTLY_API_KEY") and config.get("INSTANTLY_LIST_ID"))
    mode = target_mode(config) if is_preset else "csv_saved"
    push_instantly = st.checkbox(
        "Auto-push to Instantly (target metric)",
        value=has_instantly and mode == "instantly_pushed",
        disabled=not is_preset or not has_instantly or dry_run,
        help="Upload scraped leads to Instantly; pipeline stops at TARGET pushed count.",
    )
    st.text_input(
        "Outscraper API Key",
        value="••••••••" if config.get("OUTSCRAPER_API_KEY") else "",
        type="password",
        disabled=True,
        help="Loaded from repo .env",
    )
    st.text_input(
        "Instantly API Key",
        value="••••••••" if config.get("INSTANTLY_API_KEY") else "",
        type="password",
        disabled=True,
    )
    st.text_input(
        "Instantly List ID",
        value=config.get("INSTANTLY_LIST_ID", ""),
        disabled=True,
    )

    start_disabled = not is_preset or has_leftover or (mode == "instantly_pushed" and not has_instantly)
    start_btn = st.button(
        "🚀 Start Engine",
        type="primary",
        use_container_width=True,
        disabled=start_disabled,
    )

with col2:
    st.subheader("📊 Dashboard")
    csv_stats = csv_push_stats(csv_path) if is_preset else {"total": 0, "pending": 0}
    scraped, enriched, pushed, target = (
        _pipeline_progress(preset_id, config, csv_path) if is_preset else (0, 0, 0, 0)
    )

    m1, m2, m3 = st.columns(3)
    metric_scraped = m1.metric("Scraped", f"{scraped:,}")
    metric_enriched = m2.metric("Enriched valid", f"{enriched:,}")
    metric_inst = m3.metric("Instantly pushed / target", f"{pushed:,} / {target:,}")

    if csv_stats["total"]:
        st.caption(f"{csv_stats['total']} leads in CSV (post scrape gates)")
    else:
        st.caption("No leads in CSV yet.")

    continue_btn = False
    recovery_push_btn = False
    abort_btn = False
    abort_restart_btn = False

    if has_leftover:
        batches_done = max((recovery.last_completed_batch_index + 1), 0) if recovery else 0
        title = "Interrupted scrape detected" if recovery.can_resume else "Previous scrape data detected"
        st.warning(f"**{title}** — pick an action below.")
        progress_label = (
            f"{recovery.instantly_pushed:,} / {recovery.target:,} pushed"
            if recovery.target_mode == "instantly_pushed"
            else f"{recovery.leads_saved:,} / {recovery.target:,} scraped"
        )
        st.markdown(
            f"- **Progress:** {progress_label}\n"
            f"- **Enriched valid:** {recovery.leads_enriched_valid:,}\n"
            f"- **Enriched rejected:** {recovery.leads_enriched_rejected:,}\n"
            f"- **Pass:** {recovery.query_pass + 1}\n"
            f"- **Batches:** {batches_done} / {recovery.batches_total or '?'}"
            + (
                f"\n- **Outscraper in flight:** {recovery.inflight_count}"
                if recovery.inflight_count
                else ""
            )
            + (f"\n- **CSV leads to push:** {recovery.pending_push}" if has_instantly else "")
            + (f"\n- **Last updated:** {recovery.last_updated}" if recovery.last_updated else "")
        )
        if recovery.message:
            st.info(recovery.message)

        rc1, rc2, rc3 = st.columns(3)
        continue_btn = rc1.button(
            "▶️ Continue scraping",
            type="primary",
            use_container_width=True,
            disabled=not is_preset or dry_run or not recovery.can_resume,
        )
        recovery_push_btn = rc2.button(
            "📤 Push to Instantly",
            use_container_width=True,
            disabled=not has_instantly or recovery.pending_push == 0,
        )
        abort_btn = rc3.button(
            "🛑 Abort + clear local",
            use_container_width=True,
            disabled=not is_preset,
        )

        abort_restart_btn = st.button(
            "🔄 Abort Outscraper + restart from scratch",
            type="secondary",
            use_container_width=True,
            disabled=not is_preset or dry_run,
        )

    can_push = has_instantly and csv_stats["pending"] > 0
    push_btn = st.button(
        "Push to Instantly",
        type="secondary",
        disabled=not can_push,
        help="Upload CSV rows to Instantly (works while scrape runs in CLI).",
    )

    initial_progress = 0.0
    if target > 0 and mode == "instantly_pushed":
        initial_progress = min(pushed / target, 1.0)
    elif has_leftover and recovery and recovery.batches_total and recovery.can_resume:
        initial_progress = max(recovery.last_completed_batch_index + 1, 0) / recovery.batches_total

    progress_bar = st.progress(initial_progress)
    st.session_state.log_container = st.empty()


def update_metrics(scraped: int, enriched: int, pushed: int) -> None:
    metric_scraped.metric("Scraped", f"{scraped:,}")
    metric_enriched.metric("Enriched valid", f"{enriched:,}")
    target_val = int(config.get("TARGET_LEADS", 0))
    metric_inst.metric("Instantly pushed / target", f"{pushed:,} / {target_val:,}")
    st.session_state.last_enriched_valid = enriched
    st.session_state.last_instantly_pushed = pushed


async def _run_push_flow() -> dict[str, int]:
    push_config = load_config(preset_id)
    return await push_csv_to_instantly(
        csv_path,
        push_config["INSTANTLY_API_KEY"],
        push_config["INSTANTLY_LIST_ID"],
        log_cb=add_log,
    )


def _show_push_result(result: dict[str, int]) -> None:
    st.session_state.last_instantly_pushed = result["pushed"]
    target_val = int(config.get("TARGET_LEADS", 0))
    st.success(
        f"Uploaded {result['pushed']} lead(s) — "
        f"{result['skipped_duplicate']} skipped by Instantly (duplicate)"
        + (f", {result['failed']} failed" if result["failed"] else "")
    )
    metric_inst.metric("Instantly pushed / target", f"{result['pushed']:,} / {target_val:,}")


if push_btn or recovery_push_btn:
    st.session_state.logs = []
    add_log("Starting Instantly push…")
    with st.spinner("Pushing to Instantly…"):
        result = asyncio.run(_run_push_flow())
    _show_push_result(result)
    st.rerun()

if abort_btn:
    st.session_state.logs = []
    add_log("Aborting Outscraper jobs and clearing local leads…")
    with st.spinner("Aborting and clearing…"):
        result = asyncio.run(_abort_local(config.get("OUTSCRAPER_API_KEY", ""), preset_id))
    st.success(
        f"Cleared {result['leads_removed']} local lead(s); "
        f"cancelled {result['outscraper_cancelled']} Outscraper job(s)."
    )
    st.rerun()

if abort_restart_btn:
    st.session_state.logs = []
    add_log("Abort Outscraper, clear local, then restart scrape…")
    run_config = load_config(preset_id, require_keys=True)
    with st.spinner("Aborting and restarting…"):
        asyncio.run(
            run_scraper_pipeline(
                config=run_config,
                log_cb=add_log,
                progress_cb=progress_bar.progress,
                metric_cb=update_metrics,
                push_to_instantly=push_instantly,
                reset=True,
                preset=preset_id,
            )
        )
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        st.dataframe(df.tail(20))
        with open(csv_path, "rb") as f:
            st.download_button(
                "📥 Download CSV",
                data=f,
                file_name="leads.csv",
                mime="text/csv",
            )

if continue_btn:
    st.session_state.logs = []
    run_config = load_config(preset_id, require_keys=True)
    resume_push = recovery.push_to_instantly if recovery else push_instantly

    asyncio.run(
        run_scraper_pipeline(
            config=run_config,
            log_cb=add_log,
            progress_cb=progress_bar.progress,
            metric_cb=update_metrics,
            push_to_instantly=resume_push,
            resume=True,
            preset=preset_id,
        )
    )

    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        st.dataframe(df.tail(20))
        with open(csv_path, "rb") as f:
            st.download_button(
                "📥 Download CSV",
                data=f,
                file_name="leads.csv",
                mime="text/csv",
            )

if start_btn:
    st.session_state.logs = []
    run_config = load_config(preset_id, require_keys=not dry_run)

    asyncio.run(
        run_scraper_pipeline(
            config=run_config,
            log_cb=add_log,
            progress_cb=progress_bar.progress,
            metric_cb=update_metrics,
            dry_run=dry_run,
            push_to_instantly=push_instantly,
            preset=preset_id,
        )
    )

    if not dry_run and os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        st.dataframe(df)
        with open(csv_path, "rb") as f:
            st.download_button(
                "📥 Download CSV",
                data=f,
                file_name="leads.csv",
                mime="text/csv",
            )

if (
    is_preset
    and not start_btn
    and not continue_btn
    and not push_btn
    and not recovery_push_btn
    and not abort_btn
    and not abort_restart_btn
    and os.path.exists(csv_path)
    and csv_stats["total"]
):
    with st.expander("Current CSV preview", expanded=False):
        st.dataframe(pd.read_csv(csv_path).tail(20))
