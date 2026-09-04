#!/usr/bin/env python3
"""Audit and fix first_name for Calendly-booked leads in Supabase."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "crm"))

from calendly_client import _first_name, list_all_bookings  # noqa: E402
from instantly_client import get_instantly_client, lead_to_row  # noqa: E402
from supabase_repo import LeadCategory, get_client, normalize_email, update_lead  # noqa: E402

BOOKED_STATUTS = ("MEETING_BOOKED", "CONFIRMED", "BOOKED")
ORG_MARKERS = (
    "agence",
    "freelance",
    "sarl",
    "sas",
    "cabinet",
    "studio",
    "communication",
    "marketing",
    "digital",
    "web",
    "consult",
)
URL_MARKERS = ("http://", "https://", "www.", ".com", ".fr")


@dataclass
class AuditRow:
    category: LeadCategory
    lead_id: str
    email: str
    current_first_name: str | None
    proposed_first_name: str | None
    source: str
    action: Literal["ok", "update", "manual"]
    patch: dict[str, Any] = field(default_factory=dict)
    note: str = ""


def first_name_from_full_name(name: str) -> str | None:
    return _first_name(name)


def _looks_like_org_name(text: str) -> bool:
    lowered = text.strip().lower()
    if not lowered:
        return False
    return any(marker in lowered for marker in ORG_MARKERS)


def is_valid_first_name(
    first_name: str | None,
    *,
    email: str,
    company: str | None = None,
) -> bool:
    value = (first_name or "").strip()
    if not value:
        return False
    if "@" in value:
        return False
    if value.lower() == normalize_email(email):
        return False
    lowered = value.lower()
    if any(marker in lowered for marker in URL_MARKERS):
        return False
    if re.fullmatch(r"\d+", value):
        return False
    if len(value) < 2 or len(value) > 40:
        return False
    company_value = (company or "").strip()
    if company_value and value.lower() == company_value.lower():
        if _looks_like_org_name(company_value):
            return False
    if _looks_like_org_name(value):
        return False
    return True


def _payload_name(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    inner = payload.get("payload")
    if isinstance(inner, dict):
        name = str(inner.get("name") or "").strip()
        if name:
            return name
    name = str(payload.get("name") or "").strip()
    return name or None


def _is_real_calendly_uri(uri: str | None) -> bool:
    return bool(uri and uri.startswith("https://api.calendly.com/"))


def list_booked_leads() -> list[dict[str, Any]]:
    client = get_client()
    rows: list[dict[str, Any]] = []
    for category in ("agence", "entreprise"):
        res = (
            client.table(category)
            .select("*")
            .in_("statut", list(BOOKED_STATUTS))
            .execute()
        )
        for item in res.data or []:
            rows.append({**item, "category": category})
    rows.sort(key=lambda row: (row["category"], str(row.get("email") or "")))
    return rows


def _instantly_first_name(instantly_lead_id: str | None) -> tuple[str | None, str]:
    if not instantly_lead_id:
        return None, ""
    try:
        instantly = get_instantly_client()
        lead = instantly.get_lead(instantly_lead_id)
        row = lead_to_row(lead if isinstance(lead, dict) else {})
        first = str(row.get("first_name") or "").strip() or None
        return first, "instantly"
    except Exception as exc:
        return None, f"instantly_error:{exc}"


def resolve_first_name(
    lead: dict[str, Any],
    *,
    calendly_by_email: dict[str, dict[str, Any]],
) -> tuple[str | None, str]:
    email = normalize_email(str(lead.get("email") or ""))

    payload_name = _payload_name(lead.get("calendly_payload"))
    if payload_name:
        candidate = first_name_from_full_name(payload_name)
        if candidate and is_valid_first_name(
            candidate, email=email, company=lead.get("company")
        ):
            return candidate, "calendly_payload"

    booking = calendly_by_email.get(email)
    if booking:
        candidate = str(booking.get("first_name") or "").strip() or None
        if candidate and is_valid_first_name(
            candidate, email=email, company=lead.get("company")
        ):
            return candidate, "calendly_api"

    instantly_name, instantly_source = _instantly_first_name(
        str(lead.get("instantly_lead_id") or "").strip() or None
    )
    if instantly_name and is_valid_first_name(
        instantly_name, email=email, company=lead.get("company")
    ):
        return instantly_name, instantly_source or "instantly"

    if booking:
        raw_name = str(booking.get("name") or "").strip()
        if raw_name:
            return first_name_from_full_name(raw_name), "calendly_api_invalid"
    if payload_name:
        return first_name_from_full_name(payload_name), "calendly_payload_invalid"

    return None, "none"


def build_calendly_backfill(
    lead: dict[str, Any],
    booking: dict[str, Any] | None,
) -> dict[str, Any]:
    if not booking:
        return {}

    patch: dict[str, Any] = {}
    invitee_uri = str(booking.get("invitee_uri") or "").strip()
    current_uri = str(lead.get("calendly_invitee_uri") or "").strip()

    if invitee_uri and invitee_uri != current_uri:
        patch["calendly_invitee_uri"] = invitee_uri

    payload = lead.get("calendly_payload")
    if not isinstance(payload, dict):
        payload = {}

    if not _payload_name(payload):
        patch["calendly_payload"] = {
            **{k: v for k, v in payload.items() if k != "source"},
            "event": "invitee.created",
            "payload": {
                "uri": invitee_uri,
                "email": booking.get("email"),
                "name": booking.get("name"),
                "scheduled_event": {
                    "uri": booking.get("event_uri"),
                    "start_time": booking.get("start_time"),
                },
                "tracking": {"utm_content": booking.get("utm_content") or ""},
                "questions_and_answers": [
                    {"question": question, "answer": answer}
                    for question, answer in (booking.get("questions") or {}).items()
                ],
            },
        }

    company = str(booking.get("company") or "").strip()
    if company and not str(lead.get("company") or "").strip():
        patch["company"] = company

    return patch


def audit_leads(*, apply: bool) -> list[AuditRow]:
    leads = list_booked_leads()
    calendly_by_email = {
        normalize_email(str(row.get("email") or "")): row
        for row in list_all_bookings(days_ahead=60)
    }

    results: list[AuditRow] = []
    for lead in leads:
        category = lead["category"]
        email = normalize_email(str(lead.get("email") or ""))
        current = str(lead.get("first_name") or "").strip() or None
        booking = calendly_by_email.get(email)

        if is_valid_first_name(current, email=email, company=lead.get("company")):
            backfill = build_calendly_backfill(lead, booking)
            action: Literal["ok", "update", "manual"] = "update" if backfill else "ok"
            results.append(
                AuditRow(
                    category=category,
                    lead_id=str(lead["id"]),
                    email=email,
                    current_first_name=current,
                    proposed_first_name=current,
                    source="current",
                    action=action,
                    patch=backfill,
                    note="valid" if action == "ok" else "backfill_calendly_metadata",
                )
            )
            continue

        proposed, source = resolve_first_name(lead, calendly_by_email=calendly_by_email)
        patch = build_calendly_backfill(lead, booking)

        if proposed and is_valid_first_name(
            proposed, email=email, company=lead.get("company")
        ):
            patch["first_name"] = proposed
            results.append(
                AuditRow(
                    category=category,
                    lead_id=str(lead["id"]),
                    email=email,
                    current_first_name=current,
                    proposed_first_name=proposed,
                    source=source,
                    action="update",
                    patch=patch,
                )
            )
            continue

        note = "manual_required"
        if source.endswith("_invalid") or source == "none":
            note = "no_reliable_source"
        results.append(
            AuditRow(
                category=category,
                lead_id=str(lead["id"]),
                email=email,
                current_first_name=current,
                proposed_first_name=proposed,
                source=source,
                action="manual",
                patch=patch if patch else {},
                note=note,
            )
        )

    if apply:
        client = get_client()
        for row in results:
            if not row.patch:
                continue
            patch = dict(row.patch)
            if row.action == "manual":
                patch.pop("first_name", None)
                if not patch:
                    continue
            update_lead(
                client,
                category=row.category,
                lead_id=row.lead_id,
                patch=patch,
            )

    return results


def _print_report(rows: list[AuditRow], *, apply: bool) -> None:
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"=== Audit booked lead first_name ({mode}) ===")
    print(
        f"{'email':<40} {'category':<12} {'current':<18} {'proposed':<18} "
        f"{'source':<24} {'action':<8} note"
    )
    print("-" * 150)
    for row in rows:
        print(
            f"{row.email:<40} {row.category:<12} "
            f"{(row.current_first_name or ''):<18} "
            f"{(row.proposed_first_name or ''):<18} "
            f"{row.source:<24} {row.action:<8} {row.note}"
        )

    ok = sum(1 for row in rows if row.action == "ok")
    updates = sum(1 for row in rows if row.action == "update")
    manual = sum(1 for row in rows if row.action == "manual")
    metadata = sum(
        1
        for row in rows
        if row.action == "manual" and row.patch and "first_name" not in row.patch
    )
    print()
    print(
        f"Total: {len(rows)} | ok: {ok} | update: {updates} | manual: {manual} "
        f"| metadata_backfill: {metadata}"
    )
    if manual:
        print("\nManual review required:")
        for row in rows:
            if row.action == "manual":
                calendly_name = ""
                print(f"  - {row.email}: current={row.current_first_name!r} ({row.note})")


def main() -> None:
    apply = "--apply" in sys.argv
    rows = audit_leads(apply=apply)
    _print_report(rows, apply=apply)
    if any(row.action == "manual" for row in rows):
        sys.exit(2)


if __name__ == "__main__":
    main()
