#!/usr/bin/env python3
"""Move/push cleaned Agence Web leads into Agence web 2 campaign."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import pandas as pd

_REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO / "app" / "streamlit_clean"))

from instantly_client import _get_client, push_leads_to_campaign  # noqa: E402

SOURCE_CAMPAIGN = "57165194-c785-4200-812a-8e8e76da63a9"  # Agence web 0
TARGET_CAMPAIGN = "6864f739-36ff-4406-89c5-9bee42b8fa21"  # Agence web 2
FINAL_CLEAN = (
    _REPO / "app/streamlit_clean/data/20260915_095434_final_clean.csv"
)
BATCH = 100


def log(msg: str) -> None:
    print(msg, flush=True)


def list_leads_by_contacts(client, emails: list[str]) -> list[dict]:
    if not emails:
        return []
    data = client._fetch(
        "/leads/list",
        method="POST",
        body={"contacts": emails, "limit": len(emails)},
    )
    return data.get("items") or [] if isinstance(data, dict) else []


def move_leads(client, lead_ids: list[str]) -> dict:
    if not lead_ids:
        return {}
    return client._fetch(
        "/leads/move",
        method="POST",
        body={
            "lead_ids": lead_ids,
            "to_campaign_id": TARGET_CAMPAIGN,
            "campaign": SOURCE_CAMPAIGN,
        },
    )


def main() -> None:
    df = pd.read_csv(FINAL_CLEAN)
    email_col = "email" if "email" in df.columns else df.columns[0]
    emails = [
        str(value).strip().lower()
        for value in df[email_col].tolist()
        if str(value).strip() and "@" in str(value)
    ]
    log(f"Loaded {len(emails)} clean email(s) from {FINAL_CLEAN.name}")

    client = _get_client()
    leads_by_email: dict[str, dict] = {}

    for start in range(0, len(emails), BATCH):
        batch = emails[start : start + BATCH]
        for item in list_leads_by_contacts(client, batch):
            email = str(item.get("email") or "").strip().lower()
            if email:
                leads_by_email[email] = item
        log(f"Resolved {min(start + BATCH, len(emails))}/{len(emails)} emails")

    to_move: list[str] = []
    already_target: list[str] = []
    to_push_rows: list[dict] = []

    records = df.to_dict(orient="records")
    record_by_email = {
        str(row[email_col]).strip().lower(): row for row in records if row.get(email_col)
    }

    for email in emails:
        lead = leads_by_email.get(email)
        if not lead:
            to_push_rows.append(record_by_email[email])
            continue
        campaign = str(lead.get("campaign") or "").strip()
        lead_id = str(lead.get("id") or "").strip()
        if campaign == TARGET_CAMPAIGN:
            already_target.append(email)
        elif campaign == SOURCE_CAMPAIGN and lead_id:
            to_move.append(lead_id)
        else:
            # In another campaign — still try push (Instantly may skip duplicate)
            to_push_rows.append(record_by_email[email])

    log(
        f"Plan: move={len(to_move)} already_in_target={len(already_target)} "
        f"push={len(to_push_rows)}"
    )

    moved = 0
    for start in range(0, len(to_move), BATCH):
        batch_ids = to_move[start : start + BATCH]
        try:
            move_leads(client, batch_ids)
            moved += len(batch_ids)
            log(f"Moved batch {start // BATCH + 1}: {len(batch_ids)} lead(s)")
        except Exception as exc:
            log(f"Move batch failed: {exc}")
        time.sleep(0.5)

    pushed = skipped = failed = 0
    if to_push_rows:
        push_df = pd.DataFrame(to_push_rows)
        stats = push_leads_to_campaign(
            TARGET_CAMPAIGN,
            push_df,
            dry_run=False,
            on_progress=lambda msg, _: log(msg),
        )
        pushed = stats["pushed"]
        skipped = stats["skipped_duplicate"]
        failed = stats["failed"]

    summary = {
        "target_campaign": TARGET_CAMPAIGN,
        "source_campaign": SOURCE_CAMPAIGN,
        "total_clean": len(emails),
        "moved_from_source": moved,
        "already_in_target": len(already_target),
        "pushed": pushed,
        "push_skipped_duplicate": skipped,
        "push_failed": failed,
    }
    log("Done: " + json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
