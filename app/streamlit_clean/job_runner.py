"""Spawn detached clean jobs via CLI subprocess (crash-resilient)."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from job_state import (
    STATUS_RUNNING,
    init_job_state,
    job_is_running,
    job_log_path,
    load_active_job,
    load_job_state,
    mark_job_incomplete,
    save_job_state,
    tail_job_log,
)
from paths import data_dir

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))
_CLI_PATH = os.path.join(_LIB_DIR, "cli.py")
_PID_FILE = os.path.join(data_dir(), "clean_worker.pid")


@dataclass
class JobConfig:
    run_mode: str
    allowed_statuses: list[str]
    list_id: str | None = None
    campaign_id: str | None = None
    source_type: str = "instantly"
    local_csv_path: str | None = None
    email_column: str | None = None
    skip_quick_verify: bool = False
    custom_limit: int | None = None
    purge_source: bool = False
    provision_links: bool = True
    resume_prefix: str | None = None
    skip_push: bool = False
    job_prefix: str | None = None
    extra_env: dict[str, str] = field(default_factory=dict)


def _timestamp_prefix() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def resolve_job_prefix(config: JobConfig) -> str:
    return config.resume_prefix or config.job_prefix or _timestamp_prefix()


def _cli_mode_from_run_mode(run_mode: str) -> str:
    mapping = {
        "dry_run": "dry_run",
        "test_50": "test_50",
        "full": "full",
        "custom": "custom",
    }
    return mapping.get(run_mode, run_mode)


def build_cli_args(config: JobConfig) -> list[str]:
    prefix = resolve_job_prefix(config)
    cli_mode = _cli_mode_from_run_mode(config.run_mode)
    args = [sys.executable, _CLI_PATH]

    if config.source_type == "local_csv":
        if not config.local_csv_path:
            raise ValueError("local_csv_path is required for local_csv source")
        args.extend(["from-csv", config.local_csv_path, "--mode", cli_mode])
        if config.email_column:
            args.extend(["--email-column", config.email_column])
    else:
        args.extend(["run", "--mode", cli_mode])
        if config.list_id:
            args.extend(["--list-id", config.list_id])
        if config.skip_push:
            args.append("--skip-push")
        elif config.campaign_id:
            args.extend(["--campaign-id", config.campaign_id])
        if config.resume_prefix:
            args.extend(["--resume-prefix", config.resume_prefix])

    if config.custom_limit is not None:
        args.extend(["--custom-limit", str(config.custom_limit)])

    if config.allowed_statuses:
        args.extend(["--allowed-statuses", ",".join(config.allowed_statuses)])

    if not config.provision_links:
        args.append("--skip-provision")

    args.extend(["--job-prefix", prefix])
    return args


def start_job(config: JobConfig) -> tuple[bool, str]:
    prefix = resolve_job_prefix(config)
    config.job_prefix = prefix
    active = load_active_job()
    if active and job_is_running(str(active.get("prefix") or "")):
        return False, f"Job already running: {active.get('prefix')}"

    init_job_state(
        prefix,
        run_mode=config.run_mode,
        allowed_statuses=config.allowed_statuses,
        list_id=config.list_id,
        campaign_id=config.campaign_id,
        source_type=config.source_type,
        purge_source=config.purge_source,
        provision_links=config.provision_links,
    )

    os.makedirs(data_dir(), exist_ok=True)
    log_path = job_log_path(prefix)
    args = build_cli_args(config)

    _repo_root = os.path.dirname(os.path.dirname(_LIB_DIR))
    env = os.environ.copy()
    env["PYTHONPATH"] = _repo_root
    env.update(config.extra_env)

    with open(log_path, "a", encoding="utf-8") as log_handle:
        log_handle.write(f"\n--- job {prefix} started ---\n")
        log_handle.flush()
        proc = subprocess.Popen(
            args,
            cwd=_LIB_DIR,
            env=env,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    job = load_job_state(prefix) or {"prefix": prefix}
    job["pid"] = proc.pid
    job["status"] = STATUS_RUNNING
    save_job_state(job)

    with open(_PID_FILE, "w", encoding="utf-8") as handle:
        handle.write(f"{proc.pid}\n{prefix}\n")

    return True, f"Job {prefix} started (pid {proc.pid}). Log: {log_path}"


def cancel_job(prefix: str) -> tuple[bool, str]:
    job = load_job_state(prefix)
    if not job:
        return False, f"Job not found: {prefix}"

    pid = job.get("pid")
    try:
        pid_int = int(pid) if pid is not None else None
    except (TypeError, ValueError):
        pid_int = None

    if pid_int and job_is_running(prefix):
        try:
            os.kill(pid_int, signal.SIGTERM)
        except OSError as exc:
            return False, str(exc)
        mark_job_incomplete(prefix, error="Cancelled by user")
        return True, f"Sent SIGTERM to job {prefix} (pid {pid_int}). Checkpoint preserved."

    return False, f"Job {prefix} is not running."


def load_job_status(prefix: str) -> dict[str, Any] | None:
    job = load_job_state(prefix)
    if not job:
        return None
    job = dict(job)
    job["running"] = job_is_running(prefix)
    job["log_tail"] = tail_job_log(prefix, lines=30)
    return job
