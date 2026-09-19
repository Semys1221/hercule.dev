"""Concurrent niche taxonomy filter with STATUS_FILTER CSV checkpointing."""

from __future__ import annotations

import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any, Callable

import pandas as pd

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))
if _LIB_DIR not in sys.path:
    sys.path.insert(0, _LIB_DIR)

_SCRAPER_DIR = os.path.join(os.path.dirname(_LIB_DIR), "streamlit_scraper")
# Append (do not prepend) so local instantly_client is not shadowed by scraper.
if _SCRAPER_DIR not in sys.path:
    sys.path.append(_SCRAPER_DIR)

from category_filter import taxonomy_text_from_csv_row  # noqa: E402
from taxonomy_gate import matches_taxonomy_text  # noqa: E402

from downloader import (  # noqa: E402
    FILTER_REASON_COL,
    NICHE_COL,
    STATUS_FILTER_COL,
    STATUS_NONE_YET,
    STATUS_NON_VALID,
    STATUS_VALID,
)
from niche_config import NICHES, NicheTaxonomy, resolve_niche  # noqa: E402

FLUSH_EVERY = 100
DEFAULT_WORKERS = 8


@dataclass
class FilterStats:
    total: int = 0
    already_done: int = 0
    valid: int = 0
    non_valid: int = 0
    unknown_niche: int = 0
    empty_taxonomy: int = 0


def _row_niche_hints(row: dict[str, Any]) -> list[str]:
    hints: list[str] = []
    for key in ("Niche_raw", "Service", NICHE_COL):
        value = str(row.get(key) or "").strip()
        if value:
            hints.append(value)
    return hints


def _resolve_row_niche(row: dict[str, Any]) -> str | None:
    for hint in _row_niche_hints(row):
        resolved = resolve_niche(hint)
        if resolved:
            return resolved
    return None


def _evaluate_against_niche(
    taxonomy: str,
    niche: NicheTaxonomy,
) -> tuple[bool, str]:
    ok, matched = matches_taxonomy_text(
        taxonomy,
        list(niche.included),
        excluded_keywords=list(niche.excluded) or None,
    )
    if matched and str(matched).startswith("excluded:"):
        return False, f"excluded:{matched[9:]}@{niche.key}"
    if ok:
        return True, f"include:{matched}@{niche.key}"
    return False, f"no_match@{niche.key}"


def evaluate_lead(row: dict[str, Any]) -> dict[str, str]:
    """Return NICHE / STATUS_FILTER / FILTER_REASON for one lead."""
    taxonomy = taxonomy_text_from_csv_row(row)
    if not taxonomy.strip():
        return {
            NICHE_COL: _resolve_row_niche(row) or "",
            STATUS_FILTER_COL: STATUS_NON_VALID,
            FILTER_REASON_COL: "empty_taxonomy",
        }

    niche_key = _resolve_row_niche(row)
    if niche_key and niche_key in NICHES:
        ok, reason = _evaluate_against_niche(taxonomy, NICHES[niche_key])
        return {
            NICHE_COL: niche_key,
            STATUS_FILTER_COL: STATUS_VALID if ok else STATUS_NON_VALID,
            FILTER_REASON_COL: reason,
        }

    # Unknown niche — accept if ANY niche taxonomy matches (exclude still wins per niche)
    for key, niche in NICHES.items():
        ok, reason = _evaluate_against_niche(taxonomy, niche)
        if ok:
            return {
                NICHE_COL: key,
                STATUS_FILTER_COL: STATUS_VALID,
                FILTER_REASON_COL: f"fallback:{reason}",
            }

    return {
        NICHE_COL: "",
        STATUS_FILTER_COL: STATUS_NON_VALID,
        FILTER_REASON_COL: "unknown_niche_no_match",
    }


def run_filter(
    df: pd.DataFrame,
    csv_path: str,
    *,
    max_workers: int = DEFAULT_WORKERS,
    flush_every: int = FLUSH_EVERY,
    on_progress: Callable[[str, float], None] | None = None,
) -> tuple[pd.DataFrame, FilterStats]:
    """Filter rows with STATUS_FILTER=none_yet; flush CSV every `flush_every` updates."""
    work = df.copy()
    for col in (STATUS_FILTER_COL, NICHE_COL, FILTER_REASON_COL):
        if col not in work.columns:
            work[col] = ""

    pending_mask = (
        work[STATUS_FILTER_COL].astype(str).str.strip().str.lower() == STATUS_NONE_YET
    )
    pending_indices = list(work.index[pending_mask])
    stats = FilterStats(
        total=len(work),
        already_done=len(work) - len(pending_indices),
    )

    if not pending_indices:
        stats.valid = int((work[STATUS_FILTER_COL] == STATUS_VALID).sum())
        stats.non_valid = int((work[STATUS_FILTER_COL] == STATUS_NON_VALID).sum())
        return work, stats

    done = 0
    total_pending = len(pending_indices)

    def _process(idx: Any) -> tuple[Any, dict[str, str]]:
        row = work.loc[idx].to_dict()
        return idx, evaluate_lead(row)

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_process, idx): idx for idx in pending_indices}
        for future in as_completed(futures):
            idx, result = future.result()
            work.at[idx, NICHE_COL] = result[NICHE_COL]
            work.at[idx, STATUS_FILTER_COL] = result[STATUS_FILTER_COL]
            work.at[idx, FILTER_REASON_COL] = result[FILTER_REASON_COL]
            done += 1

            if result[STATUS_FILTER_COL] == STATUS_VALID:
                stats.valid += 1
            else:
                stats.non_valid += 1
            if result[FILTER_REASON_COL] == "empty_taxonomy":
                stats.empty_taxonomy += 1
            if result[FILTER_REASON_COL] == "unknown_niche_no_match":
                stats.unknown_niche += 1

            if done % flush_every == 0 or done == total_pending:
                work.to_csv(csv_path, index=False)
                if on_progress:
                    on_progress(
                        f"Filtered {done}/{total_pending}",
                        done / total_pending,
                    )

    # Include already-done rows in final counts
    stats.valid = int((work[STATUS_FILTER_COL] == STATUS_VALID).sum())
    stats.non_valid = int((work[STATUS_FILTER_COL] == STATUS_NON_VALID).sum())
    work.to_csv(csv_path, index=False)
    return work, stats


def valid_rows(df: pd.DataFrame) -> pd.DataFrame:
    return df[df[STATUS_FILTER_COL].astype(str).str.strip().str.lower() == STATUS_VALID].copy()


def non_valid_rows(df: pd.DataFrame) -> pd.DataFrame:
    return df[
        df[STATUS_FILTER_COL].astype(str).str.strip().str.lower() == STATUS_NON_VALID
    ].copy()
