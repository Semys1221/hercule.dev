#!/usr/bin/env python3
"""Push cleaned restaurant CSV exports into the Instantly restaurant campaign."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

_REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO / "shared"))

from instantly_client import count_leads_in_campaign, push_leads_to_campaign  # noqa: E402

CAMPAIGN_ID = "e4f11e76-717e-4be9-a6ad-c7f0a331afb7"
FILES = [
    Path("/Users/evqn/Downloads/leads_10876_catchall.csv"),
    Path("/Users/evqn/Downloads/leads_10876_valid.csv"),
]

STANDARD = {
    "Email": "email",
    "First Name": "first_name",
    "companyName": "company_name",
    "website": "website",
}

SKIP = {
    "id",
    "timestamp_created",
    "timestamp_updated",
    "organization",
    "campaign",
    "status",
    "email_opened",
    "email_replied",
    "lt_interest_status",
    "subsequence_id",
    "verification_status",
    "pl_value_lead",
    "email_clicked",
    "timestamp_added_subsequence",
    "timestamp_last_contact",
    "timestamp_last_open",
    "timestamp_last_reply",
    "timestamp_last_interest_change",
    "email_open_count",
    "email_reply_count",
    "timestamp_last_click",
    "email_click_count",
    "enrichment_status",
    "list_id",
    "last_contacted_from",
    "company_domain",
    "uploaded_by_user",
    "upload_method",
    "assigned_to",
    "is_website_visitor",
    "timestamp_last_touch",
    "esp_code",
    "phone_numbers",
    "supersearch_enrichment_status",
    "esg_code",
    "completion_reason",
    "is_suppressed",
    "Result",
    "RoleBased",
    "FreeDomain",
    "Diagnosis",
    "MX_Domain",
    "Email Provider",
    "Assignee Email",
    "Assignee Name",
    "Lead Status",
    "Interest Status",
    "Verification Status",
    "Last contacted from",
    *STANDARD.keys(),
}


def clean(value) -> str | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


def to_push_row(row: dict) -> dict | None:
    email = clean(row.get("Email"))
    if not email or "@" not in email:
        return None

    out: dict = {"email": email}
    for src, dest in STANDARD.items():
        if dest == "email":
            continue
        value = clean(row.get(src))
        if value:
            out[dest] = value

    custom: dict[str, str] = {}
    for key, value in row.items():
        if key in SKIP:
            continue
        text = clean(value)
        if text is not None:
            custom[str(key)] = text
    if custom:
        out["custom_variables"] = custom
    return out


def main() -> None:
    frames = [pd.read_csv(path) for path in FILES]
    df = pd.concat(frames, ignore_index=True).drop_duplicates(subset=["Email"], keep="first")

    before = count_leads_in_campaign(CAMPAIGN_ID)
    rows = [r for r in (to_push_row(row) for row in df.to_dict(orient="records")) if r]
    push_df = pd.DataFrame(rows)

    stats = push_leads_to_campaign(
        CAMPAIGN_ID,
        push_df,
        dry_run=False,
        on_progress=lambda msg, _: print(msg, flush=True),
    )

    after = count_leads_in_campaign(CAMPAIGN_ID)
    print(
        json.dumps(
            {
                "campaign_id": CAMPAIGN_ID,
                "unique_emails": len(push_df),
                "leads_before": before,
                "leads_after": after,
                **stats,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
