"""Business logic for link tracking provisioning (testable without Streamlit UI)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd
from supabase import Client

from config import tracking_base_url_for
from instantly_client import InstantlyClient, lead_to_row
from slug import build_tracking_url
from supabase_repo import LeadCategory, find_by_email, get_client, provision_lead

EMAIL_ALIASES = ("email", "e-mail", "mail", "courriel", "adresse email")


@dataclass
class ProvisionResult:
    created: int = 0
    patched: int = 0
    skipped: int = 0
    failed: int = 0
    rows: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def detect_email_column(df: pd.DataFrame) -> str | None:
    lower_map = {col.lower().strip(): col for col in df.columns}
    for alias in EMAIL_ALIASES:
        if alias in lower_map:
            return lower_map[alias]
    return None


def provision_from_instantly_leads(
    *,
    category: LeadCategory,
    campaign_id: str,
    selected_leads: list[dict[str, Any]],
    instantly: InstantlyClient,
    supabase: Client | None = None,
    patch_instantly: bool = True,
) -> ProvisionResult:
    client = supabase or get_client()
    base_url = tracking_base_url_for(category)
    result = ProvisionResult()

    for lead in selected_leads:
        row = lead_to_row(lead)
        email = row.get("email") or ""
        instantly_lead_id = row.get("instantly_lead_id") or ""

        if not email or "@" not in email:
            result.failed += 1
            result.errors.append(f"Invalid email for lead {instantly_lead_id or '?'}")
            continue

        if find_by_email(client, email):
            result.skipped += 1
            result.errors.append(f"Already in Supabase: {email}")
            continue

        try:
            db_row = provision_lead(
                client,
                category=category,
                email=email,
                instantly_lead_id=instantly_lead_id or None,
                instantly_campaign_id=campaign_id,
                first_name=row.get("first_name"),
                company=row.get("company_name"),
            )
        except Exception as exc:
            result.failed += 1
            result.errors.append(f"{email}: {exc}")
            continue

        slug = db_row["link"]
        tracking_url = build_tracking_url(base_url, slug)

        if patch_instantly and instantly_lead_id:
            try:
                instantly.patch_lead_custom_variables(
                    instantly_lead_id,
                    {"link": tracking_url, "statut": "NOTBOOKED"},
                )
                result.patched += 1
            except Exception as exc:
                result.errors.append(f"Instantly PATCH failed for {email}: {exc}")

        result.created += 1
        result.rows.append(
            {
                **row,
                "link": slug,
                "tracking_url": tracking_url,
                "statut": "NOTBOOKED",
                "category": category,
            }
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
    base_url = tracking_base_url_for(category)
    result = ProvisionResult()
    instantly_leads_batch: list[dict[str, Any]] = []

    for _, series in df.iterrows():
        raw_email = series.get(email_column)
        email = str(raw_email or "").strip().lower()
        if not email or "@" not in email:
            result.failed += 1
            continue

        if find_by_email(client, email):
            result.skipped += 1
            continue

        try:
            db_row = provision_lead(
                client,
                category=category,
                email=email,
                instantly_campaign_id=campaign_id,
            )
        except Exception as exc:
            result.failed += 1
            result.errors.append(f"{email}: {exc}")
            continue

        slug = db_row["link"]
        tracking_url = build_tracking_url(base_url, slug)
        result.created += 1

        enriched = {
            "email": email,
            "link": slug,
            "tracking_url": tracking_url,
            "statut": "NOTBOOKED",
            "category": category,
        }
        result.rows.append(enriched)

        if push_to_instantly and campaign_id and instantly:
            instantly_leads_batch.append(
                {
                    "email": email,
                    "custom_variables": {
                        "link": tracking_url,
                        "statut": "NOTBOOKED",
                    },
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
    if not rows:
        return pd.DataFrame(
            columns=["email", "link", "tracking_url", "statut", "category"]
        )
    return pd.DataFrame(rows)
