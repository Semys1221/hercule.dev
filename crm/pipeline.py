"""Business logic for link tracking provisioning (testable without Streamlit UI)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

import pandas as pd
from supabase import Client

from config import instantly_patch_concurrency
from instantly_client import InstantlyClient, lead_to_row
from slug import allocate_slugs, build_instantly_custom_variables, lead_slug
from supabase_repo import (
    BatchInsertPartialError,
    BatchUpdatePartialError,
    LeadCategory,
    build_insert_row,
    build_refresh_patch,
    find_by_email,
    get_client,
    insert_leads_batch,
    load_email_index,
    load_slug_set,
    normalize_email,
    provision_lead,
    update_leads_batch,
)

EMAIL_ALIASES = ("email", "e-mail", "mail", "courriel", "adresse email")
# phase, done, total, label
ProgressCallback = Callable[[str, int, int, str], None]


@dataclass
class ProvisionResult:
    created: int = 0
    updated: int = 0
    patched: int = 0
    skipped: int = 0
    failed: int = 0
    insert_failed: int = 0
    update_failed: int = 0
    partial_supabase: bool = False
    rows: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


@dataclass
class _ParsedInstantlyLead:
    email: str
    instantly_lead_id: str
    first_name: str | None
    company_name: str | None
    source_row: dict[str, Any]


def detect_email_column(df: pd.DataFrame) -> str | None:
    lower_map = {col.lower().strip(): col for col in df.columns}
    for alias in EMAIL_ALIASES:
        if alias in lower_map:
            return lower_map[alias]
    return None


def _as_str(value: Any) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass
    text = str(value).strip()
    if text.lower() in ("nan", "none", "<na>"):
        return ""
    return text


def _notify(
    callback: ProgressCallback | None,
    phase: str,
    done: int,
    total: int,
    label: str,
) -> None:
    if callback:
        callback(phase, done, total, label)


def _result_row(
    *,
    email: str,
    db_row: dict[str, Any],
    category: LeadCategory,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    slug = lead_slug(db_row)
    return {
        **(extra or {}),
        "email": email,
        "slug": slug,
        "reservation_agence_link": db_row.get("reservation_agence_link"),
        "reservation_entreprise_link": db_row.get("reservation_entreprise_link"),
        "confirmation_agence_link": db_row.get("confirmation_agence_link"),
        "statut": db_row.get("statut") or "NOTBOOKED",
        "category": category,
        "instantly_lead_id": db_row.get("instantly_lead_id"),
    }


def _parse_instantly_lead(lead: dict[str, Any]) -> _ParsedInstantlyLead | None:
    row = lead_to_row(lead)
    email = _as_str(row.get("email")).lower()
    instantly_lead_id = _as_str(row.get("instantly_lead_id") or lead.get("id"))
    if not email or "@" not in email:
        return None
    return _ParsedInstantlyLead(
        email=email,
        instantly_lead_id=instantly_lead_id,
        first_name=_as_str(row.get("first_name")) or None,
        company_name=_as_str(row.get("company_name")) or None,
        source_row=row,
    )


def provision_from_instantly_leads(
    *,
    category: LeadCategory,
    campaign_id: str,
    selected_leads: list[dict[str, Any]],
    instantly: InstantlyClient,
    supabase: Client | None = None,
    patch_instantly: bool = True,
    instantly_only: bool = False,
    instantly_workers: int | None = None,
    on_progress: ProgressCallback | None = None,
) -> ProvisionResult:
    client = supabase or get_client()
    result = ProvisionResult()
    workers = instantly_workers or instantly_patch_concurrency()

    # --- Phase 1: preload + partition ---
    _notify(on_progress, "prepare", 0, len(selected_leads), "Chargement index Supabase…")
    email_index = load_email_index(client)
    slug_set = load_slug_set(client)

    to_create: list[_ParsedInstantlyLead] = []
    to_update: list[tuple[_ParsedInstantlyLead, dict[str, Any]]] = []
    instantly_only_rows: list[tuple[_ParsedInstantlyLead, dict[str, Any]]] = []

    for lead in selected_leads:
        parsed = _parse_instantly_lead(lead)
        if parsed is None:
            result.failed += 1
            lead_id = _as_str(lead.get("id") or lead.get("instantly_lead_id"))
            result.errors.append(f"Invalid email for lead {lead_id or '?'}")
            continue

        existing = email_index.get(parsed.email)
        if existing:
            existing_category, existing_row = existing
            if existing_category != category:
                result.failed += 1
                result.errors.append(
                    f"{parsed.email}: already in `{existing_category}`, "
                    f"cannot provision as `{category}`"
                )
                continue
            if instantly_only:
                instantly_only_rows.append((parsed, existing_row))
            else:
                to_update.append((parsed, existing_row))
        elif instantly_only:
            result.failed += 1
            result.errors.append(
                f"{parsed.email}: not in Supabase — disable Instantly-only or provision first"
            )
        else:
            to_create.append(parsed)

    _notify(on_progress, "prepare", len(selected_leads), len(selected_leads), "Index chargé")

    db_rows_by_email: dict[str, dict[str, Any]] = {}

    # --- Phase 2: Supabase batch writes ---
    supabase_total = len(to_create) + len(to_update)
    if instantly_only:
        for parsed, existing_row in instantly_only_rows:
            db_rows_by_email[parsed.email] = {
                **existing_row,
                "instantly_lead_id": parsed.instantly_lead_id or existing_row.get("instantly_lead_id"),
                "instantly_campaign_id": campaign_id or existing_row.get("instantly_campaign_id"),
            }
        result.skipped += len(instantly_only_rows)
    elif supabase_total:
        insert_done = 0
        if to_create:
            _notify(on_progress, "supabase", 0, supabase_total, "Insert batch…")
            new_slugs = allocate_slugs(slug_set, len(to_create))
            insert_rows = [
                build_insert_row(
                    category=category,
                    email=parsed.email,
                    slug=slug,
                    instantly_lead_id=parsed.instantly_lead_id or None,
                    instantly_campaign_id=campaign_id or None,
                    first_name=parsed.first_name,
                    company=parsed.company_name,
                )
                for parsed, slug in zip(to_create, new_slugs, strict=True)
            ]

            def _insert_progress(done: int, total: int) -> None:
                _notify(
                    on_progress,
                    "supabase",
                    done,
                    supabase_total,
                    f"Insert {done}/{total}",
                )

            try:
                inserted = insert_leads_batch(
                    client,
                    category=category,
                    rows=insert_rows,
                    on_progress=_insert_progress,
                )
                result.created += len(inserted)
                for row in inserted:
                    db_rows_by_email[normalize_email(str(row.get("email") or ""))] = row
                insert_done = len(to_create)
            except BatchInsertPartialError as partial:
                result.partial_supabase = True
                result.created += len(partial.inserted)
                for row in partial.inserted:
                    db_rows_by_email[normalize_email(str(row.get("email") or ""))] = row
                result.insert_failed += len(partial.remaining)
                result.failed += len(partial.remaining)
                insert_done = len(partial.inserted)
                failed_preview = ", ".join(
                    normalize_email(str(row.get("email") or ""))
                    for row in partial.remaining[:5]
                )
                suffix = "…" if len(partial.remaining) > 5 else ""
                result.errors.append(
                    f"Supabase insert partial: {len(partial.inserted)} ok, "
                    f"{len(partial.remaining)} failed ({partial.cause}). "
                    f"Failed emails: {failed_preview}{suffix}. "
                    "Re-run Provision to resume; Instantly will patch successful rows."
                )
            except Exception as exc:
                result.failed += len(to_create)
                result.insert_failed += len(to_create)
                result.errors.append(f"Supabase insert failed: {exc}")
                if not db_rows_by_email:
                    return result

            _notify(
                on_progress,
                "supabase",
                insert_done,
                supabase_total,
                "Insert terminé",
            )

        if to_update:
            _notify(
                on_progress,
                "supabase",
                len(to_create),
                supabase_total,
                "Update batch…",
            )
            update_specs = [
                (
                    str(existing_row["id"]),
                    build_refresh_patch(
                        existing_row,
                        instantly_lead_id=parsed.instantly_lead_id or None,
                        instantly_campaign_id=campaign_id or None,
                    ),
                )
                for parsed, existing_row in to_update
            ]

            def _update_progress(done: int, total: int) -> None:
                _notify(
                    on_progress,
                    "supabase",
                    len(to_create) + done,
                    supabase_total,
                    f"Update {done}/{total}",
                )

            try:
                updated = update_leads_batch(
                    client,
                    category=category,
                    updates=update_specs,
                    on_progress=_update_progress,
                )
                result.updated += len(updated)
                for row in updated:
                    db_rows_by_email[normalize_email(str(row.get("email") or ""))] = row
            except BatchUpdatePartialError as partial:
                result.partial_supabase = True
                result.updated += len(partial.updated)
                for row in partial.updated:
                    db_rows_by_email[normalize_email(str(row.get("email") or ""))] = row
                result.update_failed += len(partial.remaining)
                result.failed += len(partial.remaining)
                result.errors.append(
                    f"Supabase update partial: {len(partial.updated)} ok, "
                    f"{len(partial.remaining)} failed ({partial.cause}). "
                    "Re-run Provision to resume; Instantly will patch successful rows."
                )
            except Exception as exc:
                result.partial_supabase = True
                result.update_failed += len(to_update)
                result.failed += len(to_update)
                result.errors.append(
                    f"Supabase update failed: {exc}. Instantly will patch rows already written."
                )
            _notify(on_progress, "supabase", supabase_total, supabase_total, "Update terminé")

    # --- Phase 3: Instantly parallel PATCH ---
    patch_items: list[tuple[str, dict[str, str], str]] = []
    for lead in selected_leads:
        parsed = _parse_instantly_lead(lead)
        if parsed is None:
            continue
        db_row = db_rows_by_email.get(parsed.email)
        if not db_row:
            existing = email_index.get(parsed.email)
            if existing and existing[0] == category:
                db_row = existing[1]
        if not db_row:
            continue
        if patch_instantly and parsed.instantly_lead_id:
            patch_items.append(
                (
                    parsed.instantly_lead_id,
                    build_instantly_custom_variables(
                        lead_slug(db_row),
                        parsed.email,
                        str(db_row.get("statut") or "NOTBOOKED"),
                    ),
                    parsed.email,
                )
            )
        elif patch_instantly and not parsed.instantly_lead_id:
            result.errors.append(f"No Instantly lead id for {parsed.email} — Supabase only")

    if patch_instantly and patch_items:
        instantly_pairs = [(lead_id, vars_) for lead_id, vars_, _ in patch_items]

        def _instantly_progress(done: int, total: int) -> None:
            label = patch_items[min(done - 1, len(patch_items) - 1)][2] if done else ""
            _notify(on_progress, "instantly", done, total, label)

        stats = instantly.patch_leads_custom_variables_parallel(
            instantly_pairs,
            max_workers=workers,
            on_progress=_instantly_progress,
        )
        result.patched += stats.get("patched", 0)
        result.failed += stats.get("failed", 0)
        result.errors.extend(stats.get("errors") or [])

    # Build result rows in original order
    for lead in selected_leads:
        parsed = _parse_instantly_lead(lead)
        if parsed is None:
            continue
        db_row = db_rows_by_email.get(parsed.email)
        if not db_row:
            existing = email_index.get(parsed.email)
            if existing and existing[0] == category:
                db_row = existing[1]
        if db_row:
            result.rows.append(
                _result_row(
                    email=parsed.email,
                    db_row=db_row,
                    category=category,
                    extra=parsed.source_row,
                )
            )

    return result


def provision_from_csv(
    *,
    category: LeadCategory,
    df: pd.DataFrame,
    email_column: str,
    campaign_id: str | None = None,
    instantly: InstantlyClient | None = None,
    push_to_instantly: bool = False,
    supabase: Client | None = None,
) -> ProvisionResult:
    client = supabase or get_client()
    result = ProvisionResult()
    instantly_leads_batch: list[dict[str, Any]] = []

    for _, series in df.iterrows():
        email = _as_str(series.get(email_column)).lower()
        if not email or "@" not in email:
            result.failed += 1
            continue

        existing = find_by_email(client, email)
        try:
            if existing:
                existing_category, existing_lead = existing
                if existing_category != category:
                    result.failed += 1
                    result.errors.append(
                        f"{email}: already in `{existing_category}`"
                    )
                    continue
                from supabase_repo import refresh_lead_urls

                db_row = refresh_lead_urls(
                    client,
                    category=category,
                    lead=existing_lead,
                    instantly_campaign_id=campaign_id,
                )
                result.updated += 1
            else:
                db_row = provision_lead(
                    client,
                    category=category,
                    email=email,
                    instantly_campaign_id=campaign_id,
                )
                result.created += 1
        except Exception as exc:
            result.failed += 1
            result.errors.append(f"{email}: {exc}")
            continue

        result.rows.append(_result_row(email=email, db_row=db_row, category=category))

        if push_to_instantly and campaign_id and instantly:
            instantly_leads_batch.append(
                {
                    "email": email,
                    "custom_variables": build_instantly_custom_variables(
                        lead_slug(db_row),
                        email,
                        str(db_row.get("statut") or "NOTBOOKED"),
                    ),
                }
            )

    if push_to_instantly and campaign_id and instantly and instantly_leads_batch:
        stats = instantly.push_leads_to_campaign(
            campaign_id=campaign_id,
            leads=instantly_leads_batch,
        )
        result.patched += stats.get("pushed", 0)
        if stats.get("failed", 0):
            result.errors.append(
                f"Instantly push: {stats['failed']} failed, "
                f"{stats.get('skipped_duplicate', 0)} skipped duplicates"
            )

    return result


def rows_to_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    columns = [
        "email",
        "slug",
        "reservation_agence_link",
        "reservation_entreprise_link",
        "confirmation_agence_link",
        "statut",
        "category",
    ]
    if not rows:
        return pd.DataFrame(columns=columns)
    return pd.DataFrame(rows)
