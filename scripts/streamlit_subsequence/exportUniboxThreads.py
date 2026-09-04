#!/usr/bin/env python3
"""Export Instantly Unibox threads to local JSON for agent classification."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from shared.instantly_client import InstantlyClient, get_api_key  # noqa: E402

from bootstrapPipelineFromUnibox import fetch_leads, resolve_campaign_id  # noqa: E402
from send_queue import INTERESTED_STATUS, NO_SHOW_STATUS  # noqa: E402
from supabase_repo import list_templates  # noqa: E402
from unibox_thread import ThreadMessage, fetch_thread_messages  # noqa: E402

DEFAULT_OUT = _REPO_ROOT / "tmp" / "unibox_export"
EMAIL_FETCH_DELAY_S = 0.2

CLASSIFICATION_RUBRIC = """# Rubrique de classification Unibox

Classer chaque lead dans **exactement une** catégorie (`step_0` … `step_3`).

| Step | Signification | Indices |
|------|---------------|---------|
| **step_0** | Interested/No-show, aucun suivi Hercule post-intérêt | Cold outreach + réponse prospect seulement |
| **step_1** | E1 (Interested) ou NS1 (No-show) envoyé | Précisions + audit / lien reservation |
| **step_2** | E1 + E2 (Interested) | + confirmation Calendly |
| **step_3** | E1+E2+E3 (Interested) ou NS1+NS2 (No-show) | + retrait liste / clôture |

## Règles

- Ne **pas** compter l'email de campagne Instantly initial comme E1.
- No-show : NS1 seul → step_1 ; NS1+NS2 → step_3 (pas step_2).
- `detected_flows` : `interested_email1/2/3` ou `no_show_email1/2`.
- Une courte `rationale` par lead.

## Templates de référence (Supabase)

Les templates ci-dessous sont copiés dans `manifest.json` → `template_reference`.
"""


def _interest_label(status: int | None) -> str:
    if status == INTERESTED_STATUS:
        return "Intéressé"
    if status == NO_SHOW_STATUS:
        return "No Show"
    return str(status) if status is not None else "—"


def _safe_filename(email: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", email.strip().lower())


def _message_to_dict(msg: ThreadMessage) -> dict[str, Any]:
    return {
        "id": msg.id,
        "direction": msg.direction,
        "timestamp": msg.timestamp,
        "subject": msg.subject,
        "body_plain": msg.body_plain,
        "flow_tag": msg.flow_tag,
    }


def _thread_to_dict(
    *,
    lead: dict[str, Any],
    campaign_id: str,
    messages: list[ThreadMessage],
) -> dict[str, Any]:
    status = lead.get("lt_interest_status")
    try:
        interest_status = int(status) if status is not None else None
    except (TypeError, ValueError):
        interest_status = None

    return {
        "email": str(lead.get("email") or "").strip().lower(),
        "lead_id": str(lead.get("id") or ""),
        "first_name": str(lead.get("first_name") or ""),
        "interest_status": interest_status,
        "interest_label": _interest_label(interest_status),
        "campaign_id": campaign_id,
        "messages": [_message_to_dict(m) for m in messages],
    }


def _empty_classified_files(classified_dir: Path) -> None:
    classified_dir.mkdir(parents=True, exist_ok=True)
    for step in ("step_0", "step_1", "step_2", "step_3"):
        path = classified_dir / f"{step}.json"
        if not path.exists():
            path.write_text("[]\n", encoding="utf-8")


def export_threads(
    *,
    campaign_id: str,
    out_dir: Path,
    max_leads: int,
    client: InstantlyClient,
) -> dict[str, Any]:
    out_dir.mkdir(parents=True, exist_ok=True)
    threads_dir = out_dir / "threads"
    classified_dir = out_dir / "classified"
    threads_dir.mkdir(parents=True, exist_ok=True)
    _empty_classified_files(classified_dir)

    templates = list_templates(campaign_id)
    template_ref = {
        row["template_key"]: {
            "subject": row.get("subject") or "",
            "body_html": row.get("body_html") or "",
        }
        for row in templates
    }

    leads = fetch_leads(client, campaign_id=campaign_id, max_leads=max_leads)
    index: list[dict[str, Any]] = []

    for i, lead in enumerate(leads, start=1):
        email = str(lead.get("email") or "").strip().lower()
        if not email:
            continue

        print(f"  [{i}/{len(leads)}] {email}")
        status = lead.get("lt_interest_status")
        try:
            interest_status = int(status) if status is not None else None
        except (TypeError, ValueError):
            interest_status = None

        messages = fetch_thread_messages(
            client,
            lead_email=email,
            campaign_id=campaign_id,
            lead_first_name=str(lead.get("first_name") or ""),
            interest_status=interest_status,
        )

        thread_file = f"threads/{_safe_filename(email)}.json"
        thread_path = out_dir / thread_file
        thread_data = _thread_to_dict(
            lead=lead,
            campaign_id=campaign_id,
            messages=messages,
        )
        thread_path.write_text(
            json.dumps(thread_data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        index.append(
            {
                "email": email,
                "lead_id": thread_data["lead_id"],
                "interest_status": interest_status,
                "interest_label": thread_data["interest_label"],
                "thread_file": thread_file,
                "message_count": len(messages),
            }
        )
        time.sleep(EMAIL_FETCH_DELAY_S)

    manifest = {
        "campaign_id": campaign_id,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "lead_count": len(index),
        "template_reference": template_ref,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (out_dir / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    rubric_path = out_dir / "CLASSIFICATION_RUBRIC.md"
    rubric_body = CLASSIFICATION_RUBRIC + "\n\n```json\n"
    rubric_body += json.dumps(template_ref, ensure_ascii=False, indent=2)
    rubric_body += "\n```\n"
    rubric_path.write_text(rubric_body, encoding="utf-8")

    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Unibox threads to local JSON.")
    parser.add_argument("--campaign-id", help="Instantly campaign UUID")
    parser.add_argument("--max-leads", type=int, default=500)
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Output directory (default: {DEFAULT_OUT})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        campaign_id = resolve_campaign_id(args.campaign_id)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    api_key = get_api_key()
    if not api_key:
        print("Error: INSTANTLY_API_KEY is not set", file=sys.stderr)
        return 1

    client = InstantlyClient(api_key)
    print(f"Exporting to {args.out.resolve()} (campaign={campaign_id})…")

    manifest = export_threads(
        campaign_id=campaign_id,
        out_dir=args.out,
        max_leads=args.max_leads,
        client=client,
    )

    print(f"\nExported {manifest['lead_count']} lead(s).")
    print(f"  manifest: {args.out / 'manifest.json'}")
    print(f"  index:    {args.out / 'index.json'}")
    print(f"  rubric:   {args.out / 'CLASSIFICATION_RUBRIC.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
