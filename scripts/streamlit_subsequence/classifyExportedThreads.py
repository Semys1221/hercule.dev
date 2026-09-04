#!/usr/bin/env python3
"""Classify exported Unibox threads into step_0..step_3 JSON (full-thread analysis)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = _REPO_ROOT / "app" / "streamlit_subsequence"
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from unibox_classify import (  # noqa: E402
    ALL_HERCULE_FLOWS,
    FLOW_FINGERPRINTS,
    derive_step_unified,
    match_flows,
    normalize_email_text,
)

DEFAULT_EXPORT_DIR = _REPO_ROOT / "tmp" / "unibox_export"


def _plain_template_snippets(body_html: str) -> list[str]:
    plain = normalize_email_text(body_html)
    snippets: list[str] = []
    for markers in FLOW_FINGERPRINTS.values():
        for marker in markers:
            if marker in plain and marker not in snippets:
                snippets.append(marker)
    return snippets


def _is_hercule_sent(text: str) -> bool:
    n = normalize_email_text(text)
    return (
        "beatrice meyer" in n
        or "hercule.dev" in n
        or "hercule-connect" in n
        or "reservation_agence_link" in n
        or "reservation.html" in n
    )


def _is_cold_outreach(text: str) -> bool:
    n = normalize_email_text(text)
    return (
        "votre agence est-elle en mesure d assurer" in n
        or "repondez moi et je vous enverrai un apercu" in n
    )


def _match_template_flows(
    text: str,
    *,
    template_ref: dict[str, Any],
) -> set[str]:
    if not _is_hercule_sent(text) or _is_cold_outreach(text):
        return set()

    normalized = normalize_email_text(text)
    matched: set[str] = set()

    for flow in ALL_HERCULE_FLOWS:
        markers = list(FLOW_FINGERPRINTS.get(flow, []))
        tpl = template_ref.get(flow, {})
        if isinstance(tpl, dict) and tpl.get("body_html"):
            markers.extend(_plain_template_snippets(str(tpl["body_html"])))

        for marker in markers:
            if marker in normalized:
                matched.add(flow)
                break

    matched |= {str(f) for f in match_flows(text, allowed_flows=list(ALL_HERCULE_FLOWS))}
    return matched


def classify_thread(
    thread: dict[str, Any],
    template_ref: dict[str, Any],
) -> tuple[str, list[str], str]:
    messages = sorted(
        thread.get("messages") or [],
        key=lambda m: str(m.get("timestamp") or ""),
    )

    detected: set[str] = set()
    rationales: list[str] = []

    for i, msg in enumerate(messages):
        if msg.get("direction") != "sent":
            continue

        text = str(msg.get("body_plain") or msg.get("subject") or "")
        if not text.strip():
            continue

        flows = _match_template_flows(text, template_ref=template_ref)
        if flows:
            detected |= flows
            rationales.append(f"msg#{i+1} sent → {', '.join(sorted(flows))}")

    step = derive_step_unified(detected)
    if not detected:
        rationale = "Aucun email Hercule follow-up détecté dans le thread"
    else:
        rationale = "; ".join(rationales)

    return step, sorted(detected), rationale


def classify_export(export_dir: Path) -> dict[str, list[dict[str, Any]]]:
    manifest_path = export_dir / "manifest.json"
    index_path = export_dir / "index.json"
    if not manifest_path.is_file() or not index_path.is_file():
        raise FileNotFoundError(f"Missing manifest or index in {export_dir}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    index = json.loads(index_path.read_text(encoding="utf-8"))
    template_ref = manifest.get("template_reference") or {}

    buckets: dict[str, list[dict[str, Any]]] = {
        "step_0": [],
        "step_1": [],
        "step_2": [],
        "step_3": [],
    }

    for entry in index:
        thread_path = export_dir / str(entry["thread_file"])
        if not thread_path.is_file():
            raise FileNotFoundError(f"Missing thread file: {thread_path}")

        thread = json.loads(thread_path.read_text(encoding="utf-8"))
        step, flows, rationale = classify_thread(thread, template_ref)

        buckets[step].append(
            {
                "email": thread["email"],
                "lead_id": thread.get("lead_id") or entry.get("lead_id") or "",
                "interest_status": thread.get("interest_status"),
                "detected_flows": flows,
                "rationale": rationale,
            }
        )

    classified_dir = export_dir / "classified"
    classified_dir.mkdir(parents=True, exist_ok=True)
    for step, rows in buckets.items():
        out_path = classified_dir / f"{step}.json"
        out_path.write_text(
            json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return buckets


def print_summary(buckets: dict[str, list[dict[str, Any]]]) -> None:
    print("\n=== Classification summary ===")
    total = 0
    for step in ("step_0", "step_1", "step_2", "step_3"):
        count = len(buckets[step])
        total += count
        print(f"  {step}: {count}")
    print(f"  total: {total}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Classify exported Unibox threads.")
    parser.add_argument(
        "--export-dir",
        type=Path,
        default=DEFAULT_EXPORT_DIR,
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        buckets = classify_export(args.export_dir)
    except FileNotFoundError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print_summary(buckets)
    print(f"\nWritten to {args.export_dir / 'classified'}/step_*.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
