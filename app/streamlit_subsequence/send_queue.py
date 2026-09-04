"""Dashboard send queues for Instantly subsequence bypass."""

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

from shared.instantly_client import InstantlyClient, get_api_key

from config import waiting_for_reply_interest_value
from supabase_repo import get_event_sent_at, has_sent_event, record_event

Sequence = Literal["positive", "no_reply"]
Step = Literal[
    "interested_email1",
    "interested_email2",
    "interested_email3",
    "no_reply_email1",
    "no_reply_email2",
]

INTERESTED_STATUS = 1
EMAIL_SEND_DELAY_S = 3.2


def idempotency_key(flow: str, campaign_id: str, lead_email: str) -> str:
    return f"{flow}:{campaign_id}:{lead_email.strip().lower()}"


def _pick_latest_email(items: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not items:
        return None

    def ts(item: dict[str, Any]) -> str:
        return str(item.get("timestamp_email") or item.get("timestamp_created") or "")

    return sorted(items, key=ts, reverse=True)[0]


def resolve_thread(
    client: InstantlyClient,
    *,
    lead_email: str,
    campaign_id: str,
    fallback_eaccount: str | None = None,
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
            if pick and pick.get("id") and pick.get("eaccount"):
                return {
                    "reply_to_uuid": str(pick["id"]),
                    "eaccount": str(pick["eaccount"]),
                    "subject": str(pick.get("subject") or ""),
                }
        if attempt < 2:
            time.sleep(3)

    if fallback_eaccount:
        items = client.list_emails(search=lead_email, campaign_id=campaign_id, limit=5)
        pick = _pick_latest_email(items)
        if pick and pick.get("id"):
            return {
                "reply_to_uuid": str(pick["id"]),
                "eaccount": str(pick.get("eaccount") or fallback_eaccount),
                "subject": str(pick.get("subject") or ""),
            }
    return None


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


def _subseq_email1_not_sent(lead: dict[str, Any]) -> bool:
    summary = lead.get("status_summary_subseq")
    if not isinstance(summary, dict):
        return True
    executed = summary.get("timestampExecuted") or summary.get("timestamp_executed")
    return not executed


def _render_template(subject: str, body_html: str, vars_map: dict[str, str]) -> tuple[str, str]:
    out_subject = subject
    out_body = body_html
    for key, value in vars_map.items():
        out_subject = out_subject.replace(f"{{{{{key}}}}}", value)
        out_body = out_body.replace(f"{{{{{key}}}}}", value)
    if not out_subject.lower().startswith("re:"):
        out_subject = f"Re: {out_subject.removeprefix('Re: ').removeprefix('re: ')}"
    return out_subject, out_body


def _template_vars(lead: dict[str, Any], subject: str = "") -> dict[str, str]:
    payload = lead.get("payload") if isinstance(lead.get("payload"), dict) else {}
    first = str(
        lead.get("first_name") or payload.get("firstName") or payload.get("first_name") or "there"
    )
    company = str(
        lead.get("company_name") or payload.get("companyName") or payload.get("company_name") or ""
    )
    return {
        "first_name": first,
        "last_name": str(lead.get("last_name") or payload.get("lastName") or ""),
        "company_name": company,
        "subject": subject or "your message",
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
    row = resp.data
    if not row:
        raise RuntimeError(f"Template not found: {template_key}")
    return {"subject": row["subject"], "body_html": row["body_html"]}


def is_positive_interested(lead: dict[str, Any], config: dict[str, Any]) -> bool:
    status = lead.get("lt_interest_status")
    if status == INTERESTED_STATUS:
        return True
    waiting = config.get("waiting_for_reply_interest_value")
    if waiting is not None and status == waiting:
        return True
    env_waiting = waiting_for_reply_interest_value()
    if env_waiting is not None and status == env_waiting:
        return True
    return False


def _previous_flow(step: Step) -> Step | None:
    return {
        "interested_email2": "interested_email1",
        "interested_email3": "interested_email2",
        "no_reply_email2": "no_reply_email1",
    }.get(step)  # type: ignore[arg-type]


def _default_checked(step: Step, replied_since_last: bool) -> bool:
    if step in ("interested_email2", "interested_email3", "no_reply_email2"):
        return not replied_since_last
    return True


@dataclass
class QueueLead:
    lead_id: str
    email: str
    first_name: str
    interest_label: str
    last_sent_at: str | None
    replied_since_last: bool
    envoyer: bool
    subsequence_id: str | None = None
    raw: dict[str, Any] = field(default_factory=dict, repr=False)


@dataclass
class BulkSendResult:
    sent: int = 0
    skipped: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


def _interest_label(lead: dict[str, Any]) -> str:
    status = lead.get("lt_interest_status")
    if status == INTERESTED_STATUS:
        return "Intéressé"
    if status is None:
        return "—"
    return str(status)


def _is_eligible(
    *,
    step: Step,
    sequence: Sequence,
    lead: dict[str, Any],
    campaign_id: str,
    config: dict[str, Any],
) -> bool:
    lead_email = str(lead.get("email") or "").strip().lower()
    if not lead_email:
        return False

    if has_sent_event(idempotency_key(step, campaign_id, lead_email)):
        return False

    interested_sub = str(config.get("interested_subsequence_id") or "")
    no_reply_sub = str(config.get("no_reply_subsequence_id") or "")
    subseq = str(lead.get("subsequence_id") or "")

    if sequence == "positive":
        if not is_positive_interested(lead, config):
            return False

        if step == "interested_email1":
            return is_positive_interested(lead, config)

        prev = _previous_flow(step)
        if not prev:
            return False
        prev_sent = get_event_sent_at(campaign_id, lead_email, prev)
        return bool(prev_sent)

    # no_reply
    if lead.get("lt_interest_status") == INTERESTED_STATUS:
        return False

    if step == "no_reply_email1":
        return bool(no_reply_sub and subseq == no_reply_sub and _subseq_email1_not_sent(lead))

    prev = _previous_flow(step)
    if not prev:
        return False
    return bool(get_event_sent_at(campaign_id, lead_email, prev))


def fetch_queue(
    *,
    campaign_id: str,
    step: Step,
    sequence: Sequence,
    config: dict[str, Any],
    max_leads: int = 500,
    client: InstantlyClient | None = None,
) -> list[QueueLead]:
    api_key = get_api_key()
    if not api_key:
        raise ValueError("INSTANTLY_API_KEY is not set")
    instantly = client or InstantlyClient(api_key)

    rows: list[QueueLead] = []
    starting_after: str | None = None

    while len(rows) < max_leads:
        body: dict[str, Any] = {"campaign": campaign_id, "limit": 100}
        if starting_after:
            body["starting_after"] = starting_after
        page = instantly._fetch("/leads/list", method="POST", body=body)
        items = page.get("items") or [] if isinstance(page, dict) else []
        if not items:
            break

        for lead in items:
            if not _is_eligible(
                step=step,
                sequence=sequence,
                lead=lead,
                campaign_id=campaign_id,
                config=config,
            ):
                continue

            lead_email = str(lead.get("email") or "").strip().lower()
            prev = _previous_flow(step)
            last_sent_at: str | None = None
            replied_since_last = False

            if prev:
                last_sent_at = get_event_sent_at(campaign_id, lead_email, prev)
                if last_sent_at:
                    replied_since_last = lead_has_replied_since(instantly, lead_email, last_sent_at)
                    time.sleep(0.15)

            rows.append(
                QueueLead(
                    lead_id=str(lead.get("id") or ""),
                    email=lead_email,
                    first_name=str(lead.get("first_name") or ""),
                    interest_label=_interest_label(lead),
                    last_sent_at=last_sent_at,
                    replied_since_last=replied_since_last,
                    envoyer=_default_checked(step, replied_since_last),
                    subsequence_id=str(lead.get("subsequence_id") or "") or None,
                    raw=lead,
                )
            )
            if len(rows) >= max_leads:
                break

        next_cursor = page.get("next_starting_after") if isinstance(page, dict) else None
        if not next_cursor and items:
            next_cursor = items[-1].get("id")
        if not next_cursor or len(items) < 100:
            break
        starting_after = str(next_cursor)

    return rows


def dispatch_one(
    client: InstantlyClient,
    *,
    flow: Step,
    template_key: Step,
    campaign_id: str,
    lead: dict[str, Any],
    update_waiting_status: bool = False,
    dry_run: bool = False,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    lead_email = str(lead.get("email") or "").strip().lower()
    lead_id = str(lead.get("id") or "")
    if not lead_email:
        return {"ok": False, "error": "missing_lead_email"}

    idem = idempotency_key(flow, campaign_id, lead_email)
    if has_sent_event(idem):
        return {"ok": True, "skipped": "already_sent"}

    if dry_run:
        return {"ok": True, "dry_run": True, "lead_email": lead_email}

    started = datetime.now(timezone.utc)

    try:
        template = _load_template(template_key)

        if lead_id and lead.get("subsequence_id") and flow in ("interested_email1", "no_reply_email1"):
            client.remove_lead_from_subsequence(lead_id)

        thread = resolve_thread(client, lead_email=lead_email, campaign_id=campaign_id)
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

        subject, html = _render_template(
            template["subject"],
            template["body_html"],
            _template_vars(lead, thread.get("subject", "")),
        )

        client.reply_to_email(
            eaccount=thread["eaccount"],
            reply_to_uuid=thread["reply_to_uuid"],
            subject=subject,
            html=html,
        )

        dispatched = datetime.now(timezone.utc)
        latency_ms = int((dispatched - started).total_seconds() * 1000)

        if update_waiting_status:
            interest = None
            if config and config.get("waiting_for_reply_interest_value") is not None:
                interest = int(config["waiting_for_reply_interest_value"])
            else:
                interest = waiting_for_reply_interest_value()
            if interest is not None:
                client.update_interest_status(
                    lead_email=lead_email,
                    interest_value=interest,
                    campaign_id=campaign_id,
                    disable_auto_interest=True,
                )

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
    step: Step,
    leads: list[dict[str, Any]],
    dry_run: bool = False,
    config: dict[str, Any] | None = None,
    on_progress: Callable[[str], None] | None = None,
) -> BulkSendResult:
    api_key = get_api_key()
    if not api_key:
        raise ValueError("INSTANTLY_API_KEY is not set")

    client = InstantlyClient(api_key)
    result = BulkSendResult()
    update_waiting = step == "interested_email1"

    for lead in leads:
        lead_email = str(lead.get("email") or "")
        if on_progress:
            on_progress(lead_email)

        dispatch_result = dispatch_one(
            client,
            flow=step,
            template_key=step,
            campaign_id=campaign_id,
            lead=lead,
            update_waiting_status=update_waiting,
            dry_run=dry_run,
            config=config,
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
