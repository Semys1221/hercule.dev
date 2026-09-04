#!/usr/bin/env python3
"""Dry-run + fake-lead smoke tests for streamlit_subsequence CRM pipeline."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch
from zoneinfo import ZoneInfo

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRIPTS_SUBSEQ_DIR = Path(__file__).resolve().parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))
if str(_SCRIPTS_SUBSEQ_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_SUBSEQ_DIR))

from send_queue import (  # noqa: E402
    QueueLead,
    dispatch_bulk,
    dispatch_conversation_reply,
    dispatch_one,
    fetch_pipeline_leads,
    is_awaiting_reply_over_24h,
    leads_for_step,
    render_template_html,
    resolve_thread,
    suggest_flow_for_lead,
    template_requires_reservation_link,
)
from send_window import (  # noqa: E402
    format_paris_slot,
    is_within_send_window,
    next_send_slot,
)

from onboarding import (  # noqa: E402
    derive_onboarding_status,
    explain_webhook_miss,
    find_campaign_webhook,
    initialize_campaign,
    is_webhook_active,
)

from unibox_classify import (  # noqa: E402
    derive_step_from_flows,
    match_flows,
    merge_steps,
    normalize_email_text,
)
from unibox_thread import (  # noqa: E402
    ThreadMessage,
    fetch_latest_reply,
    render_conversation_html,
    strip_quoted_reply,
)
from verifyBootstrapPipeline import VerifyRow, can_auto_apply  # noqa: E402
from applyUniboxClassification import _load_classified  # noqa: E402

FAKE_CAMPAIGN_ID = "fake-campaign-id"

FAKE_LEAD_WITH_LINK = {
    "id": "fake-lead-1",
    "email": "fake.subseq.1@hercule.test",
    "first_name": "Fake",
    "lt_interest_status": 1,
    "payload": {
        "reservation_agence_link": "https://www.hercule.dev/reservation.html/abc123",
    },
}

FAKE_LEAD_NO_LINK = {
    "id": "fake-lead-2",
    "email": "fake.subseq.2@hercule.test",
    "first_name": "Fake2",
    "lt_interest_status": 1,
    "payload": {},
}


def test_dry_run_bulk_dispatch() -> None:
    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch(
            "send_queue._load_template",
            return_value={"subject": "", "body_html": "hello {{first_name}}"},
        ),
        patch("send_queue.InstantlyClient") as mock_client_cls,
    ):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        result = dispatch_bulk(
            campaign_id=FAKE_CAMPAIGN_ID,
            flow="interested_email1",
            leads=[FAKE_LEAD_WITH_LINK],
            dry_run=True,
        )

        assert result.sent == 1
        assert result.failed == 0
        mock_client.reply_to_email.assert_not_called()
        print("OK dry-run bulk dispatch")


def test_fetch_defaults_missing_crm_to_step_0() -> None:
    mock_client = MagicMock()
    mock_client.list_leads_by_interest_filter.return_value = [FAKE_LEAD_WITH_LINK]

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.list_pipeline_for_campaign", return_value=[]),
        patch("send_queue.campaign_requires_reservation_link", return_value=False),
        patch("send_queue.upsert_pipeline_step") as upsert,
        patch("send_queue.get_last_send_at", return_value=None),
        patch("send_queue.list_sent_flows", return_value=[]),
    ):
        rows = fetch_pipeline_leads(
            campaign_id=FAKE_CAMPAIGN_ID,
            max_leads=10,
            client=mock_client,
        )

    assert len(rows) == 1
    assert rows[0].step == "step_0"
    upsert.assert_called_once_with(FAKE_CAMPAIGN_ID, FAKE_LEAD_WITH_LINK["email"], "step_0")
    print("OK fetch defaults missing CRM to step_0")


def test_fetch_reply_moves_step_1_to_replies() -> None:
    mock_client = MagicMock()
    mock_client.list_leads_by_interest_filter.return_value = [FAKE_LEAD_WITH_LINK]

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch(
            "send_queue.list_pipeline_for_campaign",
            return_value=[
                {
                    "lead_email": FAKE_LEAD_WITH_LINK["email"],
                    "step": "step_1",
                }
            ],
        ),
        patch("send_queue.campaign_requires_reservation_link", return_value=False),
        patch("send_queue.upsert_pipeline_step") as upsert,
        patch("send_queue.get_last_send_at", return_value="2026-01-01T00:00:00Z"),
        patch("send_queue.list_sent_flows", return_value=["interested_email1"]),
        patch("send_queue.lead_has_replied_since", return_value=True),
        patch("send_queue.time.sleep"),
    ):
        rows = fetch_pipeline_leads(
            campaign_id=FAKE_CAMPAIGN_ID,
            client=mock_client,
        )

    assert len(rows) == 1
    assert rows[0].step == "replies_to_handle"
    upsert.assert_called_with(
        FAKE_CAMPAIGN_ID,
        FAKE_LEAD_WITH_LINK["email"],
        "replies_to_handle",
    )
    assert leads_for_step(rows, "replies_to_handle") == rows
    print("OK fetch reply on step 1 → replies_to_handle")


def test_fetch_reply_moves_step_3_to_replies() -> None:
    mock_client = MagicMock()
    mock_client.list_leads_by_interest_filter.return_value = []

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch(
            "send_queue.list_pipeline_for_campaign",
            return_value=[
                {
                    "lead_email": "closed@example.com",
                    "step": "step_3",
                }
            ],
        ),
        patch("send_queue.campaign_requires_reservation_link", return_value=False),
        patch("send_queue.upsert_pipeline_step") as upsert,
        patch("send_queue.get_last_send_at", return_value="2026-01-01T00:00:00Z"),
        patch("send_queue.list_sent_flows", return_value=["interested_email3"]),
        patch("send_queue.lead_has_replied_since", return_value=True),
        patch("send_queue.time.sleep"),
    ):
        rows = fetch_pipeline_leads(
            campaign_id=FAKE_CAMPAIGN_ID,
            client=mock_client,
        )

    assert len(rows) == 1
    assert rows[0].email == "closed@example.com"
    assert rows[0].step == "replies_to_handle"
    upsert.assert_called_with(FAKE_CAMPAIGN_ID, "closed@example.com", "replies_to_handle")
    print("OK fetch reply on step 3 → replies_to_handle")


def test_missing_link_blocks_send() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch(
            "send_queue._load_template",
            return_value={
                "subject": "",
                "body_html": "<p>Link: {{reservation_agence_link}}</p>",
            },
        ),
        patch("send_queue.record_event") as record,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_NO_LINK,
            dry_run=False,
        )

    assert result.get("error") == "missing_reservation_link"
    mock_client.reply_to_email.assert_not_called()
    record.assert_called_once()
    print("OK missing reservation_agence_link blocks send")


def test_missing_link_allowed_when_unused() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue.is_within_send_window", return_value=True),
        patch(
            "send_queue._load_template",
            return_value={"subject": "", "body_html": "<p>Hello {{first_name}}</p>"},
        ),
        patch(
            "send_queue.resolve_thread",
            return_value={
                "reply_to_uuid": "uuid-1",
                "eaccount": "sender@example.com",
                "subject": "Thread",
            },
        ),
        patch("send_queue.record_event"),
        patch("send_queue.upsert_pipeline_step"),
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_NO_LINK,
            dry_run=False,
        )

    assert result.get("ok") is True
    mock_client.reply_to_email.assert_called_once()
    print("OK missing reservation_agence_link allowed when unused in template")


def test_empty_template_blocks_send() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue._load_template", return_value={"subject": "", "body_html": "  "}),
        patch("send_queue.record_event") as record,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result.get("error") == "template_empty"
    mock_client.reply_to_email.assert_not_called()
    record.assert_called_once()
    print("OK empty template blocks send")


def test_send_e1_advances_to_step_1() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue._load_template", return_value={"subject": "", "body_html": "hi"}),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue.is_within_send_window", return_value=True),
        patch(
            "send_queue.resolve_thread",
            return_value={
                "reply_to_uuid": "uuid-1",
                "eaccount": "sender@example.com",
                "subject": "Thread",
            },
        ),
        patch("send_queue.record_event"),
        patch("send_queue.upsert_pipeline_step") as upsert,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result.get("ok") is True
    upsert.assert_called_once_with(
        FAKE_CAMPAIGN_ID,
        FAKE_LEAD_WITH_LINK["email"],
        "step_1",
    )
    print("OK send E1 advances to step_1")


def test_final_email_sets_not_interested_and_step_3() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue._load_template", return_value={"subject": "", "body_html": "bye"}),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue.is_within_send_window", return_value=True),
        patch(
            "send_queue.resolve_thread",
            return_value={
                "reply_to_uuid": "uuid-1",
                "eaccount": "sender@example.com",
                "subject": "Existing thread",
            },
        ),
        patch("send_queue.record_event"),
        patch("send_queue.upsert_pipeline_step") as upsert,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email3",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result.get("ok") is True
    mock_client.update_interest_status.assert_called_once_with(
        lead_email=FAKE_LEAD_WITH_LINK["email"],
        interest_value=-1,
        campaign_id=FAKE_CAMPAIGN_ID,
    )
    upsert.assert_called_once_with(
        FAKE_CAMPAIGN_ID,
        FAKE_LEAD_WITH_LINK["email"],
        "step_3",
    )
    print("OK final email sets Not Interested (-1) and step_3")


def test_idempotency_skip() -> None:
    mock_client = MagicMock()

    with patch("send_queue.has_sent_event", return_value=True):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result.get("skipped") == "already_sent"
    mock_client.reply_to_email.assert_not_called()
    print("OK idempotency skip")


def test_render_template_html() -> None:
    with patch(
        "send_queue._load_template",
        return_value={
            "subject": "",
            "body_html": "<p>Link: {{reservation_agence_link}}</p><p>Cordialement,<br/>{{accountSignature}}</p>",
        },
    ):
        html = render_template_html("interested_email1", FAKE_LEAD_WITH_LINK)

    assert "abc123" in html
    assert "Béatrice Meyer" in html
    assert "{{accountSignature}}" not in html
    print("OK render_template_html replaces legacy accountSignature placeholder")


def test_fetch_on_progress_callback() -> None:
    mock_client = MagicMock()
    mock_client.list_leads_by_interest_filter.return_value = [FAKE_LEAD_WITH_LINK]
    progress_calls: list[tuple[int, int, str]] = []

    def on_progress(current: int, total: int, message: str) -> None:
        progress_calls.append((current, total, message))

    with (
        patch("send_queue.get_api_key", return_value="fake-api-key"),
        patch("send_queue.list_pipeline_for_campaign", return_value=[]),
        patch("send_queue.campaign_requires_reservation_link", return_value=False),
        patch("send_queue.upsert_pipeline_step"),
        patch("send_queue.get_last_send_at", return_value=None),
        patch("send_queue.list_sent_flows", return_value=[]),
    ):
        fetch_pipeline_leads(
            campaign_id=FAKE_CAMPAIGN_ID,
            client=mock_client,
            on_progress=on_progress,
        )

    assert progress_calls
    assert progress_calls[-1][0] == progress_calls[-1][1] == 1
    print("OK fetch on_progress callback")


def test_resolve_thread_uses_initial_sent_eaccount() -> None:
    mock_client = MagicMock()

    def list_emails_side_effect(**kwargs):
        email_type = kwargs.get("email_type")
        latest_of_thread = kwargs.get("latest_of_thread")
        if email_type == "sent" and not latest_of_thread:
            return [
                {
                    "id": "sent-early",
                    "eaccount": "initial@example.com",
                    "timestamp_email": "2026-01-01T10:00:00Z",
                },
                {
                    "id": "sent-late",
                    "eaccount": "other@example.com",
                    "timestamp_email": "2026-01-02T10:00:00Z",
                },
            ]
        if email_type == "received" and latest_of_thread:
            return [
                {
                    "id": "recv-latest",
                    "eaccount": "other@example.com",
                    "subject": "Re: hello",
                    "timestamp_email": "2026-01-03T10:00:00Z",
                },
            ]
        return []

    mock_client.list_emails.side_effect = list_emails_side_effect

    thread = resolve_thread(
        mock_client,
        lead_email="lead@example.com",
        campaign_id=FAKE_CAMPAIGN_ID,
    )

    assert thread is not None
    assert thread["eaccount"] == "initial@example.com"
    assert thread["reply_to_uuid"] == "recv-latest"
    assert thread["subject"] == "Re: hello"
    print("OK resolve_thread uses initial sent eaccount")


def test_resolve_thread_email_account_fallback() -> None:
    mock_client = MagicMock()

    def list_emails_side_effect(**kwargs):
        email_type = kwargs.get("email_type")
        latest_of_thread = kwargs.get("latest_of_thread")
        if email_type == "sent" and not latest_of_thread:
            return []
        if latest_of_thread:
            return [
                {
                    "id": "anchor-1",
                    "subject": "Thread",
                    "timestamp_email": "2026-01-03T10:00:00Z",
                },
            ]
        return []

    mock_client.list_emails.side_effect = list_emails_side_effect

    thread = resolve_thread(
        mock_client,
        lead_email="lead@example.com",
        campaign_id=FAKE_CAMPAIGN_ID,
        fallback_eaccount="fallback@example.com",
    )

    assert thread is not None
    assert thread["eaccount"] == "fallback@example.com"
    assert thread["reply_to_uuid"] == "anchor-1"
    print("OK resolve_thread email_account fallback")


def test_dispatch_one_passes_email_account_fallback() -> None:
    mock_client = MagicMock()
    lead = {
        **FAKE_LEAD_WITH_LINK,
        "payload": {
            **FAKE_LEAD_WITH_LINK["payload"],
            "email_account": "sender@example.com",
        },
    }

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch(
            "send_queue._load_template",
            return_value={"subject": "", "body_html": "Cordialement,<br/>Béatrice Meyer"},
        ),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue.is_within_send_window", return_value=True),
        patch("send_queue.resolve_thread") as resolve,
        patch("send_queue.record_event"),
        patch("send_queue.upsert_pipeline_step"),
    ):
        resolve.return_value = {
            "reply_to_uuid": "uuid-1",
            "eaccount": "sender@example.com",
            "subject": "Thread",
        }
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=lead,
            dry_run=False,
        )

    assert result.get("ok") is True
    resolve.assert_called_once_with(
        mock_client,
        lead_email=lead["email"],
        campaign_id=FAKE_CAMPAIGN_ID,
        fallback_eaccount="sender@example.com",
    )
    mock_client.reply_to_email.assert_called_once()
    html = mock_client.reply_to_email.call_args.kwargs["html"]
    assert "Béatrice Meyer" in html
    print("OK dispatch_one passes email_account fallback with hardcoded signature")


def test_bootstrap_normalize_and_match_interested_e1() -> None:
    html = (
        "Voici les précisions.<br/>"
        "Pour réaliser l'audit de compatibilité de votre agence, cliquez ici :<br/>"
        "Mon agence est compatible<br/>"
        "Cordialement,<br/>Béatrice Meyer<br/>"
        '<a href="https://hercule.dev">hercule.dev</a>'
    )
    normalized = normalize_email_text(html)
    assert "voici les precisions" in normalized
    flows = match_flows(html, allowed_flows=["interested_email1", "interested_email2"])
    assert flows == {"interested_email1"}
    assert derive_step_from_flows(flows, is_no_show=False) == "step_1"
    print("OK bootstrap match interested E1")


def test_bootstrap_derive_interested_steps() -> None:
    assert derive_step_from_flows(set(), is_no_show=False) == "step_0"
    assert derive_step_from_flows({"interested_email1"}, is_no_show=False) == "step_1"
    assert (
        derive_step_from_flows(
            {"interested_email1", "interested_email2"},
            is_no_show=False,
        )
        == "step_2"
    )
    assert (
        derive_step_from_flows(
            {"interested_email1", "interested_email2", "interested_email3"},
            is_no_show=False,
        )
        == "step_3"
    )
    print("OK bootstrap derive interested steps")


def test_bootstrap_derive_no_show_steps() -> None:
    assert derive_step_from_flows(set(), is_no_show=True) == "step_0"
    assert derive_step_from_flows({"no_show_email1"}, is_no_show=True) == "step_1"
    assert (
        derive_step_from_flows(
            {"no_show_email1", "no_show_email2"},
            is_no_show=True,
        )
        == "step_3"
    )
    print("OK bootstrap derive no-show steps")


def test_bootstrap_merge_steps_no_downgrade() -> None:
    assert merge_steps("step_2", "step_3", overwrite=False) == "step_3"
    assert merge_steps("step_2", "step_0", overwrite=False) == "step_2"
    assert merge_steps("step_1", "step_3", overwrite=True) == "step_1"
    print("OK bootstrap merge steps")


def test_render_conversation_html_alignment() -> None:
    messages = [
        ThreadMessage(
            id="1",
            direction="received",
            timestamp="2026-01-01T10:00:00",
            subject="Re: hello",
            body_html="Bonjour",
            body_plain="Bonjour",
            sender_label="Jean",
            flow_tag=None,
        ),
        ThreadMessage(
            id="2",
            direction="sent",
            timestamp="2026-01-01T11:00:00",
            subject="Re: hello",
            body_html="Voici les precisions",
            body_plain="Voici les precisions",
            sender_label="Hercule",
            flow_tag="E1",
        ),
    ]
    html = render_conversation_html(messages)
    assert "unibox-chat" in html
    assert "Bonjour" in html
    assert "E1" in html
    assert "flex-end" in html
    assert "flex-start" in html
    print("OK render conversation html")


def test_strip_quoted_reply_french_apple_mail() -> None:
    raw = (
        "Bonjour, Oui je réalise des prestations de marketing digital. "
        "Donc pourquoi pas, c'est quoi le principe ? Cordialement. &nbsp; "
        "Stéphane &nbsp; Boesel Marketing - site internet &nbsp; 0652554630 &nbsp; "
        "stephane@lecafeduweb.fr &nbsp; https://lecafeduweb.fr/ &nbsp; "
        "46 rue Carnot 95150 TAVERNY &nbsp; "
        "Le 4 sept. 2026 à 11:25, Béatrice Meyer &lt;beatrice@atlas-conseil.site&gt; "
        "a écrit : Bonjour, J'ai actuellement plusieurs personnes ayant manifesté "
        "leur intérêt pour du Marketing Digital dans votre secteur."
    )
    stripped = strip_quoted_reply(raw)
    assert "marketing digital" in stripped
    assert "Stéphane" in stripped
    assert "Béatrice Meyer" not in stripped
    assert "a écrit" not in stripped
    assert "J'ai actuellement plusieurs personnes" not in stripped
    print("OK strip quoted reply french apple mail")


def test_strip_quoted_reply_html_blockquote() -> None:
    raw = "<p>Merci pour votre message.</p><blockquote>Previous email</blockquote>"
    stripped = strip_quoted_reply(raw)
    assert stripped == "<p>Merci pour votre message.</p>"
    print("OK strip quoted reply html blockquote")


def test_strip_quoted_reply_no_quote() -> None:
    raw = "Bonjour, oui nous pouvons vous aider. Cordialement."
    assert strip_quoted_reply(raw) == raw
    print("OK strip quoted reply no quote")


def test_strip_quoted_reply_empty() -> None:
    assert strip_quoted_reply("") == ""
    assert strip_quoted_reply("   ") == ""
    print("OK strip quoted reply empty")


def test_fetch_latest_reply_received_only() -> None:
    mock_client = MagicMock()
    mock_client.list_emails.return_value = [
        {
            "id": "recv-1",
            "subject": "Re: marketing",
            "body": {"html": "Oui intéressé. Le 1 jan. 2026 à 10:00, Alice a écrit : old"},
            "timestamp_email": "2026-01-02T10:00:00Z",
        },
    ]

    messages = fetch_latest_reply(
        mock_client,
        lead_email="lead@example.com",
        campaign_id="camp-1",
        lead_first_name="Jean",
    )

    mock_client.list_emails.assert_called_once_with(
        search="lead@example.com",
        campaign_id="camp-1",
        email_type="received",
        latest_of_thread=True,
        limit=1,
    )
    assert len(messages) == 1
    assert messages[0].direction == "received"
    assert messages[0].sender_label == "Jean"
    assert "Oui intéressé" in messages[0].body_plain
    assert "Alice a écrit" not in messages[0].body_plain
    print("OK fetch latest reply received only")


def test_fetch_latest_reply_empty() -> None:
    mock_client = MagicMock()
    mock_client.list_emails.return_value = []

    messages = fetch_latest_reply(
        mock_client,
        lead_email="lead@example.com",
        campaign_id="camp-1",
    )

    assert messages == []
    print("OK fetch latest reply empty")


def test_verify_can_auto_apply_gate() -> None:
    bootstrap_rows = [
        {"confidence": "high", "proposed_step": "step_1"},
        {"confidence": "high", "proposed_step": "step_0"},
    ]

    ok, _ = can_auto_apply(
        bootstrap_rows,
        [
            VerifyRow("a@x.com", "step_1", "step_1", "interested_email1", "high", "MATCH", ""),
            VerifyRow("b@x.com", "step_0", "step_0", "", "high", "MATCH", ""),
        ],
    )
    assert ok is True

    blocked, reason = can_auto_apply(
        bootstrap_rows,
        [
            VerifyRow("a@x.com", "step_2", "step_1", "interested_email1", "high", "MISMATCH", ""),
        ],
    )
    assert blocked is False
    assert "mismatch" in reason.lower()
    print("OK verify auto-apply gate")


PARIS = ZoneInfo("Europe/Paris")


def _paris_utc(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    local = datetime(year, month, day, hour, minute, tzinfo=PARIS)
    return local.astimezone(timezone.utc)


def test_send_window_weekday_slots() -> None:
    monday_6h = _paris_utc(2026, 9, 7, 6)
    monday_8h = _paris_utc(2026, 9, 7, 8)
    tuesday_10h = _paris_utc(2026, 9, 8, 10)
    monday_17h = _paris_utc(2026, 9, 7, 17)
    friday_18h = _paris_utc(2026, 9, 11, 18)
    saturday_10h = _paris_utc(2026, 9, 12, 10)
    monday_14_8h = _paris_utc(2026, 9, 14, 8)

    assert is_within_send_window(monday_6h) is False
    assert is_within_send_window(tuesday_10h) is True
    assert is_within_send_window(monday_17h) is False
    assert is_within_send_window(saturday_10h) is False

    assert next_send_slot(monday_6h) == monday_8h
    assert next_send_slot(friday_18h) == monday_14_8h
    assert next_send_slot(saturday_10h) == monday_14_8h
    assert "08:00 (Paris)" in format_paris_slot(monday_8h)
    print("OK send window weekday slots")


def test_dispatch_one_schedules_outside_window() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue.is_within_send_window", return_value=False),
        patch("send_queue.next_send_slot", return_value=_paris_utc(2026, 9, 7, 8)),
        patch(
            "send_queue._load_template",
            return_value={"subject": "", "body_html": "hello"},
        ),
        patch("send_queue.insert_bypass_job") as insert_job,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result["scheduled"] is True
    assert result["ok"] is True
    insert_job.assert_called_once()
    mock_client.reply_to_email.assert_not_called()
    print("OK dispatch_one schedules outside window")


def test_dispatch_one_sends_inside_window() -> None:
    mock_client = MagicMock()
    mock_client.reply_to_email.return_value = {"ok": True}

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch("send_queue.is_within_send_window", return_value=True),
        patch("send_queue._load_template", return_value={"subject": "Re:", "body_html": "Hi"}),
        patch(
            "send_queue.resolve_thread",
            return_value={
                "reply_to_uuid": "uuid-1",
                "eaccount": "acct@test.com",
                "subject": "Re: test",
            },
        ),
        patch("send_queue.record_event") as record_event,
        patch("send_queue.upsert_pipeline_step") as upsert,
        patch("send_queue.insert_bypass_job") as insert_job,
    ):
        result = dispatch_one(
            mock_client,
            flow="interested_email1",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            dry_run=False,
        )

    assert result["ok"] is True
    assert "scheduled" not in result
    mock_client.reply_to_email.assert_called_once()
    insert_job.assert_not_called()
    record_event.assert_called_once()
    upsert.assert_called_once_with(
        FAKE_CAMPAIGN_ID,
        FAKE_LEAD_WITH_LINK["email"],
        "step_1",
    )
    print("OK dispatch_one sends inside window")


def test_apply_load_classified_fixture() -> None:
    fixture = Path(__file__).resolve().parent / "fixtures" / "unibox"
    campaign_id, rows = _load_classified(fixture)
    assert campaign_id == "test-campaign"
    assert len(rows) == 2
    emails = {r["email"] for r in rows}
    assert emails == {"a@test.com", "b@test.com"}
    print("OK apply load classified fixture")


def test_classify_thread_e1_variant() -> None:
    from classifyExportedThreads import classify_thread

    thread = {
        "messages": [
            {
                "direction": "sent",
                "body_plain": (
                    "Voici les precisions. Pour deposer la candidature de votre agence "
                    "https://calendly.com/hercule-connect/30min hercule.dev Beatrice Meyer"
                ),
            }
        ]
    }
    step, flows, _ = classify_thread(thread, {})
    assert step == "step_1"
    assert "interested_email1" in flows
    print("OK classify thread E1 variant")


def test_onboarding_status_and_webhook_match() -> None:
    assert derive_onboarding_status(
        has_config=False, has_webhook=False, copy_complete=False
    ) == "not_initialized"
    assert derive_onboarding_status(
        has_config=True, has_webhook=True, copy_complete=False
    ) == "copy_incomplete"
    assert derive_onboarding_status(
        has_config=True, has_webhook=False, copy_complete=True
    ) == "webhook_incomplete"
    assert derive_onboarding_status(
        has_config=True, has_webhook=True, copy_complete=True
    ) == "ready"

    target = "https://www.hercule.dev/api/webhooks/instantly"
    webhooks = [
        {
            "id": "wh-1",
            "event_type": "lead_interested",
            "target_hook_url": target,
            "campaign": FAKE_CAMPAIGN_ID,
        },
        {
            "id": "wh-other",
            "event_type": "lead_interested",
            "target_hook_url": target,
            "campaign": "other-campaign",
        },
    ]
    match = find_campaign_webhook(
        webhooks, campaign_id=FAKE_CAMPAIGN_ID, target_url=target + "/"
    )
    assert match is not None
    assert match["id"] == "wh-1"
    assert (
        find_campaign_webhook(
            webhooks, campaign_id="unknown", target_url=target
        )
        is None
    )
    inactive = {
        "id": "wh-inactive",
        "event_type": "lead_interested",
        "target_hook_url": target,
        "campaign": FAKE_CAMPAIGN_ID,
        "status": -1,
        "timestamp_error": "2026-09-04T13:16:36.187Z",
    }
    assert not is_webhook_active(inactive)
    assert (
        find_campaign_webhook(
            [inactive], campaign_id=FAKE_CAMPAIGN_ID, target_url=target
        )
        is None
    )
    assert (
        find_campaign_webhook(
            [inactive],
            campaign_id=FAKE_CAMPAIGN_ID,
            target_url=target,
            require_active=False,
        )
        is inactive
    )
    assert template_requires_reservation_link("<p>{{reservation_agence_link}}</p>")
    assert not template_requires_reservation_link("<p>Hello {{first_name}}</p>")
    print("OK onboarding status and webhook match")


def test_explain_webhook_miss() -> None:
    target = "https://www.hercule.dev/api/webhooks/instantly"
    assert (
        explain_webhook_miss([], campaign_id=FAKE_CAMPAIGN_ID, target_url=target)
        == "Aucun webhook Instantly de type `lead_interested` enregistré."
    )

    url_mismatch = explain_webhook_miss(
        [
            {
                "id": "wh-old",
                "event_type": "lead_interested",
                "target_hook_url": "https://henri-fridzi.homes/api/webhooks/instantly",
            }
        ],
        campaign_id=FAKE_CAMPAIGN_ID,
        target_url=target,
    )
    assert url_mismatch is not None
    assert "henri-fridzi.homes" in url_mismatch

    campaign_mismatch = explain_webhook_miss(
        [
            {
                "id": "wh-other",
                "event_type": "lead_interested",
                "target_hook_url": target,
                "campaign": "other-campaign",
            }
        ],
        campaign_id=FAKE_CAMPAIGN_ID,
        target_url=target,
    )
    assert campaign_mismatch is not None
    assert "other-campaign" in campaign_mismatch

    inactive = explain_webhook_miss(
        [
            {
                "id": "wh-inactive",
                "event_type": "lead_interested",
                "target_hook_url": target,
                "campaign": FAKE_CAMPAIGN_ID,
                "status": -1,
                "timestamp_error": "2026-09-04T13:16:36.187Z",
            }
        ],
        campaign_id=FAKE_CAMPAIGN_ID,
        target_url=target,
    )
    assert inactive is not None
    assert "inactif" in inactive
    assert "2026-09-04T13:16:36.187Z" in inactive

    assert (
        explain_webhook_miss(
            [
                {
                    "id": "wh-1",
                    "event_type": "lead_interested",
                    "target_hook_url": target,
                    "campaign": FAKE_CAMPAIGN_ID,
                    "status": 1,
                }
            ],
            campaign_id=FAKE_CAMPAIGN_ID,
            target_url=target,
        )
        is None
    )
    print("OK explain_webhook_miss")


def test_initialize_campaign_rejects_bad_url() -> None:
    mock_client = MagicMock()
    try:
        initialize_campaign(
            mock_client,
            campaign_id=FAKE_CAMPAIGN_ID,
            campaign_name="Test",
            target_url="https://henri-fridzi.homes/api/webhooks/instantly",
            secret="secret",
        )
    except ValueError as exc:
        assert "henri-fridzi" in str(exc).lower() or "hercule.dev" in str(exc)
    else:
        raise AssertionError("Expected ValueError for invalid webhook URL")
    mock_client.list_webhooks.assert_not_called()
    print("OK initialize_campaign rejects bad URL")


def test_initialize_campaign_resumes_inactive_webhook() -> None:
    target = "https://www.hercule.dev/api/webhooks/instantly"
    mock_client = MagicMock()
    mock_client.list_webhooks.return_value = [
        {
            "id": "wh-inactive",
            "event_type": "lead_interested",
            "target_hook_url": target,
            "campaign": FAKE_CAMPAIGN_ID,
            "status": -1,
            "timestamp_error": "2026-09-04T13:16:36.187Z",
        }
    ]
    persisted = {"campaign_id": FAKE_CAMPAIGN_ID, "webhook_id": "wh-inactive"}
    with (
        patch("onboarding.get_config", return_value=persisted),
        patch("onboarding.save_config") as save_config,
        patch("onboarding.seed_empty_templates"),
    ):
        result = initialize_campaign(
            mock_client,
            campaign_id=FAKE_CAMPAIGN_ID,
            campaign_name="Test",
            target_url=target,
            secret="secret",
        )
    mock_client.create_webhook.assert_not_called()
    mock_client.patch_webhook.assert_called_once_with(
        "wh-inactive",
        headers={"Authorization": "Bearer secret"},
    )
    mock_client.resume_webhook.assert_called_once_with("wh-inactive")
    save_config.assert_called()
    assert result["webhook_id"] == "wh-inactive"
    print("OK initialize_campaign resumes inactive webhook")


def test_list_webhooks_pagination() -> None:
    from shared.instantly_client import InstantlyClient

    client = InstantlyClient("fake-api-key")
    pages = [
        {"items": [{"id": f"wh-{index}"} for index in range(100)]},
        {"items": [{"id": "wh-final"}]},
    ]

    with patch.object(client, "_fetch", side_effect=pages) as mock_fetch:
        hooks = client.list_webhooks()

    assert len(hooks) == 101
    assert hooks[-1]["id"] == "wh-final"
    assert mock_fetch.call_count == 2
    assert "starting_after=wh-99" in mock_fetch.call_args_list[1].args[0]
    print("OK list_webhooks pagination")


def test_mandataires_duplicate_heuristic() -> None:
    from auditDuplicateE1 import _mandataires_messages  # noqa: E402
    from unibox_thread import ThreadMessage  # noqa: E402

    e1_text = (
        "Voici les precisions. cabinets comptables de 3 a 12 mandataires. "
        "hercule.dev Beatrice Meyer"
    )
    single = [
        ThreadMessage(
            id="1",
            direction="sent",
            timestamp="2026-09-04T10:00:00Z",
            subject="Re:",
            body_html=e1_text,
            body_plain=e1_text,
            sender_label="Beatrice",
            flow_tag="E1",
        )
    ]
    assert len(_mandataires_messages(single)) == 1

    duplicate = [
        *single,
        ThreadMessage(
            id="2",
            direction="sent",
            timestamp="2026-09-04T11:00:00Z",
            subject="Re:",
            body_html=e1_text,
            body_plain=e1_text,
            sender_label="Beatrice",
            flow_tag="E1",
        ),
    ]
    assert len(_mandataires_messages(duplicate)) == 2
    print("OK mandataires duplicate heuristic")


def test_is_awaiting_reply_over_24h() -> None:
    old = "2020-01-01T00:00:00+00:00"
    recent = datetime.now(timezone.utc).isoformat()
    assert is_awaiting_reply_over_24h(old, "2019-01-01T00:00:00+00:00") is True
    assert is_awaiting_reply_over_24h(old, old) is False
    assert is_awaiting_reply_over_24h(recent, None) is False
    assert is_awaiting_reply_over_24h(None, None) is False
    print("OK is_awaiting_reply_over_24h")


def test_suggest_flow_for_lead() -> None:
    lead = QueueLead(
        lead_id="1",
        email="a@example.com",
        first_name="A",
        interest_label="Intéressé",
        last_sent_at=None,
        replied_since_last_send=True,
        missing_reservation_link=False,
        sent_flows=["interested_email1"],
        step="replies_to_handle",
        envoyer=False,
    )
    assert suggest_flow_for_lead(lead) == "interested_email2"
    lead.sent_flows = ["interested_email1", "interested_email2"]
    assert suggest_flow_for_lead(lead) == "interested_email3"
    lead.sent_flows = ["interested_email3"]
    assert suggest_flow_for_lead(lead) is None
    lead.step = "step_1"
    assert suggest_flow_for_lead(lead) == "interested_email2"
    print("OK suggest_flow_for_lead")


def test_dispatch_conversation_reply_dry_run() -> None:
    mock_client = MagicMock()
    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue.has_pending_job", return_value=False),
        patch(
            "send_queue._load_template",
            return_value={"subject": "Re:", "body_html": "<p>Hi</p>"},
        ),
        patch("send_queue.is_within_send_window", return_value=True),
    ):
        result = dispatch_conversation_reply(
            mock_client,
            flow="interested_email2",
            campaign_id=FAKE_CAMPAIGN_ID,
            lead=FAKE_LEAD_WITH_LINK,
            body_html="<p>Custom body</p>",
            dry_run=True,
        )
    assert result.get("would_send_now") is True
    mock_client.reply_to_email.assert_not_called()
    print("OK dispatch_conversation_reply dry run")


def main() -> None:
    tests = [
        test_dry_run_bulk_dispatch,
        test_send_window_weekday_slots,
        test_dispatch_one_schedules_outside_window,
        test_dispatch_one_sends_inside_window,
        test_fetch_defaults_missing_crm_to_step_0,
        test_fetch_reply_moves_step_1_to_replies,
        test_fetch_reply_moves_step_3_to_replies,
        test_missing_link_blocks_send,
        test_missing_link_allowed_when_unused,
        test_empty_template_blocks_send,
        test_send_e1_advances_to_step_1,
        test_final_email_sets_not_interested_and_step_3,
        test_idempotency_skip,
        test_render_template_html,
        test_fetch_on_progress_callback,
        test_resolve_thread_uses_initial_sent_eaccount,
        test_resolve_thread_email_account_fallback,
        test_dispatch_one_passes_email_account_fallback,
        test_bootstrap_normalize_and_match_interested_e1,
        test_bootstrap_derive_interested_steps,
        test_bootstrap_derive_no_show_steps,
        test_bootstrap_merge_steps_no_downgrade,
        test_render_conversation_html_alignment,
        test_strip_quoted_reply_french_apple_mail,
        test_strip_quoted_reply_html_blockquote,
        test_strip_quoted_reply_no_quote,
        test_strip_quoted_reply_empty,
        test_fetch_latest_reply_received_only,
        test_fetch_latest_reply_empty,
        test_verify_can_auto_apply_gate,
        test_apply_load_classified_fixture,
        test_classify_thread_e1_variant,
        test_onboarding_status_and_webhook_match,
        test_explain_webhook_miss,
        test_initialize_campaign_rejects_bad_url,
        test_initialize_campaign_resumes_inactive_webhook,
        test_list_webhooks_pagination,
        test_mandataires_duplicate_heuristic,
        test_is_awaiting_reply_over_24h,
        test_suggest_flow_for_lead,
        test_dispatch_conversation_reply_dry_run,
    ]
    for test in tests:
        test()
    print(f"\nAll {len(tests)} smoke tests passed.")


if __name__ == "__main__":
    main()
