"""MyEmailVerifier bulk upload API: upload → poll → download."""

from __future__ import annotations

import io
import json
import os
import random
import time
from typing import Callable, Optional

# #region agent log
_DEBUG_LOG_PATH = "/Users/evqn/dev/hercule.dev/.cursor/debug-62b9d7.log"
_DEBUG_SESSION_ID = "62b9d7"


def _debug_log(
    location: str,
    message: str,
    data: dict,
    *,
    hypothesis_id: str,
    run_id: str = "pre-fix",
) -> None:
    payload = {
        "sessionId": _DEBUG_SESSION_ID,
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    try:
        with open(_DEBUG_LOG_PATH, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")
    except OSError:
        pass


# #endregion

import pandas as pd
import requests

from core_logic import get_api_key
from paths import data_dir

RUN_MODE_DRY = "dry_run"

_BASE_URL = "https://client.myemailverifier.com"
_UPLOAD_URL = f"{_BASE_URL}/verifier/upload_file"
_HTTP_TIMEOUT = (10, 120)
_MAX_RETRIES = 4
_BACKOFF_BASE = 2.0
_POLL_INTERVAL = 30
_DOWNLOAD_RETRY_ATTEMPTS = 10
_DOWNLOAD_RETRY_INTERVAL = 30
_MAX_CHUNK_SIZE = 100_000
# MEV accepts up to 100k per file, but large single uploads can phantom-complete
# (status=completed, credit_used=0). Smaller chunks are more reliable.
_BULK_UPLOAD_CHUNK_SIZE = 500
_PHANTOM_COMPLETE_MAX_POLLS = 6

BulkProgressCallback = Callable[[str, float], None]


def normalize_status(raw: object) -> str:
    """Map MEV bulk/single labels to pipeline-friendly status strings."""
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return "Missing Status"

    key = str(raw).strip()
    if not key:
        return "Missing Status"

    collapsed = key.lower().replace("-", "").replace("_", "").replace(" ", "")
    mapping = {
        "valid": "Valid",
        "invalid": "Invalid",
        "catchall": "Catch All",
        "unknown": "Unknown",
        "greylisted": "Unknown",
        "duplicate": "Duplicate",
        "spamtrap": "Invalid",
        "disposable": "Invalid",
        "toxicdomains": "Invalid",
    }
    return mapping.get(collapsed, key)


def _normalize_email(email: object) -> str:
    if email is None or (isinstance(email, float) and pd.isna(email)):
        return ""
    return str(email).strip().lower()


def _ready_for_download(file_info: dict) -> bool:
    """MEV sets ready_for_download=1 only when the CSV export is actually ready."""
    value = file_info.get("ready_for_download")
    return value in (1, "1", True) or str(value).strip() == "1"


def _bulk_job_counts(file_info: dict) -> tuple[int, int, int]:
    total = int(file_info.get("total_emails") or file_info.get("total") or 0)
    credit_used = int(file_info.get("credit_used") or 0)
    processed = int(file_info.get("processed_res") or 0)
    return total, credit_used, processed


def _is_bulk_job_ready(file_info: dict) -> bool:
    """
    True when MEV has actually finished verification (not a phantom 'completed').
    Runtime evidence: large jobs can show completed + downloadable with credit_used=0.
    """
    status_label = str(file_info.get("status_label") or "").lower()
    if status_label != "completed":
        return False
    if not file_info.get("downloadable"):
        return False
    if not _ready_for_download(file_info):
        return False

    total, credit_used, processed = _bulk_job_counts(file_info)
    if total > 0 and credit_used == 0 and processed == 0:
        return False
    if total > 0 and credit_used < total and processed < total:
        # Allow partial only while still processing; completed should have full counts.
        result_total = sum(
            int(file_info.get(key) or 0)
            for key in ("valid", "invalid", "catchall", "unknown", "duplicates")
        )
        if result_total == 0:
            return False

    return True


def _find_column(df: pd.DataFrame, candidates: tuple[str, ...]) -> Optional[str]:
    lower_map = {col.lower(): col for col in df.columns}
    for candidate in candidates:
        match = lower_map.get(candidate.lower())
        if match:
            return match
    return None


class BulkEmailVerifierClient:
    """HTTP client for MyEmailVerifier bulk file verification."""

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.session = requests.Session()

    def _request_with_retry(
        self,
        method: str,
        url: str,
        **kwargs,
    ) -> requests.Response:
        last_error: Optional[Exception] = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = self.session.request(
                    method,
                    url,
                    timeout=_HTTP_TIMEOUT,
                    **kwargs,
                )

                if response.status_code == 429:
                    retry_after = _BACKOFF_BASE * attempt
                    try:
                        payload = response.json()
                        retry_after = int(payload.get("retryAfter", retry_after))
                    except ValueError:
                        pass
                    time.sleep(retry_after)
                    continue

                if response.status_code >= 500:
                    time.sleep(_BACKOFF_BASE ** attempt)
                    continue

                if response.status_code == 404 and "downloadreport" in url:
                    # #region agent log
                    _debug_log(
                        "bulk_verifier.py:_request_with_retry",
                        "Download URL returned 404 without retry",
                        {
                            "url": url,
                            "attempt": attempt,
                            "max_retries": _MAX_RETRIES,
                        },
                        hypothesis_id="H2",
                    )
                    # #endregion

                return response

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
                last_error = exc
                time.sleep(_BACKOFF_BASE ** attempt)

        if last_error:
            raise ConnectionError(f"Request failed after retries: {last_error}") from last_error
        raise ConnectionError("Request failed after retries")

    def get_credits(self) -> int:
        url = f"{_BASE_URL}/verifier/getcredits/{self.api_key}"
        response = self._request_with_retry("GET", url)
        response.raise_for_status()

        try:
            data = response.json()
        except ValueError as exc:
            raise ValueError(f"Invalid credits response: {exc}") from exc

        credits_raw = data.get("Credits") or data.get("credits") or "0"
        try:
            return int(str(credits_raw).strip())
        except ValueError as exc:
            raise ValueError(f"Unexpected credits value: {credits_raw}") from exc

    def upload_file(self, csv_path: str) -> int:
        with open(csv_path, "rb") as handle:
            response = self._request_with_retry(
                "POST",
                _UPLOAD_URL,
                files={"filename": (os.path.basename(csv_path), handle, "text/csv")},
                data={"api_key": self.api_key},
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise ValueError(f"Invalid upload response: {response.text[:500]}") from exc

        if not data.get("status"):
            message = data.get("msg") or data.get("message") or "Upload failed"
            raise RuntimeError(message)

        file_id = data.get("file_id")
        if file_id is None:
            raise RuntimeError("Upload succeeded but no file_id returned")

        return int(file_id)

    def _probe_download_url(self, file_info: dict) -> bool:
        download_url = file_info.get("download_all_csv") or file_info.get("file_path")
        if not download_url:
            return False
        try:
            response = self.session.get(str(download_url), timeout=(10, 30))
            return response.status_code == 200 and "text/csv" in (
                response.headers.get("Content-Type") or ""
            )
        except requests.exceptions.RequestException:
            return False

    def poll_until_complete(
        self,
        file_id: int,
        on_progress: Optional[BulkProgressCallback] = None,
    ) -> dict:
        url = f"{_BASE_URL}/verifier/file_info/{self.api_key}/{file_id}"
        phantom_complete_polls = 0

        while True:
            response = self._request_with_retry("GET", url)
            try:
                data = response.json()
            except ValueError as exc:
                raise ValueError(f"Invalid file_info response: {exc}") from exc

            if not data.get("status"):
                message = data.get("message") or "File info request failed"
                raise RuntimeError(message)

            file_info = data.get("file") or {}
            status_label = str(file_info.get("status_label") or "").lower()
            total, credit_used, processed = _bulk_job_counts(file_info)

            if on_progress:
                message, fraction = _format_bulk_progress(file_info)
                on_progress(message, fraction)

            if status_label == "failed":
                raise RuntimeError(
                    f"MEV bulk job {file_id} failed on MyEmailVerifier's side"
                )

            if status_label == "completed":
                download_probe_ok = self._probe_download_url(file_info)
                if _is_bulk_job_ready(file_info) and download_probe_ok:
                    # #region agent log
                    _debug_log(
                        "bulk_verifier.py:poll_until_complete",
                        "MEV bulk job ready for download",
                        {
                            "file_id": file_id,
                            "status_label": status_label,
                            "ready_for_download": file_info.get("ready_for_download"),
                            "credit_used": credit_used,
                            "processed_res": processed,
                            "total_emails": total,
                        },
                        hypothesis_id="H1,H3,H5",
                    )
                    # #endregion
                    return file_info

                phantom_complete_polls += 1
                # #region agent log
                _debug_log(
                    "bulk_verifier.py:poll_until_complete",
                    "MEV reported completed but job not ready yet",
                    {
                        "file_id": file_id,
                        "status_label": status_label,
                        "ready_for_download": file_info.get("ready_for_download"),
                        "downloadable": file_info.get("downloadable"),
                        "credit_used": credit_used,
                        "processed_res": processed,
                        "total_emails": total,
                        "phantom_poll": phantom_complete_polls,
                        "download_probe_ok": download_probe_ok,
                    },
                    hypothesis_id="H1,H3,H5",
                )
                # #endregion

                if phantom_complete_polls >= _PHANTOM_COMPLETE_MAX_POLLS:
                    raise RuntimeError(
                        f"MEV bulk job {file_id} reported completed but no verification "
                        f"ran (credit_used={credit_used}, processed={processed}, "
                        f"total={total}). Check the MEV dashboard and retry the upload."
                    )

            else:
                phantom_complete_polls = 0

            time.sleep(_POLL_INTERVAL)

    def _download_url_candidates(
        self,
        download_url: str,
        file_info: dict | None = None,
    ) -> list[str]:
        candidates: list[str] = []
        for key in ("download_all_csv", "file_path", "download_xls"):
            url = (file_info or {}).get(key)
            if url and url not in candidates:
                candidates.append(str(url))
        if download_url and download_url not in candidates:
            candidates.insert(0, download_url)
        return candidates

    def download_results(
        self,
        download_url: str,
        *,
        file_info: dict | None = None,
    ) -> pd.DataFrame:
        last_error: requests.HTTPError | None = None

        for candidate_url in self._download_url_candidates(download_url, file_info):
            for attempt in range(1, _DOWNLOAD_RETRY_ATTEMPTS + 1):
                # #region agent log
                _debug_log(
                    "bulk_verifier.py:download_results",
                    "Attempting MEV bulk CSV download",
                    {
                        "download_url": candidate_url,
                        "attempt": attempt,
                        "max_attempts": _DOWNLOAD_RETRY_ATTEMPTS,
                    },
                    hypothesis_id="H2,H3,H4",
                )
                # #endregion
                response = self._request_with_retry("GET", candidate_url)
                # #region agent log
                _debug_log(
                    "bulk_verifier.py:download_results",
                    "MEV bulk CSV download response",
                    {
                        "download_url": candidate_url,
                        "attempt": attempt,
                        "status_code": response.status_code,
                        "content_type": response.headers.get("Content-Type"),
                        "content_length": len(response.content),
                        "body_preview": response.text[:200] if response.text else "",
                    },
                    hypothesis_id="H2,H4",
                )
                # #endregion

                if response.status_code == 200:
                    return pd.read_csv(io.StringIO(response.text))

                if response.status_code == 404 and attempt < _DOWNLOAD_RETRY_ATTEMPTS:
                    # #region agent log
                    _debug_log(
                        "bulk_verifier.py:download_results",
                        "MEV download not ready yet; retrying after backoff",
                        {
                            "download_url": candidate_url,
                            "attempt": attempt,
                            "retry_in_seconds": _DOWNLOAD_RETRY_INTERVAL,
                        },
                        hypothesis_id="H2",
                    )
                    # #endregion
                    time.sleep(_DOWNLOAD_RETRY_INTERVAL)
                    continue

                try:
                    response.raise_for_status()
                except requests.HTTPError as exc:
                    last_error = exc
                break

        if last_error:
            raise last_error
        raise RuntimeError("Bulk job completed but CSV download failed for all URLs")

    def parse_results_df(self, df: pd.DataFrame) -> dict[str, str]:
        email_col = _find_column(df, ("Address", "Email", "email", "E-mail"))
        status_col = _find_column(
            df,
            ("Status", "Result", "Verification Status", "verification_status"),
        )

        if not email_col or not status_col:
            raise ValueError(
                f"Could not find email/status columns in bulk result CSV: {list(df.columns)}"
            )

        status_map: dict[str, str] = {}
        for _, row in df.iterrows():
            email = _normalize_email(row[email_col])
            if not email:
                continue
            status_map[email] = normalize_status(row[status_col])

        return status_map


def _format_bulk_progress(file_info: dict) -> tuple[str, float]:
    phase = file_info.get("phase") or "Processing"
    progress_percent = int(file_info.get("progress_percent") or 0)
    percent_phase1 = int(file_info.get("percent_phase1") or 0)
    percent_phase2 = int(file_info.get("percent_phase2") or 0)
    processed = int(file_info.get("processed_res") or 0)
    total = int(file_info.get("total_emails") or file_info.get("total") or 0)
    valid = int(file_info.get("valid") or 0)

    if percent_phase1 < 100:
        fraction = percent_phase1 / 100 * 0.15
        label = f"MEV bulk: {phase} — phase 1 {percent_phase1}%"
    elif percent_phase2 < 100:
        fraction = 0.15 + (percent_phase2 / 100) * 0.15
        label = f"MEV bulk: {phase} — phase 2 {percent_phase2}%"
    else:
        fraction = 0.30 + (progress_percent / 100) * 0.70
        if total:
            label = (
                f"MEV bulk: {phase} — {progress_percent}% "
                f"({valid}/{total} valid, {processed}/{total} processed)"
            )
        else:
            label = f"MEV bulk: {phase} — {progress_percent}%"

    return label, min(max(fraction, 0.0), 1.0)


def _write_upload_csv(emails: list[str], prefix: str, chunk_index: int) -> str:
    os.makedirs(data_dir(), exist_ok=True)
    path = os.path.join(data_dir(), f"{prefix}_mev_upload_{chunk_index}.csv")
    upload_df = pd.DataFrame({"email": emails})
    upload_df.to_csv(path, index=False)
    return path


def _simulate_dry_run(emails: list[str]) -> dict[str, str]:
    status_map: dict[str, str] = {}
    for email in emails:
        normalized = _normalize_email(email)
        if not normalized:
            continue
        time.sleep(0.01)
        status_map[normalized] = random.choice(
            ["Valid", "Valid", "Invalid", "Catch All", "Unknown"]
        )
    return status_map


def fetch_mev_credits() -> int | None:
    """Return current MyEmailVerifier credit balance, or None if unavailable."""
    api_key = get_api_key()
    if not api_key:
        return None
    try:
        return BulkEmailVerifierClient(api_key).get_credits()
    except (ValueError, ConnectionError, requests.exceptions.RequestException):
        return None


def verify_emails_bulk(
    emails: list[str],
    *,
    run_mode: str,
    on_progress: Optional[BulkProgressCallback] = None,
    artifact_prefix: Optional[str] = None,
    existing_status_map: Optional[dict[str, str]] = None,
    on_status_map_updated: Optional[Callable[[dict[str, str]], None]] = None,
) -> dict[str, str]:
    """
    Verify emails via MEV bulk API.
    Returns lowercase email -> normalized Verification_Status.
    Skips emails already present in existing_status_map (resume support).
    """
    valid_emails = [
        str(email).strip()
        for email in emails
        if email is not None
        and str(email).strip()
        and str(email).strip().lower() != "nan"
    ]

    merged: dict[str, str] = {
        _normalize_email(email): normalize_status(status)
        for email, status in (existing_status_map or {}).items()
        if _normalize_email(email)
    }

    pending_emails = [
        email for email in valid_emails if _normalize_email(email) not in merged
    ]

    if run_mode == RUN_MODE_DRY:
        if on_progress:
            on_progress("Dry run: simulating bulk verification...", 0.5)
        simulated = _simulate_dry_run(pending_emails)
        merged.update(simulated)
        if on_status_map_updated:
            on_status_map_updated(merged)
        if on_progress:
            on_progress(
                f"Dry run complete — {len(merged)} email(s) simulated "
                f"({len(simulated)} new, {len(merged) - len(simulated)} resumed).",
                1.0,
            )
        return merged

    if not pending_emails:
        if on_progress:
            on_progress(
                f"All {len(merged)} email(s) already verified — skipping MEV upload.",
                1.0,
            )
        return merged

    api_key = get_api_key()
    if not api_key:
        raise ValueError("MYEMAILVERIFIER_API_KEY is not set")

    client = BulkEmailVerifierClient(api_key)
    prefix = artifact_prefix or "bulk"
    chunk_size = min(_BULK_UPLOAD_CHUNK_SIZE, _MAX_CHUNK_SIZE)
    chunks = [
        pending_emails[index : index + chunk_size]
        for index in range(0, len(pending_emails), chunk_size)
    ]

    if on_progress:
        resumed = len(merged)
        if resumed:
            on_progress(
                f"Resuming — {resumed} already verified, "
                f"{len(pending_emails)} remaining...",
                0.02,
            )
        else:
            on_progress("Checking MyEmailVerifier credits...", 0.02)

    credits = client.get_credits()
    if credits < len(pending_emails):
        raise RuntimeError(
            f"Insufficient MEV credits: need {len(pending_emails)} more, have {credits}"
        )

    upload_paths: list[str] = []

    try:
        for chunk_index, chunk in enumerate(chunks):
            chunk_label = f"chunk {chunk_index + 1}/{len(chunks)}" if len(chunks) > 1 else "list"
            if on_progress:
                on_progress(f"Uploading {len(chunk)} email(s) ({chunk_label})...", 0.05)

            upload_path = _write_upload_csv(chunk, prefix, chunk_index)
            upload_paths.append(upload_path)
            file_id = client.upload_file(upload_path)

            if on_progress:
                on_progress(f"MEV bulk job queued (file_id={file_id})...", 0.08)

            def chunk_progress(message: str, fraction: float) -> None:
                if not on_progress:
                    return
                chunk_base = chunk_index / len(chunks)
                chunk_span = 1.0 / len(chunks)
                on_progress(message, chunk_base + fraction * chunk_span)

            file_info = client.poll_until_complete(file_id, on_progress=chunk_progress)

            download_url = file_info.get("download_all_csv") or file_info.get("file_path")
            if not download_url:
                raise RuntimeError("Bulk job completed but no download URL was returned")
            # #region agent log
            _debug_log(
                "bulk_verifier.py:verify_emails_bulk",
                "Selected MEV download URL",
                {
                    "file_id": file_id,
                    "selected_field": (
                        "download_all_csv"
                        if file_info.get("download_all_csv")
                        else "file_path"
                    ),
                    "download_url": download_url,
                    "alternate_file_path": file_info.get("file_path"),
                    "alternate_download_all_csv": file_info.get("download_all_csv"),
                },
                hypothesis_id="H3,H5",
            )
            # #endregion

            if on_progress:
                on_progress("Downloading bulk verification results...", 0.92)

            results_df = client.download_results(download_url, file_info=file_info)
            merged.update(client.parse_results_df(results_df))

            if on_status_map_updated:
                on_status_map_updated(dict(merged))

        if on_progress:
            on_progress(
                f"MEV bulk complete — {len(merged)} result(s) "
                f"({len(pending_emails)} newly verified).",
                1.0,
            )

        return merged

    finally:
        for path in upload_paths:
            try:
                os.remove(path)
            except OSError:
                pass
