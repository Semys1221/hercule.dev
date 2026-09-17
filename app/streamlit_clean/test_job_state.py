"""Tests for job_state disk persistence."""

from __future__ import annotations

import json
import os

import job_state


def test_save_and_load_job_state_round_trip(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(job_state, "data_dir", lambda: str(tmp_path))
    state = job_state.init_job_state(
        "20260101_120000",
        run_mode="test_50",
        allowed_statuses=["Valid", "Catch All"],
        list_id="list-1",
        campaign_id="camp-1",
    )
    loaded = job_state.load_job_state("20260101_120000")
    assert loaded is not None
    assert loaded["prefix"] == "20260101_120000"
    assert loaded["run_mode"] == "test_50"
    assert loaded["list_id"] == "list-1"
    assert loaded["campaign_id"] == "camp-1"
    assert state["status"] == job_state.STATUS_QUEUED


def test_atomic_write_preserves_previous_on_read(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(job_state, "data_dir", lambda: str(tmp_path))
    path = job_state.job_state_path("prefix_a")
    job_state._atomic_write_json(path, {"prefix": "prefix_a", "status": "running"})
    with open(path, encoding="utf-8") as handle:
        before = json.load(handle)
    assert before["status"] == "running"

    job_state.save_job_state({**before, "status": "completed"})
    with open(path, encoding="utf-8") as handle:
        after = json.load(handle)
    assert after["status"] == "completed"


def test_active_job_pointer(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(job_state, "data_dir", lambda: str(tmp_path))
    job_state.init_job_state("job_x", run_mode="full", allowed_statuses=["Valid"])
    active = job_state.load_active_job()
    assert active is not None
    assert active["prefix"] == "job_x"


def test_job_is_running_false_for_dead_pid(tmp_path, monkeypatch) -> None:
    from datetime import datetime, timedelta, timezone

    monkeypatch.setattr(job_state, "data_dir", lambda: str(tmp_path))
    job_state.init_job_state(
        "job_dead",
        run_mode="full",
        allowed_statuses=["Valid"],
        pid=999999,
    )
    job = job_state.load_job_state("job_dead")
    assert job is not None
    job["status"] = job_state.STATUS_RUNNING
    job_state.save_job_state(job)
    stale_seen = (datetime.now(timezone.utc) - timedelta(seconds=300)).isoformat()
    job_state._atomic_write_json(
        job_state.job_heartbeat_path(),
        {"prefix": "job_dead", "status": "running", "last_seen": stale_seen},
    )
    assert job_state.job_is_running("job_dead") is False


def test_job_is_running_true_with_fresh_heartbeat(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(job_state, "data_dir", lambda: str(tmp_path))
    job_state.init_job_state("job_live", run_mode="full", allowed_statuses=["Valid"])
    job = job_state.load_job_state("job_live")
    assert job is not None
    job["status"] = job_state.STATUS_RUNNING
    job_state.save_job_state(job)
    job_state.touch_job_heartbeat("job_live", status=job_state.STATUS_RUNNING, phase="mev")
    assert job_state.job_is_running("job_live") is True


def test_tail_job_log(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(job_state, "data_dir", lambda: str(tmp_path))
    log_path = job_state.job_log_path("abc")
    os.makedirs(tmp_path, exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as handle:
        handle.write("line1\nline2\nline3\n")
    assert job_state.tail_job_log("abc", lines=2) == "line2\nline3\n"
