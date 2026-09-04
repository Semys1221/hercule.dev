"""Dashboard send queues — CRM pipeline fetch, Unibox reply sends."""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Literal

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from shared.instantly_client import (
    FILTER_LEAD_INTERESTED,
    InstantlyClient,
    get_api_key,
    lead_custom_var,
)

from supabase_repo import (
    get_last_send_at,
    has_sent_event,
    list_pipeline_for_campaign,
    list_sent_flows,
    record_event,
    upsert_pipeline_step,
)

PipelineStep = Literal["step_0", "step_1", "step_2", "step_3", "replies_to_handle"]
Flow = Literal["interested_email1", "interested_email2", "interested_email3"]

INTERESTED_STATUS = 1
NO_SHOW_STATUS = -4
NOT_INTERESTED_STATUS = -1
EMAIL_SEND_DELAY_S = 3.2

PIPELINE_STEPS: list[PipelineStep] = [
    "step_0",
    "step_1",
    "step_2",
    "step_3",
    "replies_to_handle",
]

REPLY_MOVE_STEPS: set[PipelineStep] = {"step_1", "step_2", "step_3"}

STEP_AFTER_FLOW: dict[Flow, PipelineStep] = {
    "interested_email1": "step_1",
    "interested_email2": "step_2",
    "interested_email3": "step_3",
}

DEFAULT_FLOW_BY_STEP: dict[PipelineStep, Flow | None] = {
    "step_0": "interested_email1",
    "step_1": "interested_email2",
    "step_2": "interested_email3",
    "step_3": None,
    "replies_to_handle": None,
}

SENDABLE_FLOWS: list[Flow] = [
    "interested_email1",
    "interested_email2",
    "interested_email3",
]

FINAL_FLOWS: set[Flow] = {"interested_email3"}

EMAIL_SIGNATURE = "Béatrice Meyer"

PREVIEW_LEAD: dict[str, Any] = {
    "first_name": "Jean",
    "last_name": "Dupont",
    "payload": {
        "reservation_agence_link": "https://www.hercule.dev/reservation.html/preview",
    },
}


def idempotency_key(flow: str, campaign_id: str, lead_email: str) -> str:
    return f"{flow}:{campaign_id}:{lead_email.strip().lower()}"


def _pick_latest_email(items: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not items:
        return None

    def ts(item: dict[str, Any]) -> str:
        return str(item.get("timestamp_email") or item.get("timestamp_created") or "")

    return sorted(items, key=ts, reverse=True)[0]


def _pick_earliest_email(items: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not items:
        return None

    def ts(item: dict[str, Any]) -> str:
        return str(item.get("timestamp_email") or item.get("timestamp_created") or "")

    return sorted(items, key=ts)[0]


def _resolve_initial_eaccount(
    client: InstantlyClient,
    *,
    lead_email: str,
    campaign_id: str,
    fallback_eaccount: str | None = None,
) -> str | None:
    sent_items = client.list_emails(
        search=lead_email,
        campaign_id=campaign_id,
        email_type="sent",
        limit=50,
    )
    earliest = _pick_earliest_email(sent_items)
    if earliest and earliest.get("eaccount"):
        return str(earliest["eaccount"])
    if fallback_eaccount and fallback_eaccount.strip():
        return fallback_eaccount.strip()
    return None


def _resolve_reply_anchor(
    client: InstantlyClient,
    *,
    lead_email: str,
    campaign_id: str,
) -> dict[str, str] | None:
    for attempt in range(3):
        for email_type in ("received", "sent"):
            items = client.list_emails(
                search=lead_email,
                campaign_id=campaign_id,
                email_type=email_type,
                latest_of_thread=True,
                limit=10,
            )
            pick = _pick_latest_email(items)
            if pick and pick.get("id"):
                return {
                    "reply_to_uuid": str(pick["id"]),
                    "subject": str(pick.get("subject") or ""),
                }
        if attempt < 2:
            time.sleep(3)

    items = client.list_emails(search=lead_email, campaign_id=campaign_id, limit=5)
    pick = _pick_latest_email(items)
    if pick and pick.get("id"):
        return {
            "reply_to_uuid": str(pick["id"]),
            "subject": str(pick.get("subject") or ""),
        }
    return None


def resolve_thread(
    client: InstantlyClient,
    *,
    lead_email: str,
    campaign_id: str,
    fallback_eaccount: str | None = None,
) -> dict[str, str] | None:
    reply = _resolve_reply_anchor(
        client,
        lead_email=lead_email,
        campaign_id=campaign_id,
    )
    if not reply:
        return None

    eaccount = _resolve_initial_eaccount(
        client,
        lead_email=lead_email,
        campaign_id=campaign_id,
        fallback_eaccount=fallback_eaccount,
    )
    if not eaccount:
        return None

    return {
        "reply_to_uuid": reply["reply_to_uuid"],
        "eaccount": eaccount,
        "subject": reply["subject"],
    }


def lead_has_replied_since(
    client: InstantlyClient,
    lead_email: str,
    since_iso: str,
) -> bool:
    received = client.list_emails(
        search=lead_email,
        email_type="received",
        limit=20,
    )
    for item in received:
        ts = item.get("timestamp_email") or item.get("timestamp_created")
        if ts and str(ts) > since_iso:
            return True
    return False


def _render_template(body_html: str, vars_map: dict[str, str]) -> str:
    out_body = body_html
    for key, value in vars_map.items():
        out_body = out_body.replace(f"{{{{{key}}}}}", value)
    return out_body.replace("{{accountSignature}}", EMAIL_SIGNATURE)


def _template_vars(lead: dict[str, Any]) -> dict[str, str]:
    payload = lead.get("payload") if isinstance(lead.get("payload"), dict) else {}
    reservation_link = lead_custom_var(lead, "reservation_agence_link") or ""
    first = str(
        lead.get("first_name") or payload.get("firstName") or payload.get("first_name") or ""
    )
    company = str(
        lead.get("company_name") or payload.get("companyName") or payload.get("company_name") or ""
    )
    return {
        "first_name": first,
        "last_name": str(lead.get("last_name") or payload.get("lastName") or ""),
        "company_name": company,
        "reservation_agence_link": reservation_link,
    }


def _load_template(template_key: str) -> dict[str, str]:
    from supabase_repo import get_client

    resp = (
        get_client()
        .table("instantly_bypass_templates")
        .select("subject, body_html")
        .eq("template_key", template_key)
        .maybe_single()
        .execute()
    )
    row = resp.data if resp else None
    if not row:
        raise RuntimeError(f"Template not found: {template_key}")
    return {"subject": row["subject"], "body_html": row["body_html"]}


def _interest_label(lead: dict[str, Any]) -> str:
    status = lead.get("lt_interest_status")
    if status == INTERESTED_STATUS:
        return "Intéressé"
    if status == NO_SHOW_STATUS:
        return "No Show"
    if status == NOT_INTERESTED_STATUS:
        return "Plus intéressé"
    if status is None:
        return "—"
    return str(status)


def _missing_reservation_link(lead: dict[str, Any]) -> bool:
    return not bool(lead_custom_var(lead, "reservation_agence_link"))


def _coerce_step(value: str | None) -> PipelineStep:
    if value in PIPELINE_STEPS:
        return value  # type: ignore[return-value]
    return "step_0"


def move_pipeline_leads(campaign_id: str, emails: list[str], step: PipelineStep) -> None:
    for email in emails:
        upsert_pipeline_step(campaign_id, email, step)


@dataclass
class QueueLead:
    lead_id: str
    email: str
    first_name: str
    interest_label: str
    last_sent_at: str | None
    replied_since_last_send: bool
    missing_reservation_link: bool
    sent_flows: list[str]
    step: PipelineStep
    envoyer: bool
    raw: dict[str, Any] = field(default_factory=dict, repr=False)


@dataclass
class BulkSendResult:
    sent: int = 0
    skipped: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


def render_template_html(template_key: str, lead: dict[str, Any] | None = None) -> str:
    template = _load_template(template_key)
    vars_map = _template_vars(lead or PREVIEW_LEAD)
    return _render_template(template["body_html"], vars_map)


def fetch_pipeline_leads(
    *,
    campaign_id: str,
    max_leads: int = 500,
    client: InstantlyClient | None = None,
    on_progress: Callable[[int, int, str], None] | None = None,
) -> list[QueueLead]:
    api_key = get_api_key()
    if not api_key:
        raise ValueError("INSTANTLY_API_KEY is not set")
    instantly = client or InstantlyClient(api_key)

    if on_progress:
        on_progress(0, 1, "Chargement des leads Instantly…")

    raw_leads = instantly.list_leads_by_interest_filter(
        campaign_id=campaign_id,
        interest_filter=FILTER_LEAD_INTERESTED,
        max_leads=max_leads,
    )
    instantly_by_email: dict[str, dict[str, Any]] = {}
    for lead in raw_leads:
        email = str(lead.get("email") or "").strip().lower()
        if email:
            instantly_by_email[email] = lead

    pipeline_rows = list_pipeline_for_campaign(campaign_id)
    step_by_email: dict[str, PipelineStep] = {
        str(row["lead_email"]).strip().lower(): _coerce_step(str(row.get("step") or ""))
        for row in pipeline_rows
        if row.get("lead_email")
    }

    for email in instantly_by_email:
        if email not in step_by_email:
            upsert_pipeline_step(campaign_id, email, "step_0")
            step_by_email[email] = "step_0"

    all_emails = sorted(set(instantly_by_email) | set(step_by_email))
    total = len(all_emails)
    rows: list[QueueLead] = []

    for index, lead_email in enumerate(all_emails, start=1):
        if on_progress:
            on_progress(
                index,
                total,
                f"{index}/{total} — {lead_email} — sync CRM / Unibox…",
            )

        lead = instantly_by_email.get(lead_email) or {
            "id": "",
            "email": lead_email,
            "first_name": "",
            "payload": {},
        }
        step = step_by_email.get(lead_email, "step_0")
        last_sent_at = get_last_send_at(campaign_id, lead_email)
        replied_since_last_send = False
        if last_sent_at and step in REPLY_MOVE_STEPS:
            replied_since_last_send = lead_has_replied_since(instantly, lead_email, last_sent_at)
            time.sleep(0.15)
            if replied_since_last_send:
                upsert_pipeline_step(campaign_id, lead_email, "replies_to_handle")
                step = "replies_to_handle"

        sent_flows = list_sent_flows(campaign_id, lead_email)
        rows.append(
            QueueLead(
                lead_id=str(lead.get("id") or ""),
                email=lead_email,
                first_name=str(lead.get("first_name") or ""),
                interest_label=_interest_label(lead),
                last_sent_at=last_sent_at,
                replied_since_last_send=replied_since_last_send,
                missing_reservation_link=_missing_reservation_link(lead),
                sent_flows=sent_flows,
                step=step,
                envoyer=not replied_since_last_send,
                raw=lead,
            )
        )

    if on_progress:
        on_progress(total, total, f"{total} lead(s) chargé(s).")

    return rows


def leads_for_step(queue: list[QueueLead], step: PipelineStep) -> list[QueueLead]:
    return [row for row in queue if row.step == step]


def dispatch_one(
    client: InstantlyClient,
    *,
    flow: Flow,
    campaign_id: str,
    lead: dict[str, Any],
    dry_run: bool = False,
) -> dict[str, Any]:
    lead_email = str(lead.get("email") or "").strip().lower()
    lead_id = str(lead.get("id") or "")
    if not lead_email:
        return {"ok": False, "error": "missing_lead_email"}

    idem = idempotency_key(flow, campaign_id, lead_email)
    if has_sent_event(idem):
        return {"ok": True, "skipped": "already_sent"}

    if _missing_reservation_link(lead):
        record_event(
            {
                "idempotency_key": idem,
                "flow": flow,
                "campaign_id": campaign_id,
                "lead_email": lead_email,
                "lead_id": lead_id or None,
                "status": "failed",
                "error_message": "Missing reservation_agence_link on lead",
            }
        )
        return {"ok": False, "error": "missing_reservation_link", "lead_email": lead_email}

    if dry_run:
        return {"ok": True, "dry_run": True, "lead_email": lead_email}

    started = datetime.now(timezone.utc)

    try:
        template = _load_template(flow)

        thread = resolve_thread(
            client,
            lead_email=lead_email,
            campaign_id=campaign_id,
            fallback_eaccount=lead_custom_var(lead, "email_account"),
        )
        if not thread:
            record_event(
                {
                    "idempotency_key": idem,
                    "flow": flow,
                    "campaign_id": campaign_id,
                    "lead_email": lead_email,
                    "lead_id": lead_id or None,
                    "status": "failed",
                    "error_message": "Could not resolve Unibox thread",
                }
            )
            return {"ok": False, "error": "thread_not_found", "lead_email": lead_email}

        html = _render_template(template["body_html"], _template_vars(lead))
        subject = thread["subject"] or template["subject"] or "your message"

        client.reply_to_email(
            eaccount=thread["eaccount"],
            reply_to_uuid=thread["reply_to_uuid"],
            subject=subject,
            html=html,
        )

        dispatched = datetime.now(timezone.utc)
        latency_ms = int((dispatched - started).total_seconds() * 1000)

        if flow in FINAL_FLOWS:
            client.update_interest_status(
                lead_email=lead_email,
                interest_value=NOT_INTERESTED_STATUS,
                campaign_id=campaign_id,
            )

        next_step = STEP_AFTER_FLOW.get(flow)
        if next_step:
            upsert_pipeline_step(campaign_id, lead_email, next_step)

        record_event(
            {
                "idempotency_key": idem,
                "flow": flow,
                "campaign_id": campaign_id,
                "lead_email": lead_email,
                "lead_id": lead_id or None,
                "dispatched_at": dispatched.isoformat(),
                "latency_ms": latency_ms,
                "status": "sent",
                "reply_to_uuid": thread["reply_to_uuid"],
            }
        )
        return {"ok": True, "lead_email": lead_email, "latency_ms": latency_ms}
    except Exception as exc:
        record_event(
            {
                "idempotency_key": idem,
                "flow": flow,
                "campaign_id": campaign_id,
                "lead_email": lead_email,
                "lead_id": lead_id or None,
                "status": "failed",
                "error_message": str(exc),
            }
        )
        return {"ok": False, "error": str(exc), "lead_email": lead_email}


def dispatch_bulk(
    *,
    campaign_id: str,
    flow: Flow,
    leads: list[dict[str, Any]],
    dry_run: bool = False,
    on_progress: Callable[[str], None] | None = None,
) -> BulkSendResult:
    api_key = get_api_key()
    if not api_key:
        raise ValueError("INSTANTLY_API_KEY is not set")

    client = InstantlyClient(api_key)
    result = BulkSendResult()

    for lead in leads:
        lead_email = str(lead.get("email") or "")
        if on_progress:
            on_progress(lead_email)

        dispatch_result = dispatch_one(
            client,
            flow=flow,
            campaign_id=campaign_id,
            lead=lead,
            dry_run=dry_run,
        )

        if dispatch_result.get("skipped"):
            result.skipped += 1
        elif dispatch_result.get("ok"):
            result.sent += 1
        else:
            result.failed += 1
            result.errors.append(f"{lead_email}: {dispatch_result.get('error', 'unknown')}")

        if not dry_run:
            time.sleep(EMAIL_SEND_DELAY_S)

    return result
