"""Instantly lead lookup and Calendly↔Instantly sync helpers."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from instantly_client import get_instantly_client, lead_to_row
from outreach_config import Niche, NicheCampaign, load_niche_campaigns

URL_MARKERS = ("http://", "https://", "www.", ".com", ".fr", ".net", ".io", ".org")


@dataclass(frozen=True)
class InstantlyMatch:
    instantly_lead_id: str
    email: str
    website: str | None
    company_name: str | None
    campaign_id: str
    niche: Niche


def normalize_website(raw: str | None) -> str | None:
    value = (raw or "").strip()
    if not value:
        return None
    if value.lower() in ("nan", "none", "null", "-", "n/a"):
        return None
    host = value.split("/")[0].split("://")[-1]
    if "@" in host:
        return None
    if not re.match(r"^https?://", value, flags=re.IGNORECASE):
        value = f"https://{value.lstrip('/')}"
    return value


def looks_like_url(text: str) -> bool:
    lowered = text.strip().lower()
    if not lowered:
        return False
    return any(marker in lowered for marker in URL_MARKERS)


def should_patch_company(
    existing_company: str | None,
    website: str,
    *,
    force: bool = False,
) -> tuple[bool, str]:
    current = (existing_company or "").strip()
    target = website.strip()
    if not target:
        return False, "empty_website"
    if force:
        return True, "force"
    if not current:
        return True, "empty_company"
    if current.lower() == target.lower():
        return False, "already_set"
    if looks_like_url(current):
        return True, "replace_url"
    return False, "company_conflict"


def is_delivery_booking(utm_content: str | None) -> bool:
    return str(utm_content or "").strip().lower().startswith("match:")


def booking_match_emails(booking: dict[str, Any]) -> list[str]:
    emails: list[str] = []
    for key in ("email", "lead_email"):
        value = str(booking.get(key) or "").strip().lower()
        if value and "@" in value and value not in emails:
            emails.append(value)
    return emails


def _niche_for_campaign(
    campaign_id: str | None,
    campaigns: list[NicheCampaign],
) -> Niche:
    normalized = str(campaign_id or "").strip()
    for entry in campaigns:
        if entry.campaign_id == normalized:
            return entry.niche
    return "agence"


def find_instantly_lead_by_email(
    email: str,
    campaigns: list[NicheCampaign] | None = None,
) -> InstantlyMatch | None:
    normalized = email.strip().lower()
    if not normalized or "@" not in normalized:
        return None

    configured = campaigns or load_niche_campaigns()
    instantly = get_instantly_client()

    workspace_lead = instantly.find_lead_by_email(normalized)
    if workspace_lead:
        lead_campaign = str(workspace_lead.get("campaign") or "").strip()
        entry = next(
            (item for item in configured if item.campaign_id == lead_campaign),
            None,
        )
        if entry:
            match = _match_from_lead(workspace_lead, entry)
            if match:
                return match
        return InstantlyMatch(
            instantly_lead_id=str(
                workspace_lead.get("id")
                or lead_to_row(workspace_lead).get("instantly_lead_id")
                or ""
            ).strip(),
            email=normalized,
            website=normalize_website(str(lead_to_row(workspace_lead).get("website") or "")),
            company_name=str(lead_to_row(workspace_lead).get("company_name") or "").strip()
            or None,
            campaign_id=lead_campaign,
            niche=_niche_for_campaign(lead_campaign, configured),
        )

    for entry in configured:
        try:
            lead = instantly.find_lead_by_email_in_campaign(
                entry.campaign_id,
                normalized,
                search_only=True,
            )
        except RuntimeError as exc:
            message = str(exc).lower()
            if "campaign not found" in message or "404" in message:
                continue
            raise
        if not lead:
            continue
        match = _match_from_lead(lead, entry)
        if match:
            return match
    return None


def _match_from_lead(lead: dict[str, Any], entry: NicheCampaign) -> InstantlyMatch | None:
    row = lead_to_row(lead)
    email = str(row.get("email") or "").strip().lower()
    instantly_lead_id = str(row.get("instantly_lead_id") or lead.get("id") or "").strip()
    if not email or not instantly_lead_id:
        return None
    return InstantlyMatch(
        instantly_lead_id=instantly_lead_id,
        email=email,
        website=normalize_website(str(row.get("website") or "")),
        company_name=str(row.get("company_name") or "").strip() or None,
        campaign_id=entry.campaign_id,
        niche=entry.niche,
    )


def build_instantly_email_index(
    campaigns: list[NicheCampaign] | None = None,
) -> dict[str, InstantlyMatch]:
    """Load leads once per campaign; first niche in order wins on duplicate emails."""
    instantly = get_instantly_client()
    index: dict[str, InstantlyMatch] = {}
    for entry in campaigns or load_niche_campaigns():
        try:
            leads = instantly.fetch_leads_from_campaign(entry.campaign_id, max_leads=None)
        except RuntimeError as exc:
            message = str(exc).lower()
            if "campaign not found" in message or "404" in message:
                continue
            raise
        for lead in leads:
            match = _match_from_lead(lead, entry)
            if match and match.email not in index:
                index[match.email] = match
    return index


def find_instantly_lead_for_booking(
    booking: dict[str, Any],
    campaigns: list[NicheCampaign] | None = None,
    email_index: dict[str, InstantlyMatch] | None = None,
) -> InstantlyMatch | None:
    for email in booking_match_emails(booking):
        if email_index is not None:
            match = email_index.get(email)
            if match:
                return match
            match = find_instantly_lead_by_email(email, campaigns=campaigns)
            if match:
                return match
            continue
        match = find_instantly_lead_by_email(email, campaigns=campaigns)
        if match:
            return match
    return None
