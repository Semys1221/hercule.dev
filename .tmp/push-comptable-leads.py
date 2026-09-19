#!/usr/bin/env python3
"""Push cleaned comptable MEV CSVs into the comptable (DEC) Instantly campaign."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

_REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO / "shared"))
sys.path.insert(0, str(_REPO / "app" / "streamlit_scraper"))

from instantly_client import InstantlyClient, count_leads_in_campaign, get_api_key  # noqa: E402
from link_provision_client import provision_leads_batches  # noqa: E402

CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6"
LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c"
BATCH_SIZE = 1000
FILES = [
    Path("/Users/evqn/Downloads/leads-2-mev_catchall.csv"),
    Path("/Users/evqn/Downloads/leads-2-mev_valid.csv"),
]


def main() -> None:
    frames = [pd.read_csv(path) for path in FILES]
    df = pd.concat(frames, ignore_index=True).drop_duplicates(subset=["Email"], keep="first")

    emails = [
        str(value).strip()
        for value in df["Email"].tolist()
        if str(value).strip() and "@" in str(value)
    ]
    leads = [{"email": email} for email in emails]

    client = InstantlyClient(get_api_key())
    before = count_leads_in_campaign(CAMPAIGN_ID)

    pushed = skipped = failed = 0
    batches = 0
    attempted = len(leads)

    for start in range(0, attempted, BATCH_SIZE):
        batch = leads[start : start + BATCH_SIZE]
        response = client._fetch(
            "/leads/add",
            method="POST",
            body={
                "campaign_id": CAMPAIGN_ID,
                "leads": batch,
                "skip_if_in_workspace": False,
                "skip_if_in_list": False,
                "skip_if_in_campaign": True,
            },
        )
        batches += 1
        uploaded = int((response or {}).get("leads_uploaded") or 0)
        batch_skipped = int((response or {}).get("skipped_count") or 0)
        batch_failed = max(len(batch) - uploaded - batch_skipped, 0)
        pushed += uploaded
        skipped += batch_skipped
        failed += batch_failed
        print(
            f"Batch {batches}: uploaded={uploaded} skipped={batch_skipped} failed={batch_failed}",
            flush=True,
        )

    after = count_leads_in_campaign(CAMPAIGN_ID)

    provision_stats = provision_leads_batches(
        emails,
        list_id=LIST_ID,
        campaign_id=CAMPAIGN_ID,
        niche="comptable",
        log_cb=lambda message: print(message, flush=True),
    )

    print(
        json.dumps(
            {
                "campaign_id": CAMPAIGN_ID,
                "attempted": attempted,
                "batches": batches,
                "pushed": pushed,
                "skipped_duplicate": skipped,
                "failed": failed,
                "leads_before": before,
                "leads_after": after,
                "provision": provision_stats,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
