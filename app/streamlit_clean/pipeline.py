"""Cleaning pipeline: quick verify → MyEmailVerifier → optional Instantly push."""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
from datetime import datetime, timezone
from typing import Callable

import pandas as pd

from bulk_verifier import fetch_mev_credits, verify_emails_bulk
from checkpoint import (
    load_checkpoint,
    partial_verified_path,
    save_checkpoint,
    save_partial_verified_csv,
)
from job_state import STATUS_RUNNING, update_job_progress
from paths import data_dir
from quick_verifier import detect_email_column, quick_verify_dataframe

from instantly_client import push_leads_to_campaign, purge_leads_from_list
from shared.link_provision_client import provision_leads_batches

RUN_MODE_DRY = "dry_run"
RUN_MODE_TEST_50 = "test_50"
RUN_MODE_FULL = "full"
RUN_MODE_CUSTOM = "custom"


@dataclass
class PipelineResult:
    raw_count: int
    quick_clean_count: int
    quick_rejected_count: int
    verified_count: int
    final_clean_count: int
    rejected_count: int
    credits_used: int
    push_attempted: int
    push_pushed: int
    push_batches: int
    push_skipped_duplicate: int
    purged_count: int
    email_column: str
    run_mode: str
    provision_created: int = 0
    provision_patched: int = 0
    provision_failed: int = 0
    provision_skipped: int = 0
    artifact_paths: dict[str, str] = field(default_factory=dict)
    quick_stats: dict[str, int] = field(default_factory=dict)
    status_counts: dict[str, int] = field(default_factory=dict)
    credits_before: int | None = None
    credits_remaining: int | None = None
    verified_df: pd.DataFrame = field(default_factory=pd.DataFrame)
    final_clean_df: pd.DataFrame = field(default_factory=pd.DataFrame)
    rejected_df: pd.DataFrame = field(default_factory=pd.DataFrame)


def run_mode_to_verify_label(run_mode: str) -> str:
    if run_mode == RUN_MODE_DRY:
        return "Dry Run (Test logic only, 0 credits)"
    if run_mode == RUN_MODE_TEST_50:
        return "Test Mode (Clean first 50 leads, 50 credits)"
    return "Full Clean (Process entire CSV)"


def estimate_credits(row_count: int, run_mode: str) -> int:
    if run_mode == RUN_MODE_DRY:
        return 0
    return row_count


def estimate_minutes(row_count: int, run_mode: str) -> int:
    credits = estimate_credits(row_count, run_mode)
    if credits == 0:
        return 0
    # Bulk API processes server-side; allow queue overhead (~2 min minimum).
    return max(2, round(credits / 2000))


def _apply_row_limit(
    df: pd.DataFrame,
    run_mode: str,
    custom_limit: int | None,
) -> pd.DataFrame:
    if run_mode == RUN_MODE_TEST_50:
        return df.head(50).copy()
    if run_mode == RUN_MODE_CUSTOM and custom_limit is not None and custom_limit > 0:
        return df.head(custom_limit).copy()
    return df.copy()


def _timestamp_prefix() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def _save_csv(df: pd.DataFrame, prefix: str, suffix: str) -> str:
    path = os.path.join(data_dir(), f"{prefix}_{suffix}.csv")
    export = df.copy()
    if "custom_variables" in export.columns:
        export["custom_variables"] = export["custom_variables"].apply(
            lambda value: json.dumps(value) if isinstance(value, dict) else value
        )
    export.to_csv(path, index=False)
    return path


def partial_push_manifest_path(prefix: str) -> str:
    return os.path.join(data_dir(), f"{prefix}_partial_push.json")


def _empty_provision_stats() -> dict[str, int]:
    return {
        "created": 0,
        "patched": 0,
        "failed": 0,
        "skipped": 0,
    }


def _read_row_custom_variables(value: object) -> dict[str, str]:
    if isinstance(value, dict):
        return {str(k): str(v) for k, v in value.items() if v is not None}
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return {str(k): str(v) for k, v in parsed.items() if v is not None}
    return {}


def _merge_custom_variables(
    row: pd.Series,
    custom_variables_by_email: dict[str, dict[str, str]],
    email_column: str,
) -> dict[str, str]:
    email = str(row.get(email_column, row.get("email", ""))).strip().lower()
    merged = _read_row_custom_variables(row.get("custom_variables"))
    provisioned = custom_variables_by_email.get(email)
    if provisioned:
        merged.update(provisioned)
    return merged


def _provision_and_merge_urls(
    df: pd.DataFrame,
    *,
    email_column: str,
    list_id: str | None,
    campaign_id: str,
    provision_links: bool,
    on_progress: Callable[[str, float], None] | None = None,
) -> tuple[pd.DataFrame, dict[str, int]]:
    stats = _empty_provision_stats()
    if not provision_links or df.empty:
        return df, stats

    if not list_id:
        if on_progress:
            on_progress(
                "Link provision skipped — source Instantly list ID is required.",
                0.82,
            )
        return df, stats

    emails = df[email_column].astype(str).str.strip().tolist()

    def log_cb(message: str) -> None:
        if on_progress:
            on_progress(message, 0.82)

    if on_progress:
        on_progress(
            f"Provisioning tracking URLs for {len(df)} clean lead(s)...",
            0.8,
        )

    provision_result = provision_leads_batches(
        emails,
        list_id=list_id,
        campaign_id=campaign_id,
        log_cb=log_cb,
    )

    stats = {
        "created": int(provision_result.get("created") or 0),
        "patched": int(provision_result.get("patched") or 0),
        "failed": int(provision_result.get("failed") or 0),
        "skipped": int(provision_result.get("skipped") or 0),
    }

    custom_variables_by_email = provision_result.get("custom_variables_by_email")
    if not isinstance(custom_variables_by_email, dict) or not custom_variables_by_email:
        return df, stats

    enriched = df.copy()
    enriched["custom_variables"] = enriched.apply(
        lambda row: _merge_custom_variables(
            row,
            custom_variables_by_email,
            email_column,
        ),
        axis=1,
    )
    return enriched, stats


def push_partial_clean(
    prefix: str,
    campaign_id: str,
    allowed_statuses: list[str],
    *,
    source_list_id: str | None = None,
    provision_links: bool = True,
    on_progress: Callable[[str, float], None] | None = None,
) -> dict[str, int]:
    """
    Push already-verified clean leads from checkpoint partial CSV.
    Does not modify the MEV checkpoint — safe to resume verification afterward.
    """
    partial_path = partial_verified_path(prefix)
    if not os.path.isfile(partial_path):
        raise FileNotFoundError(f"Partial verified CSV not found: {partial_path}")

    partial_df = pd.read_csv(partial_path)
    clean_df = partial_df[
        partial_df["Verification_Status"].isin(allowed_statuses)
    ].copy()

    empty_stats = {
        "attempted": 0,
        "batches": 0,
        "pushed": 0,
        "skipped_duplicate": 0,
        "failed": 0,
        "clean_rows": 0,
        "provision_created": 0,
        "provision_patched": 0,
        "provision_failed": 0,
        "provision_skipped": 0,
    }
    if clean_df.empty:
        return empty_stats

    email_column = detect_email_column(clean_df) or (
        "email" if "email" in clean_df.columns else clean_df.columns[0]
    )
    clean_df, provision_stats = _provision_and_merge_urls(
        clean_df,
        email_column=email_column,
        list_id=source_list_id,
        campaign_id=campaign_id.strip(),
        provision_links=provision_links,
        on_progress=on_progress,
    )

    if on_progress:
        on_progress(
            f"Pushing {len(clean_df)} partial clean lead(s) to campaign...",
            0.9,
        )

    push_stats = push_leads_to_campaign(
        campaign_id.strip(),
        clean_df,
        dry_run=False,
        on_progress=on_progress,
    )

    checkpoint_loaded = load_checkpoint(prefix)
    verified_count = len(checkpoint_loaded[0]) if checkpoint_loaded else len(partial_df)
    checkpoint_meta = checkpoint_loaded[1] if checkpoint_loaded else {}
    manifest = {
        "artifact_prefix": prefix,
        "pushed_at": datetime.now(timezone.utc).isoformat(),
        "campaign_id": campaign_id.strip(),
        "allowed_statuses": allowed_statuses,
        "clean_rows": len(clean_df),
        "verified_count_at_push": verified_count,
        "total_target": checkpoint_meta.get("total_target"),
        **push_stats,
        **{f"provision_{key}": value for key, value in provision_stats.items()},
    }
    manifest_path = partial_push_manifest_path(prefix)
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2, sort_keys=True)

    return {
        "clean_rows": len(clean_df),
        "manifest_path": manifest_path,
        **push_stats,
        **{f"provision_{key}": value for key, value in provision_stats.items()},
    }


def run_cleaning_pipeline(
    *,
    source_df: pd.DataFrame,
    run_mode: str,
    custom_limit: int | None,
    allowed_statuses: list[str],
    destination_campaign_id: str | None,
    source_list_id: str | None = None,
    purge_source: bool = False,
    email_column: str | None = None,
    on_progress: Callable[[str, float], None] | None = None,
    artifact_prefix: str | None = None,
    resume_prefix: str | None = None,
    skip_quick_verify: bool = False,
    provision_links: bool = True,
    job_prefix: str | None = None,
) -> PipelineResult:
    prefix = resume_prefix or artifact_prefix or job_prefix or _timestamp_prefix()
    track_job = job_prefix or prefix
    raw_count = len(source_df)

    def _report_progress(message: str, fraction: float) -> None:
        update_job_progress(track_job, phase=message, status=STATUS_RUNNING)
        if on_progress:
            on_progress(message, fraction)

    if skip_quick_verify:
        if not email_column or email_column not in source_df.columns:
            raise ValueError("email_column is required when skip_quick_verify=True")
        quick_clean_df = source_df.copy()
        quick_result_email_col = email_column
        quick_stats = {
            "format_errors": 0,
            "garbage_domains": 0,
            "dns_errors": 0,
            "total_processed": len(source_df),
        }
        quick_rejected_count = 0
        _report_progress("Skipping quick verify (resuming saved list)...", 0.05)
    else:
        _report_progress("Running quick local verification (free)...", 0.05)

        quick_result = quick_verify_dataframe(
            source_df,
            email_column=email_column,
            on_progress=lambda current, total: _report_progress(
                f"Quick verify: {current}/{total}",
                0.05 + (current / total) * 0.25,
            ),
        )
        quick_clean_df = quick_result.clean_df
        quick_result_email_col = quick_result.email_column
        quick_stats = {
            "format_errors": quick_result.format_errors,
            "garbage_domains": quick_result.garbage_domains,
            "dns_errors": quick_result.dns_errors,
            "total_processed": quick_result.total_processed,
        }
        quick_rejected_count = len(quick_result.rejected_df)
    limited_df = _apply_row_limit(quick_clean_df, run_mode, custom_limit)
    is_dry = run_mode == RUN_MODE_DRY

    raw_path = _save_csv(source_df, prefix, "raw")
    quick_path = _save_csv(quick_clean_df, prefix, "quick_clean")

    purged_count = 0
    if purge_source and source_list_id and not is_dry:
        _report_progress("Purging source list on Instantly...", 0.28)

        def purge_log(message: str) -> None:
            _report_progress(message, 0.28)

        purged_count = purge_leads_from_list(source_list_id, log_cb=purge_log)
        _report_progress(f"Purged {purged_count} lead(s) from source list.", 0.29)

    total_emails = len(limited_df)
    email_col = quick_result_email_col
    credits_before: int | None = None
    if not is_dry:
        credits_before = fetch_mev_credits()

    existing_status_map: dict[str, str] = {}
    checkpoint_loaded = load_checkpoint(prefix)
    if checkpoint_loaded:
        existing_status_map, checkpoint_meta = checkpoint_loaded
        _report_progress(
            f"Loaded checkpoint — {len(existing_status_map)} email(s) already verified.",
            0.29,
        )

    def persist_checkpoint(status_map: dict[str, str]) -> None:
        save_checkpoint(
            prefix,
            status_map,
            total_target=total_emails,
            source_artifact=os.path.join(data_dir(), f"{prefix}_quick_clean.csv"),
            list_id=source_list_id,
            campaign_id=destination_campaign_id,
            run_mode=run_mode,
            allowed_statuses=allowed_statuses,
        )
        save_partial_verified_csv(prefix, limited_df, email_col, status_map)
        update_job_progress(
            track_job,
            phase="mev_verify",
            verified_count=len(status_map),
            total_target=total_emails,
            status=STATUS_RUNNING,
        )

    def bulk_progress(message: str, fraction: float) -> None:
        _report_progress(message, 0.3 + fraction * 0.5)

    emails = limited_df[email_col].astype(str).str.strip().tolist()
    status_map = verify_emails_bulk(
        emails,
        run_mode=run_mode,
        on_progress=bulk_progress,
        artifact_prefix=prefix,
        existing_status_map=existing_status_map,
        on_status_map_updated=persist_checkpoint if not is_dry else None,
    )
    if not is_dry:
        persist_checkpoint(status_map)
    verification_results = [
        status_map.get(str(email).strip().lower(), "Missing Status")
        for email in limited_df[email_col]
    ]

    verified_df = limited_df.copy()
    verified_df["Verification_Status"] = verification_results
    verified_path = _save_csv(verified_df, prefix, "verified")

    final_clean_df = verified_df[verified_df["Verification_Status"].isin(allowed_statuses)].copy()
    rejected_df = verified_df[~verified_df["Verification_Status"].isin(allowed_statuses)].copy()

    final_path = _save_csv(final_clean_df, prefix, "final_clean")

    push_stats = {
        "attempted": 0,
        "batches": 0,
        "pushed": 0,
        "skipped_duplicate": 0,
        "failed": 0,
    }
    provision_stats = _empty_provision_stats()
    if destination_campaign_id and not is_dry and not final_clean_df.empty:
        final_clean_df, provision_stats = _provision_and_merge_urls(
            final_clean_df,
            email_column=email_col,
            list_id=source_list_id,
            campaign_id=destination_campaign_id,
            provision_links=provision_links,
            on_progress=lambda message, fraction: _report_progress(message, 0.8 + fraction * 0.1),
        )

        _report_progress("Pushing cleaned leads to Instantly campaign...", 0.9)

        push_stats = push_leads_to_campaign(
            destination_campaign_id,
            final_clean_df,
            dry_run=False,
            on_progress=lambda message, fraction: _report_progress(message, 0.9 + fraction * 0.1),
        )

    _report_progress("Pipeline complete.", 1.0)

    credits_used = 0 if is_dry else total_emails
    credits_remaining: int | None = None
    if not is_dry:
        credits_remaining = fetch_mev_credits()

    status_counts = {
        str(status): int(count)
        for status, count in verified_df["Verification_Status"].value_counts().items()
    }

    return PipelineResult(
        raw_count=raw_count,
        quick_clean_count=len(quick_clean_df),
        quick_rejected_count=quick_rejected_count,
        verified_count=total_emails,
        final_clean_count=len(final_clean_df),
        rejected_count=len(rejected_df),
        credits_used=credits_used,
        push_attempted=push_stats["attempted"],
        push_pushed=push_stats["pushed"],
        push_batches=push_stats["batches"],
        push_skipped_duplicate=push_stats.get("skipped_duplicate", 0),
        provision_created=provision_stats["created"],
        provision_patched=provision_stats["patched"],
        provision_failed=provision_stats["failed"],
        provision_skipped=provision_stats["skipped"],
        purged_count=purged_count,
        email_column=email_col,
        run_mode=run_mode,
        artifact_paths={
            "raw": raw_path,
            "quick_clean": quick_path,
            "verified": verified_path,
            "final_clean": final_path,
            "checkpoint": os.path.join(data_dir(), f"{prefix}_checkpoint.json"),
            "verified_partial": os.path.join(data_dir(), f"{prefix}_verified_partial.csv"),
        },
        quick_stats=quick_stats,
        status_counts=status_counts,
        credits_before=credits_before,
        credits_remaining=credits_remaining,
        verified_df=verified_df,
        final_clean_df=final_clean_df,
        rejected_df=rejected_df,
    )
