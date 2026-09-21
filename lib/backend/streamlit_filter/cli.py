"""Standalone Instantly taxonomy filter CLI.

Download → niche taxonomy filter → purge list → re-upload valid leads.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from typing import Optional

import typer

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))
if _LIB_DIR not in sys.path:
    sys.path.insert(0, _LIB_DIR)

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_LIB_DIR)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from cleaner import delete_and_reupload  # noqa: E402
from downloader import (  # noqa: E402
    download_and_backup,
    load_backup_csv,
)
from shared.mev_export import extract_emails_from_dataframe, write_mev_csv  # noqa: E402
from shared.instantly_client import (  # noqa: E402
    fetch_leads_from_list,
    leads_to_dataframe,
)
from filter_runner import non_valid_rows, run_filter, valid_rows  # noqa: E402
from instantly_client import get_api_key  # noqa: E402
from paths import output_dir  # noqa: E402

DEFAULT_LIST_ID = "fb97d2e1-ae69-4ffc-a95f-d4963974ee77"

app = typer.Typer(
    help="Standalone Instantly taxonomy filter — niche gate, purge, re-upload valid",
)


def _log(msg: str) -> None:
    typer.echo(f"[LOG] {msg}")


def _on_progress(message: str, fraction: float) -> None:
    pct = int(min(max(fraction, 0.0), 1.0) * 100)
    typer.echo(f"[{pct:3d}%] {message}")


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


@app.command()
def run(
    list_id: str = typer.Option(
        DEFAULT_LIST_ID,
        "--list-id",
        help="Instantly lead list UUID to filter in place",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        help="Skip confirmation before purge + re-upload",
    ),
    resume_csv: Optional[str] = typer.Option(
        None,
        "--resume-csv",
        help="Skip download; resume filtering from an existing backup CSV",
    ),
    max_leads: Optional[int] = typer.Option(
        None,
        "--max-leads",
        help="Optional download cap (default: all leads in the list)",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Download + filter only — do not purge or re-upload Instantly",
    ),
    workers: int = typer.Option(
        8,
        "--workers",
        help="Thread pool size for taxonomy filtering",
    ),
) -> None:
    """Download list → taxonomy filter → purge → re-upload valid leads."""
    if not get_api_key():
        raise typer.BadParameter("INSTANTLY_API_KEY is missing")

    stamp = _timestamp()
    filtered_path = os.path.join(output_dir(), f"filtered_{stamp}.csv")

    if resume_csv:
        _log(f"Resuming from {resume_csv}")
        df = load_backup_csv(resume_csv)
        csv_path = resume_csv
        _log(f"Loaded {len(df)} row(s)")
    else:
        _log(f"Downloading leads from Instantly list {list_id}...")
        df, csv_path = download_and_backup(
            list_id,
            max_leads=max_leads,
            on_progress=lambda n: _log(f"Downloaded {n} leads"),
            prefix=stamp,
        )
        _log(f"Downloaded {len(df)} lead(s) → {csv_path}")

    # Work on a filtered copy path so the raw backup stays intact
    if csv_path != filtered_path:
        df.to_csv(filtered_path, index=False)
        work_path = filtered_path
    else:
        work_path = csv_path

    _log("Running niche taxonomy filter...")
    df, stats = run_filter(
        df,
        work_path,
        max_workers=workers,
        on_progress=_on_progress,
    )

    valid_df = valid_rows(df)
    rejected_df = non_valid_rows(df)
    rejected_path = os.path.join(output_dir(), f"rejected_{stamp}.csv")
    rejected_df.to_csv(rejected_path, index=False)

    typer.secho(
        f"Filter done — {stats.valid} valid / {stats.non_valid} non_valid "
        f"(empty_taxonomy={stats.empty_taxonomy}, unknown_niche={stats.unknown_niche})",
        fg=typer.colors.GREEN,
    )
    typer.echo(f"  raw backup: {csv_path}")
    typer.echo(f"  filtered:   {work_path}")
    typer.echo(f"  rejected:   {rejected_path}")

    if dry_run:
        typer.secho("Dry run — Instantly list left untouched.", fg=typer.colors.YELLOW)
        return

    if not yes:
        typer.secho(
            f"About to PURGE list {list_id} and re-upload {len(valid_df)} valid lead(s). "
            f"{len(rejected_df)} non_valid lead(s) will be permanently removed from Instantly.",
            fg=typer.colors.YELLOW,
        )
        confirmed = typer.confirm("Continue?")
        if not confirmed:
            typer.echo("Aborted — local CSVs kept, Instantly unchanged.")
            raise typer.Exit(1)

    clean_stats = delete_and_reupload(
        list_id,
        valid_df,
        log_cb=_log,
        on_progress=_on_progress,
    )
    typer.secho(
        f"Done — deleted={clean_stats.deleted}, "
        f"re-uploaded={clean_stats.pushed}, "
        f"skipped={clean_stats.skipped_duplicate}, "
        f"failed={clean_stats.failed}",
        fg=typer.colors.GREEN,
    )


@app.command("export-mev")
def export_mev(
    list_id: str = typer.Option(..., "--list-id", help="Instantly source list UUID"),
    output: str = typer.Option(
        "mev_emails.csv",
        "--output",
        "-o",
        help="Output path for single-column MEV CSV",
    ),
) -> None:
    """Export Instantly list emails as a MyEmailVerifier-ready CSV."""
    if not get_api_key():
        raise typer.BadParameter("INSTANTLY_API_KEY is missing")

    _log(f"Downloading leads from Instantly list {list_id}...")
    leads = fetch_leads_from_list(
        list_id,
        on_progress=lambda n: _log(f"Downloaded {n} leads"),
    )
    emails = extract_emails_from_dataframe(leads_to_dataframe(leads))
    if not emails:
        raise typer.BadParameter("No valid emails found in list")

    count = write_mev_csv(emails, output)
    typer.secho(f"Wrote {count} email(s) to {output}", fg=typer.colors.GREEN)


@app.command("filter-csv")
def filter_csv(
    csv_path: str = typer.Argument(..., help="Local backup CSV from a previous download"),
    workers: int = typer.Option(8, "--workers"),
) -> None:
    """Re-run taxonomy filter on a local CSV (no Instantly side effects)."""
    df = load_backup_csv(csv_path)
    _log(f"Loaded {len(df)} row(s) from {csv_path}")
    df, stats = run_filter(df, csv_path, max_workers=workers, on_progress=_on_progress)
    typer.secho(
        f"Filter done — {stats.valid} valid / {stats.non_valid} non_valid",
        fg=typer.colors.GREEN,
    )


if __name__ == "__main__":
    app()
