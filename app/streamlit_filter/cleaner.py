"""Purge Instantly list then re-upload valid filtered leads."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Callable

import pandas as pd

try:
    from instantly_client import _get_client, purge_leads_from_list
except ImportError:  # pragma: no cover
    import sys
    from pathlib import Path

    _root = Path(__file__).resolve().parents[2]
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))
    from shared.instantly_client import purge_leads_from_list
    from shared.instantly_client import _get_client  # type: ignore

_BULK_BATCH_SIZE = 1000  # Instantly accepts up to ~1k; was 100 (too slow)


def _parse_add_response(data: Any, batch_size: int) -> dict[str, int]:
    if not isinstance(data, dict):
        return {"pushed": 0, "skipped_duplicate": 0, "failed": batch_size}
    pushed = int(data.get("leads_uploaded") or 0)
    skipped = int(data.get("skipped_count") or 0)
    failed = max(batch_size - pushed - skipped, 0)
    return {"pushed": pushed, "skipped_duplicate": skipped, "failed": failed}


@dataclass
class CleanStats:
    deleted: int = 0
    attempted: int = 0
    pushed: int = 0
    skipped_duplicate: int = 0
    failed: int = 0


def _row_to_list_lead(row: dict[str, Any], list_id: str) -> dict[str, Any] | None:
    email = str(row.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return None

    lead: dict[str, Any] = {
        "email": email,
        "list_id": list_id.strip(),
    }

    for field in ("first_name", "last_name", "company_name", "website", "phone", "personalization"):
        value = row.get(field)
        if value is not None and str(value).strip():
            lead[field] = str(value).strip()

    custom: dict[str, Any] = {}
    raw_cv = row.get("custom_variables_json")
    if isinstance(raw_cv, str) and raw_cv.strip():
        try:
            parsed = json.loads(raw_cv)
            if isinstance(parsed, dict):
                custom.update({str(k): v for k, v in parsed.items() if v is not None})
        except json.JSONDecodeError:
            pass

    # Prefer flattened taxonomy / niche columns when present
    field_map = {
        "type": "Type",
        "category": "Category",
        "subtypes": "Subtypes",
        "city": "City",
        "service": "Service",
        "niche": "NICHE",
        "subniche": "Subniche",
        "siret": "Siret",
        "siren": "Siren",
        "effectif": "Effectif",
        "naf": "Naf",
        "forme_juridique": "FormeJuridique",
        "annee_creation": "AnneeCreation",
        "chiffre_affaires": "ChiffreAffaires",
        "taille_entreprise": "TailleEntreprise",
        "lead_score": "LeadScore",
        "tranche_effectif": "TrancheEffectif",
        "status_filter": "STATUS_FILTER",
    }
    for dest, src in field_map.items():
        value = row.get(src)
        if value is not None and str(value).strip():
            custom[dest] = str(value).strip()

    # Keep Niche_raw as niche if NICHE empty
    if not custom.get("niche"):
        niche_raw = row.get("Niche_raw")
        if niche_raw is not None and str(niche_raw).strip():
            custom["niche"] = str(niche_raw).strip()

    if custom:
        lead["custom_variables"] = custom
    return lead


def push_valid_leads_to_list(
    list_id: str,
    rows: pd.DataFrame,
    *,
    on_progress: Callable[[str, float], None] | None = None,
    log_cb: Callable[[str], None] | None = None,
) -> dict[str, int]:
    """Upload valid leads back to the same Instantly list (workspace skip off)."""
    empty = {
        "attempted": 0,
        "pushed": 0,
        "skipped_duplicate": 0,
        "failed": 0,
    }
    if rows.empty:
        return empty

    leads: list[dict[str, Any]] = []
    for record in rows.to_dict(orient="records"):
        lead = _row_to_list_lead(record, list_id)
        if lead:
            leads.append(lead)

    attempted = len(leads)
    if not leads:
        return empty

    client = _get_client()
    pushed = 0
    skipped = 0
    failed = 0
    batches = 0

    for start in range(0, attempted, _BULK_BATCH_SIZE):
        batch = leads[start : start + _BULK_BATCH_SIZE]
        response = client._fetch(
            "/leads/add",
            method="POST",
            body={
                "list_id": list_id.strip(),
                "leads": batch,
                "skip_if_in_workspace": False,
                "skip_if_in_campaign": False,
                "skip_if_in_list": False,
            },
        )
        stats = _parse_add_response(response, len(batch))
        batches += 1
        pushed += stats["pushed"]
        skipped += stats["skipped_duplicate"]
        failed += stats["failed"]
        done = pushed + skipped + failed
        if log_cb:
            log_cb(
                f"Re-upload batch {batches}: +{stats['pushed']} pushed, "
                f"{stats['skipped_duplicate']} skipped, {stats['failed']} failed"
            )
        if on_progress:
            on_progress(
                f"Re-uploaded {done}/{attempted}",
                done / attempted,
            )

    return {
        "attempted": attempted,
        "pushed": pushed,
        "skipped_duplicate": skipped,
        "failed": failed,
    }


def delete_and_reupload(
    list_id: str,
    valid_df: pd.DataFrame,
    *,
    log_cb: Callable[[str], None] | None = None,
    on_progress: Callable[[str, float], None] | None = None,
) -> CleanStats:
    """Purge the Instantly list, then push only valid leads back."""
    if log_cb:
        log_cb(f"Purging all leads from Instantly list {list_id}...")
    deleted = purge_leads_from_list(list_id, log_cb=log_cb)

    if log_cb:
        log_cb(f"Purged {deleted} lead(s). Re-uploading {len(valid_df)} valid lead(s)...")

    push_stats = push_valid_leads_to_list(
        list_id,
        valid_df,
        on_progress=on_progress,
        log_cb=log_cb,
    )
    return CleanStats(
        deleted=deleted,
        attempted=push_stats["attempted"],
        pushed=push_stats["pushed"],
        skipped_duplicate=push_stats["skipped_duplicate"],
        failed=push_stats["failed"],
    )


def create_lead_list(name: str) -> dict[str, Any]:
    """Create an Instantly lead list; return API payload (must include id)."""
    data = _get_client()._fetch("/lead-lists", method="POST", body={"name": name})
    if not isinstance(data, dict) or not data.get("id"):
        raise RuntimeError(f"Instantly create lead list returned no id: {data!r}")
    return data


def delete_lead_list(list_id: str) -> None:
    """Delete an Instantly lead list (404 ignored).

    Instantly requires a JSON body even for DELETE — send {}.
    """
    try:
        _get_client()._fetch(
            f"/lead-lists/{list_id.strip()}",
            method="DELETE",
            body={},
        )
    except RuntimeError as exc:
        if "404" not in str(exc):
            raise


@dataclass
class NichePushResult:
    niche: str
    list_name: str
    list_id: str
    attempted: int = 0
    pushed: int = 0
    skipped_duplicate: int = 0
    failed: int = 0


def push_valid_by_niche(
    valid_df: pd.DataFrame,
    *,
    list_name_prefix: str = "TEMP - ",
    log_cb: Callable[[str], None] | None = None,
    on_progress: Callable[[str, float], None] | None = None,
) -> list[NichePushResult]:
    """Create one Instantly list per niche and push valid leads into each."""
    if "NICHE" not in valid_df.columns:
        raise ValueError("valid_df missing NICHE column")

    results: list[NichePushResult] = []
    niches = sorted(
        n for n in valid_df["NICHE"].astype(str).str.strip().unique() if n
    )

    for niche in niches:
        list_name = f"{list_name_prefix}{niche}"
        subset = valid_df[valid_df["NICHE"].astype(str).str.strip() == niche]
        if log_cb:
            log_cb(f"Creating list {list_name!r} for {len(subset)} lead(s)...")
        created = create_lead_list(list_name)
        list_id = str(created["id"])
        if log_cb:
            log_cb(f"Created {list_name} → {list_id}")

        def _progress(msg: str, frac: float, _niche: str = niche) -> None:
            if on_progress:
                on_progress(f"[{_niche}] {msg}", frac)

        stats = push_valid_leads_to_list(
            list_id,
            subset,
            on_progress=_progress if on_progress else None,
            log_cb=log_cb,
        )
        results.append(
            NichePushResult(
                niche=niche,
                list_name=list_name,
                list_id=list_id,
                attempted=stats["attempted"],
                pushed=stats["pushed"],
                skipped_duplicate=stats["skipped_duplicate"],
                failed=stats["failed"],
            )
        )
    return results


def migrate_to_temp_lists_and_delete_source(
    source_list_id: str,
    valid_df: pd.DataFrame,
    *,
    list_name_prefix: str = "TEMP - ",
    log_cb: Callable[[str], None] | None = None,
    on_progress: Callable[[str, float], None] | None = None,
) -> tuple[list[NichePushResult], int]:
    """Create TEMP - {NICHE} lists, delete source list in one shot, push valid leads.

    Skips the slow per-1000 purge loop — DELETE /lead-lists/{id} clears the source.
    Local CSV is the recovery backup.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    if "NICHE" not in valid_df.columns:
        raise ValueError("valid_df missing NICHE column")

    niches = sorted(
        n for n in valid_df["NICHE"].astype(str).str.strip().unique() if n
    )
    created: list[tuple[str, str, pd.DataFrame]] = []

    for niche in niches:
        list_name = f"{list_name_prefix}{niche}"
        subset = valid_df[valid_df["NICHE"].astype(str).str.strip() == niche].copy()
        if log_cb:
            log_cb(f"Creating list {list_name!r} for {len(subset)} lead(s)...")
        payload = create_lead_list(list_name)
        list_id = str(payload["id"])
        if log_cb:
            log_cb(f"Created {list_name} → {list_id}")
        created.append((niche, list_id, subset))

    if log_cb:
        log_cb(f"Deleting source list {source_list_id} (one-shot, no purge loop)...")
    delete_lead_list(source_list_id)
    deleted = -1  # unknown count — list deleted wholesale
    if log_cb:
        log_cb("Source list deleted. Uploading to TEMP lists in parallel...")

    results: list[NichePushResult] = []

    def _push_one(item: tuple[str, str, pd.DataFrame]) -> NichePushResult:
        niche, list_id, subset = item
        list_name = f"{list_name_prefix}{niche}"
        if log_cb:
            log_cb(f"Pushing {len(subset)} lead(s) → {list_name}...")
        stats = push_valid_leads_to_list(
            list_id,
            subset,
            on_progress=(
                (lambda msg, frac, _n=niche: on_progress(f"[{_n}] {msg}", frac))
                if on_progress
                else None
            ),
            log_cb=log_cb,
        )
        return NichePushResult(
            niche=niche,
            list_name=list_name,
            list_id=list_id,
            attempted=stats["attempted"],
            pushed=stats["pushed"],
            skipped_duplicate=stats["skipped_duplicate"],
            failed=stats["failed"],
        )

    with ThreadPoolExecutor(max_workers=min(6, len(created) or 1)) as pool:
        futures = [pool.submit(_push_one, item) for item in created]
        for fut in as_completed(futures):
            results.append(fut.result())

    results.sort(key=lambda r: r.niche)
    return results, deleted
