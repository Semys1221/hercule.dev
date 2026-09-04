#!/usr/bin/env python3
"""Dry-run + fake-lead smoke tests for streamlit_subsequence CRM pipeline."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from send_queue import (  # noqa: E402
    dispatch_bulk,
    dispatch_one,
    fetch_pipeline_leads,
    leads_for_step,
    render_template_html,
    resolve_thread,
)

from bootstrapPipelineFromUnibox import (  # noqa: E402
    derive_step_from_flows,
    match_flows,
    merge_steps,
    normalize_email_text,
)

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


def test_send_e1_advances_to_step_1() -> None:
    mock_client = MagicMock()

    with (
        patch("send_queue.has_sent_event", return_value=False),
        patch("send_queue._load_template", return_value={"subject": "", "body_html": "hi"}),
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


def main() -> None:
    tests = [
        test_dry_run_bulk_dispatch,
        test_fetch_defaults_missing_crm_to_step_0,
        test_fetch_reply_moves_step_1_to_replies,
        test_fetch_reply_moves_step_3_to_replies,
        test_missing_link_blocks_send,
        test_send_e1_advances_to_step_1,
        test_final_email_sets_not_interested_and_step_3,
        test_idempotency_skip,
        test_render_template_html,
        test_fetch_on_progress_callback,
        test_resolve_thread_uses_initial_sent_eaccount,
        test_resolve_thread_email_account_fallback,
        test_dispatch_one_passes_email_account_fallback,
    ]
    for test in tests:
        test()
    print(f"\nAll {len(tests)} smoke tests passed.")


if __name__ == "__main__":
    main()
