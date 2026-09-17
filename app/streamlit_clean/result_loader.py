"""Rebuild PipelineResult from on-disk artifacts after a detached job completes."""

from __future__ import annotations

import os

import pandas as pd

from job_state import load_job_state
from paths import data_dir
from pipeline import PipelineResult


def load_pipeline_result_from_disk(prefix: str) -> PipelineResult | None:
    job = load_job_state(prefix)
    verified_path = os.path.join(data_dir(), f"{prefix}_verified.csv")
    final_path = os.path.join(data_dir(), f"{prefix}_final_clean.csv")
    raw_path = os.path.join(data_dir(), f"{prefix}_raw.csv")
    quick_path = os.path.join(data_dir(), f"{prefix}_quick_clean.csv")

    if not os.path.isfile(verified_path):
        return None

    verified_df = pd.read_csv(verified_path)
    final_clean_df = (
        pd.read_csv(final_path)
        if os.path.isfile(final_path)
        else verified_df[
            verified_df.get("Verification_Status", pd.Series(dtype=str)).isin(
                job.get("allowed_statuses") if job else ["Valid", "Catch All"]
            )
        ].copy()
    )
    rejected_df = verified_df[
        ~verified_df["Verification_Status"].isin(
            job.get("allowed_statuses") if job else ["Valid", "Catch All", "Unknown"]
        )
    ].copy()

    raw_count = len(pd.read_csv(raw_path)) if os.path.isfile(raw_path) else len(verified_df)
    quick_clean_count = (
        len(pd.read_csv(quick_path)) if os.path.isfile(quick_path) else len(verified_df)
    )

    status_counts = {
        str(status): int(count)
        for status, count in verified_df["Verification_Status"].value_counts().items()
    }

    email_column = "email" if "email" in verified_df.columns else str(verified_df.columns[0])
    run_mode = str(job.get("run_mode") if job else "full")

    return PipelineResult(
        raw_count=raw_count,
        quick_clean_count=quick_clean_count,
        quick_rejected_count=max(raw_count - quick_clean_count, 0),
        verified_count=len(verified_df),
        final_clean_count=len(final_clean_df),
        rejected_count=len(rejected_df),
        credits_used=0 if run_mode == "dry_run" else len(verified_df),
        push_attempted=0,
        push_pushed=0,
        push_batches=0,
        push_skipped_duplicate=0,
        purged_count=0,
        email_column=email_column,
        run_mode=run_mode,
        artifact_paths={
            "raw": raw_path,
            "quick_clean": quick_path,
            "verified": verified_path,
            "final_clean": final_path,
            "checkpoint": os.path.join(data_dir(), f"{prefix}_checkpoint.json"),
            "verified_partial": os.path.join(data_dir(), f"{prefix}_verified_partial.csv"),
            "job": os.path.join(data_dir(), f"{prefix}_job.json"),
            "log": os.path.join(data_dir(), f"{prefix}_run.log"),
        },
        quick_stats={},
        status_counts=status_counts,
        verified_df=verified_df,
        final_clean_df=final_clean_df,
        rejected_df=rejected_df,
    )
