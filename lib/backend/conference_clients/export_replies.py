"""Export Instantly Not-interested leads whose last inbound reply is « non »."""

from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from conference_clients import (
    ACCOUNTING_QUOTA,
    BROKERAGE_QUOTA,
    NOT_INTERESTED_STATUS,
)
from conference_clients.campaigns import Category, classify_campaign_name
from conference_clients.denylist import is_denied
from conference_clients.reply_non import is_non_reply
from conference_clients.select import cabinet_name, resolve_website, website_domain
from shared.instantly_client import FILTER_LEAD_NOT_INTERESTED, InstantlyClient, lead_to_row

SNIPPET_LEN = 100
EMAIL_FETCH_DELAY_S = 0
REPLY_WORKERS = 8

_QUOTE_MARKERS = (
    re.compile(r"<blockquote\b", re.I),
    re.compile(r'class=["\']gmail_quote["\']', re.I),
    re.compile(r"Le\s+\d{1,2}\s+.+?\s+a\s+(?:écrit|ecrit)\s*:", re.I | re.S),
    re.compile(r"On\s+.+?\s+wrote\s*:", re.I | re.S),
    re.compile(r"-----Original Message-----", re.I),
)


def _interest_status(lead: dict[str, Any]) -> int | None:
    raw = lead.get("lt_interest_status")
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _strip_quoted(raw: str) -> str:
    if not raw:
        return ""
    earliest = len(raw)
    for pattern in _QUOTE_MARKERS:
        match = pattern.search(raw)
        if match and match.start() < earliest:
            earliest = match.start()
    return raw[:earliest].rstrip()


def _plain_from_html(raw: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_text(item: dict[str, Any]) -> tuple[str, bool]:
    body = item.get("body")
    if isinstance(body, dict):
        for key in ("text", "plain", "html"):
            value = body.get(key)
            if isinstance(value, str) and value.strip():
                return value, True
    for key in ("body_html", "html", "text"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value, True
    subject = str(item.get("subject") or "")
    return subject, False


def last_inbound_plain(
    client: InstantlyClient,
    *,
    lead_email: str,
    campaign_id: str,
) -> str:
    items = client.list_emails(
        search=lead_email,
        campaign_id=campaign_id,
        email_type="received",
        latest_of_thread=True,
        limit=5,
    )
    if not items:
        return ""

    def ts(item: dict[str, Any]) -> str:
        return str(item.get("timestamp_email") or item.get("timestamp_created") or "")

    item = sorted(items, key=ts, reverse=True)[0]
    text, has_body = _extract_text(item)
    if not has_body:
        email_id = str(item.get("id") or "")
        if email_id:
            detail = client.get_email(email_id)
            if detail:
                text, has_body = _extract_text(detail)
    text = _strip_quoted(text) if text else ""
    if "<" in text:
        return _plain_from_html(text)
    return text.strip()


def classify_campaigns(
    campaigns: list[dict[str, Any]],
    *,
    forced_ids: set[str] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    selected: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    forced = forced_ids or set()
    for campaign in campaigns:
        campaign_id = str(campaign.get("id") or "").strip()
        name = str(campaign.get("name") or "")
        category = classify_campaign_name(name)
        if campaign_id in forced and category is None:
            skipped.append({"id": campaign_id, "name": name, "reason": "forced_unclassified"})
            continue
        if category is None and campaign_id not in forced:
            skipped.append({"id": campaign_id, "name": name, "reason": "out_of_scope"})
            continue
        selected.append(
            {
                "id": campaign_id,
                "name": name,
                "category": category,
            }
        )
    return selected, skipped


def normalize_lead(
    lead: dict[str, Any],
    *,
    campaign_id: str,
    campaign_name: str,
    category: Category,
    last_reply_snippet: str,
    interest_status: int,
) -> dict[str, Any]:
    row = lead_to_row(lead)
    return {
        "email": str(row.get("email") or "").strip().lower(),
        "first_name": row.get("first_name") or "",
        "company_name": row.get("company_name") or "",
        "website": row.get("website") or "",
        "lead_id": str(lead.get("id") or row.get("instantly_lead_id") or ""),
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "category": category,
        "interest_status": interest_status,
        "last_reply_snippet": last_reply_snippet[:SNIPPET_LEN],
    }


def quota_for(category: str) -> int:
    if category == "accounting":
        return ACCOUNTING_QUOTA
    if category == "brokerage":
        return BROKERAGE_QUOTA
    return 0


def _debug_log(hypothesis_id: str, message: str, data: dict[str, Any]) -> None:
    # region agent log
    try:
        path = Path("/Users/evqn/dev/hercule.dev/.cursor/debug-747aa5.log")
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "sessionId": "747aa5",
            "hypothesisId": hypothesis_id,
            "location": "export_replies.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")
    except OSError:
        pass
    # endregion


def _usable_cabinet(row: dict[str, Any]) -> bool:
    website = resolve_website(row)
    if not website:
        return False
    domain = website_domain(website) or ""
    return not is_denied(cabinet_name(row, domain), domain)


def _clients_for_workers(client: InstantlyClient, workers: int) -> list[Any]:
    api_key = getattr(client, "api_key", None)
    if not isinstance(api_key, str) or not api_key.strip() or workers <= 1:
        return [client]
    return [InstantlyClient(api_key) for _ in range(workers)]


def _parallel_replies(
    client: InstantlyClient,
    leads: list[tuple[str, dict[str, Any]]],
    *,
    campaign_id: str,
) -> list[tuple[str, dict[str, Any], str]]:
    pool_clients = _clients_for_workers(client, min(REPLY_WORKERS, max(1, len(leads))))

    def fetch(index: int, email: str, lead: dict[str, Any]) -> tuple[str, dict[str, Any], str]:
        worker = pool_clients[index % len(pool_clients)]
        reply = last_inbound_plain(worker, lead_email=email, campaign_id=campaign_id)
        return email, lead, reply

    if len(pool_clients) == 1 or len(leads) <= 1:
        return [fetch(0, email, lead) for email, lead in leads]
    with ThreadPoolExecutor(max_workers=len(pool_clients)) as pool:
        futures = [
            pool.submit(fetch, index, email, lead)
            for index, (email, lead) in enumerate(leads)
        ]
        return [future.result() for future in futures]


def export_not_interested_non(
    client: InstantlyClient,
    *,
    campaigns: list[dict[str, Any]],
    max_leads: int = 2000,
    skip_non_reply_check: bool = False,
    delay_s: float = EMAIL_FETCH_DELAY_S,
    on_progress: Any | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    accepted: list[dict[str, Any]] = []
    by_campaign: list[dict[str, Any]] = []
    counts = {"accounting": 0, "brokerage": 0}
    rejected_wrong_status = 0
    rejected_no_non_reply = 0
    rejected_no_email = 0
    rejected_unusable = 0
    scanned = 0

    for campaign in campaigns:
        campaign_id = campaign["id"]
        campaign_name = campaign["name"]
        category: Category = campaign["category"]
        target = quota_for(category)
        if counts[category] >= target:
            _debug_log(
                "C",
                "skip campaign, quota already met",
                {"category": category, "accepted": counts[category], "target": target},
            )
            continue

        camp_accepted = 0
        camp_rejected_non = 0
        camp_scanned = 0
        fetched = 0
        starting_after: str | None = None
        stopped_early = False

        while counts[category] < target and fetched < max_leads:
            page_limit = min(100, max_leads - fetched)
            body: dict[str, Any] = {
                "campaign": campaign_id,
                "filter": FILTER_LEAD_NOT_INTERESTED,
                "limit": page_limit,
            }
            if starting_after:
                body["starting_after"] = starting_after
            page = client._fetch("/leads/list", method="POST", body=body)
            items = page.get("items") or [] if isinstance(page, dict) else []
            if not items:
                break
            fetched += len(items)
            pending: list[tuple[str, dict[str, Any], int]] = []

            def keep(email: str, lead: dict[str, Any], status: int, snippet: str) -> None:
                nonlocal camp_accepted
                row = normalize_lead(
                    lead,
                    campaign_id=campaign_id,
                    campaign_name=campaign_name,
                    category=category,
                    last_reply_snippet=snippet,
                    interest_status=status,
                )
                accepted.append(row)
                counts[category] += 1
                camp_accepted += 1
                if on_progress:
                    on_progress(email, campaign_name)

            for lead in items:
                if counts[category] >= target:
                    stopped_early = True
                    break
                scanned += 1
                camp_scanned += 1
                email = str(lead.get("email") or "").strip().lower()
                if not email:
                    rejected_no_email += 1
                    continue
                status = _interest_status(lead)
                if status != NOT_INTERESTED_STATUS:
                    rejected_wrong_status += 1
                    continue
                preview = normalize_lead(
                    lead,
                    campaign_id=campaign_id,
                    campaign_name=campaign_name,
                    category=category,
                    last_reply_snippet="",
                    interest_status=status,
                )
                if not _usable_cabinet(preview):
                    rejected_unusable += 1
                    continue
                if skip_non_reply_check:
                    keep(email, lead, status, "")
                    continue
                pending.append((email, lead, status))
                if len(pending) < REPLY_WORKERS and lead is not items[-1]:
                    continue
                for email, lead, status, reply in (
                    (*item, body)
                    for item, body in zip(
                        pending,
                        [row[2] for row in _parallel_replies(
                            client,
                            [(item[0], item[1]) for item in pending],
                            campaign_id=campaign_id,
                        )],
                        strict=True,
                    )
                ):
                    if counts[category] >= target:
                        stopped_early = True
                        break
                    if delay_s:
                        time.sleep(delay_s)
                    if not is_non_reply(reply):
                        rejected_no_non_reply += 1
                        camp_rejected_non += 1
                        continue
                    keep(email, lead, status, reply[:SNIPPET_LEN])
                pending = []
                print(
                    f"  {category}: {counts[category]}/{target} kept, {camp_scanned} checked",
                    flush=True,
                )
                if counts[category] >= target:
                    stopped_early = True
                    break

            _debug_log(
                "A",
                "page scanned",
                {
                    "category": category,
                    "page_size": len(items),
                    "fetched": fetched,
                    "scanned": camp_scanned,
                    "accepted": counts[category],
                    "target": target,
                },
            )

            if counts[category] >= target:
                stopped_early = True
                break

            next_cursor = page.get("next_starting_after") if isinstance(page, dict) else None
            if not next_cursor and items:
                next_cursor = items[-1].get("id")
            if not next_cursor or len(items) < page_limit:
                break
            starting_after = str(next_cursor)

        _debug_log(
            "B",
            "campaign finished",
            {
                "category": category,
                "stopped_early": stopped_early,
                "scanned": camp_scanned,
                "accepted": camp_accepted,
                "target": target,
            },
        )
        by_campaign.append(
            {
                "id": campaign_id,
                "name": campaign_name,
                "category": category,
                "not_interested_fetched": fetched,
                "scanned": camp_scanned,
                "accepted": camp_accepted,
                "target": target,
                "stopped_early": stopped_early,
                "rejected_no_non_reply": camp_rejected_non,
            }
        )

    report = {
        "accepted": len(accepted),
        "target_total": ACCOUNTING_QUOTA + BROKERAGE_QUOTA,
        "counts": counts,
        "scanned": scanned,
        "rejected_no_non_reply": rejected_no_non_reply,
        "rejected_wrong_status": rejected_wrong_status,
        "rejected_no_email": rejected_no_email,
        "rejected_unusable": rejected_unusable,
        "skip_non_reply_check": skip_non_reply_check,
        "by_campaign": by_campaign,
    }
    _debug_log(
        "C",
        "export finished",
        {
            "accepted": len(accepted),
            "scanned": scanned,
            "counts": counts,
            "target_total": ACCOUNTING_QUOTA + BROKERAGE_QUOTA,
        },
    )
    return accepted, report
