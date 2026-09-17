"""Headless CLI for MyEmailVerifier cleaning pipeline (Render / cron)."""

from __future__ import annotations

import os
import sys
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Callable, Iterator, Optional

import pandas as pd
import typer

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))
if _LIB_DIR not in sys.path:
    sys.path.insert(0, _LIB_DIR)

_REPO_ROOT = os.path.dirname(os.path.dirname(_LIB_DIR))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from bulk_verifier import fetch_mev_credits  # noqa: E402
from checkpoint import list_checkpoints  # noqa: E402
from core_logic import get_api_key  # noqa: E402
from instantly_client import (  # noqa: E402
    fetch_leads_from_list,
    leads_to_dataframe,
)
from job_state import (  # noqa: E402
    STATUS_RUNNING,
    clear_active_job,
    init_job_state,
    job_log_path,
    load_active_job,
    load_job_state,
    mark_job_completed,
    mark_job_failed,
    save_job_state,
    tail_job_log,
)
from paths import data_dir  # noqa: E402
from pipeline import (  # noqa: E402
    RUN_MODE_CUSTOM,
    RUN_MODE_DRY,
    RUN_MODE_FULL,
    RUN_MODE_TEST_50,
    PipelineResult,
    push_partial_clean,
    run_cleaning_pipeline,
)

app = typer.Typer(help="Email cleaner CLI — MyEmailVerifier bulk verify + Instantly push")

_MODE_MAP = {
    "dry_run": RUN_MODE_DRY,
    "test_50": RUN_MODE_TEST_50,
    "full": RUN_MODE_FULL,
    "custom": RUN_MODE_CUSTOM,
}


def _timestamp_prefix() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def _log(msg: str) -> None:
    typer.echo(f"[LOG] {msg}")


def _on_progress(message: str, fraction: float) -> None:
    pct = int(min(max(fraction, 0.0), 1.0) * 100)
    typer.echo(f"[{pct:3d}%] {message}")


def _parse_allowed_statuses(raw: str) -> list[str]:
    return [part.strip() for part in raw.split(",") if part.strip()]


def _provision_enabled(skip_provision: bool) -> bool:
    if skip_provision:
        return False
    env_flag = os.getenv("CLEAN_SKIP_PROVISION", "").strip().lower()
    return env_flag not in {"1", "true", "yes"}


def _resolve_run_mode(mode: str) -> str:
    key = mode.strip().lower()
    if key not in _MODE_MAP:
        raise typer.BadParameter(
            f"Unknown mode {mode!r}. Choose from: {', '.join(_MODE_MAP)}"
        )
    return _MODE_MAP[key]


class _TeeStdout:
    def __init__(self, log_path: str) -> None:
        self._terminal = sys.stdout
        os.makedirs(os.path.dirname(log_path) or ".", exist_ok=True)
        self._log = open(log_path, "a", encoding="utf-8")

    def write(self, data: str) -> None:
        self._terminal.write(data)
        self._log.write(data)
        self._log.flush()

    def flush(self) -> None:
        self._terminal.flush()
        self._log.flush()

    def close(self) -> None:
        self._log.close()


@contextmanager
def _job_logging(prefix: str) -> Iterator[None]:
    tee = _TeeStdout(job_log_path(prefix))
    previous = sys.stdout
    sys.stdout = tee
    try:
        yield
    finally:
        sys.stdout = previous
        tee.close()


def _resolve_job_prefix(
    job_prefix: str | None,
    resume_prefix: str | None,
) -> str:
    return resume_prefix or job_prefix or _timestamp_prefix()


def _begin_job(
    prefix: str,
    *,
    run_mode: str,
    allowed_statuses: list[str],
    list_id: str | None = None,
    campaign_id: str | None = None,
    source_type: str | None = None,
    purge_source: bool = False,
    provision_links: bool = True,
) -> None:
    existing = load_job_state(prefix)
    if existing is None:
        init_job_state(
            prefix,
            run_mode=run_mode,
            allowed_statuses=allowed_statuses,
            list_id=list_id,
            campaign_id=campaign_id,
            source_type=source_type,
            purge_source=purge_source,
            provision_links=provision_links,
            pid=os.getpid(),
        )
    else:
        existing["pid"] = os.getpid()
        existing["status"] = STATUS_RUNNING
        save_job_state(existing)


def _run_pipeline_job(
    prefix: str,
    runner: Callable[[], PipelineResult],
) -> PipelineResult:
    with _job_logging(prefix):
        try:
            result = runner()
            mark_job_completed(prefix)
            clear_active_job()
            return result
        except Exception as exc:
            mark_job_failed(prefix, str(exc))
            raise


def _print_result_summary(result: PipelineResult, *, skip_push: bool, destination: str | None) -> None:
    typer.secho(
        f"Done — {result.final_clean_count} clean / {result.rejected_count} rejected "
        f"({result.credits_used} MEV credits)",
        fg=typer.colors.GREEN,
    )
    if result.credits_before is not None and result.credits_remaining is not None:
        typer.echo(f"Credits: {result.credits_before} → {result.credits_remaining}")
    if not skip_push and destination:
        typer.echo(
            f"Instantly push: {result.push_pushed} pushed, "
            f"{result.push_skipped_duplicate} skipped duplicate"
        )
    for label, path in result.artifact_paths.items():
        typer.echo(f"  {label}: {path}")


@app.command()
def credits() -> None:
    """Print remaining MyEmailVerifier credits (smoke test)."""
    if not get_api_key():
        raise typer.BadParameter("MYEMAILVERIFIER_API_KEY is missing")
    balance = fetch_mev_credits()
    if balance is None:
        typer.secho("Could not read MEV credits.", fg=typer.colors.RED)
        raise typer.Exit(1)
    typer.secho(f"MyEmailVerifier credits: {balance}", fg=typer.colors.GREEN)


@app.command("status")
def status_cmd() -> None:
    """Show active job and recent checkpoints."""
    active = load_active_job()
    if active:
        prefix = str(active.get("prefix") or "")
        typer.echo(f"Active job: {prefix}")
        typer.echo(f"  status: {active.get('status')}")
        typer.echo(f"  phase: {active.get('phase')}")
        typer.echo(f"  pid: {active.get('pid')}")
        verified = active.get("verified_count")
        total = active.get("total_target")
        if verified is not None:
            suffix = f"/{total}" if total else ""
            typer.echo(f"  verified: {verified}{suffix}")
        if active.get("error"):
            typer.echo(f"  error: {active.get('error')}")
        tail = tail_job_log(prefix, lines=10)
        if tail:
            typer.echo("  log tail:")
            for line in tail.strip().splitlines():
                typer.echo(f"    {line}")
    else:
        typer.echo("No active job.")

    items = list_checkpoints()
    if items:
        typer.echo("")
        typer.echo("Checkpoints:")
        for item in items[:5]:
            total = item.get("total_target")
            suffix = f"/{total}" if total else ""
            typer.echo(
                f"  {item['prefix']} — {item['verified_count']}{suffix} verified"
            )


@app.command("checkpoints")
def checkpoints_cmd() -> None:
    """List resumable verification jobs on disk."""
    items = list_checkpoints()
    if not items:
        typer.echo("No checkpoints found.")
        return
    for item in items:
        total = item.get("total_target")
        suffix = f"/{total}" if total else ""
        updated = item.get("updated_at") or "unknown"
        meta = []
        if item.get("list_id"):
            meta.append(f"list={item['list_id']}")
        if item.get("campaign_id"):
            meta.append(f"campaign={item['campaign_id']}")
        if item.get("run_mode"):
            meta.append(f"mode={item['run_mode']}")
        meta_suffix = f" [{', '.join(meta)}]" if meta else ""
        typer.echo(
            f"{item['prefix']} — {item['verified_count']}{suffix} verified "
            f"(updated {updated}){meta_suffix}"
        )


@app.command("from-csv")
def from_csv(
    csv_path: str = typer.Argument(..., help="Local CSV path (e.g. saved quick_clean backup)"),
    mode: str = typer.Option(
        "test_50",
        "--mode",
        help="dry_run | test_50 | full | custom",
    ),
    resume_prefix: Optional[str] = typer.Option(
        None,
        "--resume-prefix",
        help="Artifact prefix to resume from checkpoint",
    ),
    job_prefix: Optional[str] = typer.Option(
        None,
        "--job-prefix",
        help="Artifact prefix for this job manifest and logs",
    ),
    allowed_statuses: str = typer.Option(
        "Valid,Catch All",
        "--allowed-statuses",
        help="Comma-separated MEV statuses to keep",
    ),
    custom_limit: Optional[int] = typer.Option(
        None,
        "--custom-limit",
        help="Row limit when --mode custom",
    ),
    email_column: Optional[str] = typer.Option(
        None,
        "--email-column",
        help="Email column name (defaults to 'email' or first column)",
    ),
) -> None:
    """Verify a local CSV via MEV bulk API (no Instantly list required)."""
    run_mode = _resolve_run_mode(mode)
    statuses = _parse_allowed_statuses(allowed_statuses)
    prefix = _resolve_job_prefix(job_prefix, resume_prefix)

    if run_mode != RUN_MODE_DRY and not get_api_key():
        raise typer.BadParameter("MYEMAILVERIFIER_API_KEY is missing")

    if not os.path.isfile(csv_path):
        raise typer.BadParameter(f"CSV not found: {csv_path}")

    source_df = pd.read_csv(csv_path)
    resolved_email_column = email_column
    if not resolved_email_column:
        resolved_email_column = "email" if "email" in source_df.columns else source_df.columns[0]

    _begin_job(
        prefix,
        run_mode=run_mode,
        allowed_statuses=statuses,
        source_type="local_csv",
        provision_links=True,
    )
    _log(f"Loaded {len(source_df)} row(s) from {csv_path}")

    def _execute() -> PipelineResult:
        return run_cleaning_pipeline(
            source_df=source_df,
            run_mode=run_mode,
            custom_limit=custom_limit,
            allowed_statuses=statuses,
            destination_campaign_id=None,
            source_list_id=None,
            purge_source=False,
            email_column=resolved_email_column,
            on_progress=_on_progress,
            resume_prefix=resume_prefix or prefix,
            skip_quick_verify=True,
            job_prefix=prefix,
        )

    result = _run_pipeline_job(prefix, _execute)
    _print_result_summary(result, skip_push=True, destination=None)


@app.command("push-partial")
def push_partial_cmd(
    resume_prefix: str = typer.Option(..., "--resume-prefix", help="Artifact prefix"),
    campaign_id: str = typer.Option(..., "--campaign-id", help="Destination campaign UUID"),
    list_id: Optional[str] = typer.Option(
        None,
        "--list-id",
        help="Source Instantly list UUID (required for link provisioning)",
    ),
    allowed_statuses: str = typer.Option(
        "Valid,Catch All",
        "--allowed-statuses",
        help="Comma-separated MEV statuses to push",
    ),
    skip_provision: bool = typer.Option(
        False,
        "--skip-provision",
        help="Skip link-tracking URL provisioning before push",
    ),
) -> None:
    """Push already-verified clean leads from checkpoint without touching MEV progress."""
    statuses = _parse_allowed_statuses(allowed_statuses)
    stats = push_partial_clean(
        resume_prefix,
        campaign_id,
        statuses,
        source_list_id=list_id,
        provision_links=_provision_enabled(skip_provision),
        on_progress=_on_progress,
    )
    typer.secho(
        f"Partial push — {stats.get('clean_rows', 0)} clean rows, "
        f"{stats['pushed']} pushed, {stats['skipped_duplicate']} skipped duplicate",
        fg=typer.colors.GREEN,
    )
    if _provision_enabled(skip_provision):
        typer.echo(
            f"  Link provision: created={stats.get('provision_created', 0)}, "
            f"patched={stats.get('provision_patched', 0)}, "
            f"failed={stats.get('provision_failed', 0)}"
        )
    if stats.get("manifest_path"):
        typer.echo(f"  manifest: {stats['manifest_path']}")
    typer.echo(
        "Checkpoint preserved — resume with: "
        "python3 cli.py run --resume-prefix ... --skip-push --mode full"
    )


@app.command()
def run(
    list_id: Optional[str] = typer.Option(
        None,
        "--list-id",
        help="Instantly source list UUID (not needed with --resume-prefix)",
    ),
    campaign_id: Optional[str] = typer.Option(
        None,
        "--campaign-id",
        help="Destination Instantly campaign UUID",
    ),
    mode: str = typer.Option(
        "test_50",
        "--mode",
        help="dry_run | test_50 | full | custom",
    ),
    resume_prefix: Optional[str] = typer.Option(
        None,
        "--resume-prefix",
        help="Artifact prefix to resume from checkpoint (skips quick verify)",
    ),
    job_prefix: Optional[str] = typer.Option(
        None,
        "--job-prefix",
        help="Artifact prefix for this job manifest and logs",
    ),
    allowed_statuses: str = typer.Option(
        "Valid,Catch All",
        "--allowed-statuses",
        help="Comma-separated MEV statuses to keep",
    ),
    skip_push: bool = typer.Option(
        False,
        "--skip-push",
        help="Verify only — do not push to Instantly campaign",
    ),
    refresh_list: bool = typer.Option(
        False,
        "--refresh-list",
        help="Re-download leads from Instantly even when resuming",
    ),
    custom_limit: Optional[int] = typer.Option(
        None,
        "--custom-limit",
        help="Row limit when --mode custom",
    ),
    skip_provision: bool = typer.Option(
        False,
        "--skip-provision",
        help="Skip link-tracking URL provisioning before campaign push",
    ),
) -> None:
    """Fetch Instantly list → quick verify → MEV bulk → optional campaign push."""
    run_mode = _resolve_run_mode(mode)
    statuses = _parse_allowed_statuses(allowed_statuses)
    destination = None if skip_push else campaign_id
    prefix = _resolve_job_prefix(job_prefix, resume_prefix)

    if run_mode != RUN_MODE_DRY and not get_api_key():
        raise typer.BadParameter("MYEMAILVERIFIER_API_KEY is missing")

    if destination is None and not skip_push and run_mode != RUN_MODE_DRY:
        raise typer.BadParameter(
            "Provide --campaign-id or pass --skip-push for verify-only runs"
        )

    if run_mode == RUN_MODE_FULL:
        typer.secho(
            "Full Clean: source list will be purged on Instantly after download.",
            fg=typer.colors.YELLOW,
        )

    source_df: pd.DataFrame
    email_column: str | None = None
    skip_quick = False

    if resume_prefix and not refresh_list:
        quick_clean_path = os.path.join(data_dir(), f"{resume_prefix}_quick_clean.csv")
        if not os.path.isfile(quick_clean_path):
            raise typer.BadParameter(f"Resume artifact not found: {quick_clean_path}")
        source_df = pd.read_csv(quick_clean_path)
        skip_quick = True
        email_column = "email" if "email" in source_df.columns else source_df.columns[0]
        _log(f"Resuming from {quick_clean_path} ({len(source_df)} rows)")
    else:
        if not list_id:
            raise typer.BadParameter(
                "Provide --list-id or pass --resume-prefix to use a saved quick_clean.csv"
            )
        _log(f"Downloading leads from Instantly list {list_id}...")
        leads = fetch_leads_from_list(list_id, on_progress=lambda n: _log(f"Downloaded {n} leads"))
        source_df = leads_to_dataframe(leads)
        _log(f"Downloaded {len(source_df)} leads")

    _begin_job(
        prefix,
        run_mode=run_mode,
        allowed_statuses=statuses,
        list_id=list_id,
        campaign_id=destination,
        source_type="instantly",
        purge_source=(run_mode == RUN_MODE_FULL),
        provision_links=_provision_enabled(skip_provision),
    )

    def _execute() -> PipelineResult:
        return run_cleaning_pipeline(
            source_df=source_df,
            run_mode=run_mode,
            custom_limit=custom_limit,
            allowed_statuses=statuses,
            destination_campaign_id=destination,
            source_list_id=list_id,
            purge_source=(run_mode == RUN_MODE_FULL),
            email_column=email_column,
            on_progress=_on_progress,
            resume_prefix=resume_prefix or prefix,
            skip_quick_verify=skip_quick,
            provision_links=_provision_enabled(skip_provision),
            job_prefix=prefix,
        )

    result = _run_pipeline_job(prefix, _execute)
    _print_result_summary(result, skip_push=skip_push, destination=destination)
    if not skip_push and destination and _provision_enabled(skip_provision):
        typer.echo(
            f"Link provision: created={result.provision_created}, "
            f"patched={result.provision_patched}, "
            f"failed={result.provision_failed}"
        )


if __name__ == "__main__":
    app()
