#!/usr/bin/env python3
"""Round-trip save→prod verification for Streamlit booking, reply agent, subsequence."""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

REPO_ROOT = Path(__file__).resolve().parents[2]


def _marker() -> str:
    import os

    override = os.environ.get("AUDIT_MARKER", "").strip()
    if override:
        return override
    return f"__AUDIT_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}__"


class RoundTripResult:
    def __init__(self, name: str) -> None:
        self.name = name
        self.ok = False
        self.detail = ""
        self.skipped = False


def _append_marker(text: str) -> str:
    marker = _marker()
    base = text.rstrip()
    if marker in base:
        return base
    return f"{base}\n{marker}"


def _round_trip(
    name: str,
    read: Callable[[], str],
    write: Callable[[str], None],
    *,
    allow_skip: bool = False,
) -> RoundTripResult:
    result = RoundTripResult(name)
    try:
        original = read()
        marked = _append_marker(original)
        write(marked)
        after_write = read()
        if _marker() not in after_write:
            result.detail = "marker missing after write"
            return result

        write(original)
        after_revert = read()
        if _marker() in after_revert:
            result.detail = "marker still present after revert"
            return result

        result.ok = True
        result.detail = "write verified, revert verified"
        return result
    except Exception as exc:
        if allow_skip and str(exc).lower().startswith("skip:"):
            result.skipped = True
            result.detail = str(exc)
            return result
        result.detail = str(exc)
        return result


def test_booking_resend() -> RoundTripResult:
    sys.path.insert(0, str(REPO_ROOT / "crm"))
    from booking_templates import list_templates, save_template

    category = "agence"
    email_type = "h48_confirm"

    def read_body() -> str:
        rows = list_templates(category)  # type: ignore[arg-type]
        row = next((r for r in rows if r.get("email_type") == email_type), None)
        if not row:
            raise RuntimeError(f"skip: template {category}/{email_type} not found")
        return str(row.get("body") or "")

    subject = str(
        next(
            (
                r.get("subject")
                for r in list_templates(category)  # type: ignore[arg-type]
                if r.get("email_type") == email_type
            ),
            "",
        )
        or ""
    )

    def write_body(body: str) -> None:
        save_template(
            category,  # type: ignore[arg-type]
            email_type,  # type: ignore[arg-type]
            subject,
            body,
            sync_code=False,
        )

    return _round_trip("booking_resend", read_body, write_body)


def _find_active_reply_campaign() -> dict[str, Any]:
    app_dir = REPO_ROOT / "app" / "streamlit_reply_agent"
    sys.path.insert(0, str(app_dir))
    from supabase_repo import get_client

    resp = (
        get_client()
        .table("ai_reply_agent_config")
        .select("*")
        .in_("status", ["waiting_for_replies", "paused"])
        .not_.is_("initialized_at", "null")
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        raise RuntimeError("skip: no active reply agent campaign")
    return rows[0]


def test_reply_agent() -> RoundTripResult:
    app_dir = REPO_ROOT / "app" / "streamlit_reply_agent"
    sys.path.insert(0, str(app_dir))
    from prompt_store import save_prompt
    from supabase_repo import get_config

    config = _find_active_reply_campaign()
    campaign_id = str(config["campaign_id"])
    niche_preset_id = str(config.get("niche_preset_id") or "")
    target_type = str(config.get("target_type") or "buyer")
    if not niche_preset_id:
        result = RoundTripResult("reply_agent")
        result.skipped = True
        result.detail = "skip: campaign missing niche_preset_id"
        return result

    def read_snapshot() -> str:
        row = get_config(campaign_id)
        if not row:
            raise RuntimeError("skip: config disappeared")
        return str(row.get("prompt_snapshot") or "")

    def write_snapshot(text: str) -> None:
        save_prompt(
            niche_preset_id,
            target_type,
            text,
            campaign_id=campaign_id,
            config=config,
        )
        refreshed = get_config(campaign_id)
        if refreshed:
            config.update(refreshed)

    return _round_trip(
        "reply_agent",
        read_snapshot,
        write_snapshot,
        allow_skip=True,
    )


def _find_subsequence_campaign() -> tuple[str, str]:
    app_dir = REPO_ROOT / "app" / "streamlit_subsequence"
    sys.path.insert(0, str(app_dir))
    from supabase_repo import get_client

    resp = (
        get_client()
        .table("instantly_bypass_templates")
        .select("campaign_id, template_key, subject, body_html")
        .eq("template_key", "interested_email1")
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        raise RuntimeError("skip: no subsequence E1 template found")
    row = rows[0]
    return str(row["campaign_id"]), str(row.get("subject") or "")


def test_subsequence() -> RoundTripResult:
    app_dir = REPO_ROOT / "app" / "streamlit_subsequence"
    sys.path.insert(0, str(app_dir))
    from send_queue import _load_template
    from supabase_repo import save_template

    campaign_id, subject = _find_subsequence_campaign()
    template_key = "interested_email1"

    def read_body() -> str:
        row = _load_template(campaign_id, template_key)
        return str(row.get("body_html") or "")

    def write_body(body: str) -> None:
        save_template(
            campaign_id,
            template_key,
            subject,
            body,
            sync_bootstrap_default=False,
        )

    return _round_trip(
        "subsequence",
        read_body,
        write_body,
        allow_skip=True,
    )


def _run_tool(tool: str) -> RoundTripResult:
    runners = {
        "booking": test_booking_resend,
        "subsequence": test_subsequence,
        "reply": test_reply_agent,
    }
    return runners[tool]()


def main() -> int:
    if len(sys.argv) > 1:
        tool = sys.argv[1]
        result = _run_tool(tool)
        if result.skipped:
            print(f"SKIP: {result.detail}")
            return 0
        if result.ok:
            print(f"PASS: {result.detail}")
            return 0
        print(f"FAIL: {result.detail}")
        return 1

    marker = _marker()
    print(f"Save round-trip audit (marker: {marker})")
    print("=" * 60)

    failures = 0
    for tool in ("booking", "subsequence", "reply"):
        proc = subprocess.run(
            [sys.executable, str(Path(__file__).resolve()), tool],
            capture_output=True,
            text=True,
            env={**dict(__import__("os").environ), "AUDIT_MARKER": marker},
        )
        output = (proc.stdout or proc.stderr or "").strip()
        if proc.returncode == 0:
            status = "PASS" if output.startswith("PASS") else "SKIP"
        else:
            status = "FAIL"
            failures += 1
        print(f"[{status}] {tool}: {output or 'no output'}")

    print("=" * 60)
    if failures:
        print(f"Done with {failures} failure(s).")
        return 1
    print("All round-trips passed (or skipped where no data).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
