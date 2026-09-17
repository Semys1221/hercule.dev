"""Disk-backed job manifest and heartbeat for crash-resilient clean runs."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from paths import data_dir

STATUS_QUEUED = "queued"
STATUS_RUNNING = "running"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"
STATUS_INCOMPLETE = "incomplete"

HEARTBEAT_STALE_SECONDS = 120


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _atomic_write_json(path: str, payload: dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
    os.replace(tmp, path)


def job_state_path(prefix: str) -> str:
    return os.path.join(data_dir(), f"{prefix}_job.json")


def active_job_path() -> str:
    return os.path.join(data_dir(), "active_job.json")


def job_heartbeat_path() -> str:
    return os.path.join(data_dir(), "job_heartbeat.json")


def job_log_path(prefix: str) -> str:
    return os.path.join(data_dir(), f"{prefix}_run.log")


def save_job_state(state: dict[str, Any], *, prefix: str | None = None) -> str:
    resolved_prefix = prefix or str(state.get("prefix") or "").strip()
    if not resolved_prefix:
        raise ValueError("job state requires a prefix")
    state = dict(state)
    state["prefix"] = resolved_prefix
    state["updated_at"] = _utc_now()
    path = job_state_path(resolved_prefix)
    _atomic_write_json(path, state)
    return path


def load_job_state(prefix: str) -> dict[str, Any] | None:
    path = job_state_path(prefix)
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def set_active_job(prefix: str) -> str:
    payload = {"prefix": prefix, "updated_at": _utc_now()}
    path = active_job_path()
    _atomic_write_json(path, payload)
    return path


def load_active_job() -> dict[str, Any] | None:
    path = active_job_path()
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            return None
        prefix = str(data.get("prefix") or "").strip()
        if not prefix:
            return None
        job = load_job_state(prefix)
        if job is None:
            return {"prefix": prefix, **data}
        return job
    except (OSError, json.JSONDecodeError):
        return None


def clear_active_job() -> None:
    path = active_job_path()
    if os.path.isfile(path):
        os.remove(path)


def touch_job_heartbeat(
    prefix: str,
    *,
    status: str = STATUS_RUNNING,
    phase: str | None = None,
    pid: int | None = None,
) -> str:
    payload: dict[str, Any] = {
        "prefix": prefix,
        "status": status,
        "last_seen": _utc_now(),
    }
    if phase is not None:
        payload["phase"] = phase
    if pid is not None:
        payload["pid"] = pid
    path = job_heartbeat_path()
    _atomic_write_json(path, payload)
    return path


def load_job_heartbeat() -> dict[str, Any] | None:
    path = job_heartbeat_path()
    if not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def heartbeat_age_seconds(heartbeat: dict[str, Any] | None) -> float | None:
    if not heartbeat:
        return None
    last_seen = heartbeat.get("last_seen")
    if not last_seen:
        return None
    try:
        seen = datetime.fromisoformat(str(last_seen))
        if seen.tzinfo is None:
            seen = seen.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - seen).total_seconds()
    except ValueError:
        return None


def pid_is_alive(pid: int | None) -> bool:
    if pid is None or pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def job_is_running(prefix: str, *, stale_seconds: int = HEARTBEAT_STALE_SECONDS) -> bool:
    job = load_job_state(prefix)
    if not job:
        return False
    status = str(job.get("status") or "")
    if status not in {STATUS_QUEUED, STATUS_RUNNING}:
        return False

    pid = job.get("pid")
    try:
        pid_int = int(pid) if pid is not None else None
    except (TypeError, ValueError):
        pid_int = None

    heartbeat = load_job_heartbeat()
    if heartbeat and str(heartbeat.get("prefix") or "") == prefix:
        age = heartbeat_age_seconds(heartbeat)
        if age is not None and age <= stale_seconds:
            return True

    if pid_int is not None and pid_is_alive(pid_int):
        return True

    return False


def init_job_state(
    prefix: str,
    *,
    run_mode: str,
    allowed_statuses: list[str],
    list_id: str | None = None,
    campaign_id: str | None = None,
    source_type: str | None = None,
    purge_source: bool = False,
    provision_links: bool = True,
    pid: int | None = None,
) -> dict[str, Any]:
    now = _utc_now()
    state: dict[str, Any] = {
        "prefix": prefix,
        "status": STATUS_QUEUED if pid is None else STATUS_RUNNING,
        "phase": "starting",
        "pid": pid,
        "started_at": now,
        "updated_at": now,
        "error": None,
        "run_mode": run_mode,
        "allowed_statuses": allowed_statuses,
        "list_id": list_id,
        "campaign_id": campaign_id,
        "source_type": source_type,
        "purge_source": purge_source,
        "provision_links": provision_links,
        "verified_count": 0,
        "total_target": None,
    }
    save_job_state(state)
    set_active_job(prefix)
    touch_job_heartbeat(prefix, status=state["status"], phase="starting", pid=pid)
    return state


def update_job_progress(
    prefix: str,
    *,
    phase: str | None = None,
    verified_count: int | None = None,
    total_target: int | None = None,
    status: str | None = None,
) -> None:
    job = load_job_state(prefix) or {"prefix": prefix, "status": STATUS_RUNNING}
    if phase is not None:
        job["phase"] = phase
    if verified_count is not None:
        job["verified_count"] = verified_count
    if total_target is not None:
        job["total_target"] = total_target
    if status is not None:
        job["status"] = status
    save_job_state(job)
    touch_job_heartbeat(
        prefix,
        status=str(job.get("status") or STATUS_RUNNING),
        phase=str(job.get("phase") or ""),
        pid=job.get("pid"),
    )


def mark_job_completed(prefix: str) -> None:
    job = load_job_state(prefix) or {"prefix": prefix}
    job["status"] = STATUS_COMPLETED
    job["phase"] = "complete"
    job["error"] = None
    save_job_state(job)
    touch_job_heartbeat(prefix, status=STATUS_COMPLETED, phase="complete", pid=job.get("pid"))


def mark_job_failed(prefix: str, error: str) -> None:
    job = load_job_state(prefix) or {"prefix": prefix}
    job["status"] = STATUS_FAILED
    job["phase"] = "failed"
    job["error"] = error
    save_job_state(job)
    touch_job_heartbeat(prefix, status=STATUS_FAILED, phase="failed", pid=job.get("pid"))


def mark_job_incomplete(prefix: str, error: str | None = None) -> None:
    job = load_job_state(prefix) or {"prefix": prefix}
    job["status"] = STATUS_INCOMPLETE
    job["phase"] = "interrupted"
    if error:
        job["error"] = error
    save_job_state(job)
    touch_job_heartbeat(
        prefix,
        status=STATUS_INCOMPLETE,
        phase="interrupted",
        pid=job.get("pid"),
    )


def tail_job_log(prefix: str, lines: int = 50) -> str:
    path = job_log_path(prefix)
    if not os.path.isfile(path):
        return ""
    try:
        with open(path, encoding="utf-8", errors="replace") as handle:
            content = handle.readlines()
    except OSError:
        return ""
    return "".join(content[-lines:])
