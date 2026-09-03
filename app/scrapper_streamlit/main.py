"""Lead scraper CLI — multi-preset Outscraper pipeline."""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

import typer

from config_loader import DEFAULT_PRESET, PRESETS, load_config
from instantly_client import (
    get_remediation_counts,
    purge_leads_from_campaign,
    purge_leads_from_list,
    push_csv_to_instantly,
)
from core_logic import (
    clear_local_leads,
    output_paths,
    run_filter_audit,
    run_scraper_pipeline,
)
from scrape_state import detect_recoverable_run

app = typer.Typer(help="Lead Scraper CLI")

from bootstrap.cli import app as bootstrap_app  # noqa: E402

app.add_typer(bootstrap_app, name="bootstrap")

PresetOption = typer.Option(
    DEFAULT_PRESET,
    "--preset",
    help=f"Bootstrap preset ({', '.join(sorted(PRESETS))})",
)


def _validate_preset(preset: str) -> str:
    if preset not in PRESETS:
        raise typer.BadParameter(
            f"Unknown preset {preset!r}. Available: {', '.join(sorted(PRESETS))}"
        )
    return preset


def _log(msg: str) -> None:
    typer.echo(f"[LOG] {msg}")


def _progress(prog: float) -> None:
    pass


def _metrics(scraped: int, enriched: int, pushed: int) -> None:
    typer.secho(
        f"   -> Scraped: {scraped} | Enriched valid: {enriched} | Instantly: {pushed} pushed",
        fg=typer.colors.CYAN,
    )


@app.command()
def ui() -> None:
    """Launch the Streamlit web interface."""
    typer.secho("Launching web dashboard...", fg=typer.colors.GREEN)
    subprocess.run(
        [sys.executable, "-m", "streamlit", "run", "app_ui.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        check=False,
    )


@app.command("dry-run")
def dry_run_cmd(
    preset: str = PresetOption,
) -> None:
    """Validate config and print query plan without calling Outscraper."""
    preset = _validate_preset(preset)
    config = load_config(preset, require_keys=False)
    summary = asyncio.run(
        run_scraper_pipeline(
            config,
            log_cb=_log,
            progress_cb=_progress,
            metric_cb=_metrics,
            dry_run=True,
            preset=preset,
        )
    )
    typer.secho(
        f"Dry-run OK [{preset}] — {summary['queries_total']} queries, "
        f"{summary['batches_total']} batches (size {summary['batch_size']}, "
        f"concurrency {summary['concurrency']}), target {summary['target']}",
        fg=typer.colors.GREEN,
    )


@app.command("filter-audit")
def filter_audit_cmd(
    batches: int = typer.Option(1, help="Number of Outscraper batches to audit"),
    preset: str = PresetOption,
) -> None:
    """Run scrape gate audit on N Outscraper batches and write filter_audit.csv."""
    preset = _validate_preset(preset)
    config = load_config(preset)
    summary = asyncio.run(
        run_filter_audit(config, log_cb=_log, batches=batches, preset=preset)
    )
    typer.secho(
        f"Audit done — {summary['accepted']} accepted / {summary['rejected']} rejected "
        f"({summary['acceptance_rate']:.1f}%) → {summary['audit_path']}",
        fg=typer.colors.GREEN,
    )


@app.command()
def remediate(
    dry_run: bool = typer.Option(
        True,
        "--dry-run/--execute",
        help="Dry-run counts only, or execute purge + re-scrape + push",
    ),
    target: int = typer.Option(
        None,
        help="Target leads for re-scrape (default: config TARGET_LEADS)",
    ),
    preset: str = PresetOption,
) -> None:
    """Purge Instantly list+campaign, re-scrape with website enrich filter, re-upload qualified leads."""
    preset = _validate_preset(preset)
    paths = output_paths(preset)
    remediation_report_path = os.path.join(paths.out_dir, "remediation_report.json")
    config = load_config(preset)
    list_id = config.get("INSTANTLY_LIST_ID", "").strip()
    campaign_id = config.get("INSTANTLY_CAMPAIGN_ID", "").strip()
    api_key = config.get("INSTANTLY_API_KEY", "").strip()

    if not api_key or not list_id or not campaign_id:
        raise typer.BadParameter(
            "INSTANTLY_API_KEY, INSTANTLY_LIST_ID, and INSTANTLY_CAMPAIGN_ID are required"
        )

    counts = get_remediation_counts(api_key, list_id, campaign_id)
    _log(
        f"Instantly scope — list {list_id}: {counts['list_leads']} lead(s), "
        f"campaign {campaign_id}: {counts['campaign_leads']} lead(s)"
    )

    scrape_target = target if target is not None else int(config["TARGET_LEADS"])
    _log(f"Re-scrape target: {scrape_target} qualified leads")

    if dry_run:
        typer.secho(
            "Dry-run — no purge or scrape. Run with --execute to apply remediation.",
            fg=typer.colors.YELLOW,
        )
        report = {
            "mode": "dry_run",
            "preset": preset,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "instantly": counts,
            "scrape_target": scrape_target,
            "list_id": list_id,
            "campaign_id": campaign_id,
        }
        os.makedirs(paths.out_dir, exist_ok=True)
        with open(remediation_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        _log(f"Report written → {remediation_report_path}")
        return

    typer.secho("Executing remediation...", fg=typer.colors.MAGENTA)
    purge_leads_from_list(api_key, list_id, log_cb=_log)
    purge_leads_from_campaign(api_key, campaign_id, log_cb=_log)

    if os.path.isfile(paths.filter_audit):
        os.remove(paths.filter_audit)
        _log(f"Cleared {paths.filter_audit}")

    config["TARGET_LEADS"] = scrape_target
    summary = asyncio.run(
        run_scraper_pipeline(
            config,
            log_cb=_log,
            progress_cb=_progress,
            metric_cb=_metrics,
            dry_run=False,
            push_to_instantly=True,
            reset=True,
            preset=preset,
        )
    )

    report = {
        "mode": "execute",
        "preset": preset,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "instantly_before": counts,
        "instantly_after": get_remediation_counts(api_key, list_id, campaign_id),
        "scrape": summary,
        "list_id": list_id,
        "campaign_id": campaign_id,
    }
    with open(remediation_report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    typer.secho(
        f"Remediation complete — {summary['leads_saved']} scraped, "
        f"{summary.get('leads_enriched_valid', 0)} enriched valid, "
        f"{summary.get('instantly_pushed', 0)} pushed to Instantly",
        fg=typer.colors.GREEN,
    )
    _log(f"Report → {remediation_report_path}")


@app.command("clear-leads")
def clear_leads_cmd(
    preset: str = PresetOption,
) -> None:
    """Cancel Outscraper jobs and delete local CSV + scrape state."""
    preset = _validate_preset(preset)
    config = load_config(preset, require_keys=False)
    result = asyncio.run(
        clear_local_leads(
            cancel_remote=True,
            api_key=config.get("OUTSCRAPER_API_KEY", ""),
            log_cb=_log,
            preset=preset,
        )
    )
    if not result["csv_cleared"] and not result["state_cleared"]:
        typer.secho("Nothing to clear — no local leads or scrape state found.", fg=typer.colors.YELLOW)
        return
    typer.secho(
        f"Cleared {result['leads_removed']} lead(s) from CSV"
        + (" and scrape state" if result["state_cleared"] else "")
        + f"; cancelled {result['outscraper_cancelled']} Outscraper job(s).",
        fg=typer.colors.GREEN,
    )


@app.command()
def scrape(
    target: int = typer.Option(100, help="Number of leads to scrape"),
    reset: bool = typer.Option(False, help="Clear CSV and scrape state before scraping"),
    resume: bool = typer.Option(
        False,
        help="Continue an interrupted scrape from the last checkpoint",
    ),
    push_instantly: bool = typer.Option(
        False,
        "--push-instantly",
        help="Upload leads to Instantly list after each batch (native duplicate skip)",
    ),
    preset: str = PresetOption,
) -> None:
    """Run the scraper headlessly in the terminal."""
    preset = _validate_preset(preset)
    paths = output_paths(preset)

    if reset and resume:
        raise typer.BadParameter("Use either --reset or --resume, not both.")

    config = load_config(preset)
    if resume and target == 100:
        from scrape_state import load_scrape_state

        saved = load_scrape_state(paths.scrape_state)
        if saved and saved.get("target"):
            target = int(saved["target"])
            _log(f"Resume — using saved target {target}")
    config["TARGET_LEADS"] = target

    if resume:
        recovery = detect_recoverable_run(
            config,
            paths.csv,
            state_path=paths.scrape_state,
        )
        if not recovery.can_resume:
            detail = recovery.message or "No resumable scrape found."
            raise typer.BadParameter(detail)
        _log(
            f"Resuming — {recovery.leads_saved}/{recovery.target} leads, "
            f"batch {recovery.last_completed_batch_index + 2}/{recovery.batches_total}"
        )
        if recovery.push_to_instantly and not push_instantly:
            push_instantly = True
            _log("Auto-push enabled from saved run.")

    typer.secho(
        f"Starting headless scrape [{preset}] (target={target}, push_instantly={push_instantly}, "
        f"resume={resume})...",
        fg=typer.colors.MAGENTA,
    )
    summary = asyncio.run(
        run_scraper_pipeline(
            config,
            log_cb=_log,
            progress_cb=_progress,
            metric_cb=_metrics,
            dry_run=False,
            push_to_instantly=push_instantly,
            resume=resume,
            reset=reset,
            preset=preset,
        )
    )
    msg = (
        f"Done — {summary['leads_saved']} scraped, "
        f"{summary.get('leads_enriched_valid', 0)} enriched valid → {paths.csv}"
    )
    if push_instantly:
        msg += (
            f" | Instantly pushed {summary.get('instantly_pushed', 0)}, "
            f"skipped {summary.get('instantly_skipped_duplicate', 0)} duplicate(s)"
        )
    typer.secho(msg, fg=typer.colors.GREEN)


@app.command("enrich-csv")
def enrich_csv_cmd(
    preset: str = PresetOption,
    csv_path: str = typer.Option("", help="CSV with Website column to enrich"),
    output: str = typer.Option("", help="Output CSV path (default: overwrite input)"),
) -> None:
    """Run HTTP website keyword check on an existing CSV."""
    import pandas as pd

    preset = _validate_preset(preset)
    paths = output_paths(preset)
    resolved_csv = csv_path or paths.csv

    enrich_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "streamlit_enrich")
    enrich_dir = os.path.normpath(enrich_dir)
    if enrich_dir not in sys.path:
        sys.path.insert(0, enrich_dir)
    from website_verifier import enrich_leads

    if not os.path.isfile(resolved_csv):
        raise typer.BadParameter(f"CSV not found: {resolved_csv}")

    config = load_config(preset, require_keys=False)
    df = pd.read_csv(resolved_csv)
    rows = df.to_dict(orient="records")
    _log(f"Enriching {len(rows)} row(s) from {resolved_csv}…")

    valid, rejected = asyncio.run(
        enrich_leads(
            [{str(k): ("" if pd.isna(v) else str(v)) for k, v in row.items()} for row in rows],
            url_column="Website",
            included=list(config.get("ENRICH_INCLUDED_KEYWORDS") or []),
            hard_excluded=list(config.get("ENRICH_HARD_EXCLUDED_KEYWORDS") or []),
            soft_excluded=list(config.get("ENRICH_SOFT_EXCLUDED_KEYWORDS") or []),
            max_concurrent=max(int(config.get("ENRICH_CONCURRENCY", 10)), 1),
            goto_timeout_ms=max(int(config.get("ENRICH_TIMEOUT_MS", 15000)), 1000),
            service_config={
                "SERVICE_DEFAULT": config.get("SERVICE_DEFAULT", ""),
                "SERVICE_RULES": list(config.get("SERVICE_RULES") or []),
            },
            log_cb=_log,
        )
    )

    out_path = output or resolved_csv
    valid_df = pd.DataFrame(valid)
    valid_df.to_csv(out_path, index=False)

    if rejected:
        audit_path = paths.enrich_audit
        os.makedirs(os.path.dirname(audit_path), exist_ok=True)
        pd.DataFrame(rejected).to_csv(audit_path, index=False)
        _log(f"Rejected rows written → {audit_path}")

    typer.secho(
        f"Enrich done — {len(valid)} valid, {len(rejected)} rejected → {out_path}",
        fg=typer.colors.GREEN,
    )


@app.command("push-instantly")
def push_instantly_cmd(
    preset: str = PresetOption,
) -> None:
    """Push CSV rows to Instantly (native duplicate skip via skip_if_in_campaign/list)."""
    preset = _validate_preset(preset)
    paths = output_paths(preset)
    config = load_config(preset)
    if not os.path.isfile(paths.csv):
        raise typer.BadParameter(f"CSV not found: {paths.csv}")

    summary = asyncio.run(
        push_csv_to_instantly(
            paths.csv,
            config["INSTANTLY_API_KEY"],
            config["INSTANTLY_LIST_ID"],
            log_cb=_log,
        )
    )
    typer.secho(
        f"Uploaded {summary['pushed']} lead(s) — "
        f"{summary['skipped_duplicate']} skipped by Instantly (duplicate)"
        + (f", {summary['failed']} failed" if summary["failed"] else ""),
        fg=typer.colors.GREEN,
    )


if __name__ == "__main__":
    app()
