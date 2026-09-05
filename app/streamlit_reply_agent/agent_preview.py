"""xAI Grok reply preview for Try agent (no send)."""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any, Literal

import requests

from config import grok_api_key
from lead_links import apply_prompt_link_variables, resolve_lead_cta_link
from legal_content import build_knowledge_pack_cached

_REPO_ROOT = Path(__file__).resolve().parents[2]

GROK_API_URL = "https://api.x.ai/v1/chat/completions"
PRIMARY_MODEL = "grok-4-1-fast"
FALLBACK_MODEL = "grok-build-0.1"
MAX_OUTPUT_TOKENS = 200
INBOUND_TEXT_MAX_CHARS = 2000


def truncate_inbound_text(text: str, max_chars: int = INBOUND_TEXT_MAX_CHARS) -> str:
    trimmed = (text or "").strip()
    if not trimmed:
        return "(empty body)"
    if len(trimmed) <= max_chars:
        return trimmed
    return f"{trimmed[: max_chars - 1]}…"


def build_global_rules(*, max_sentences: int = 3) -> str:
    n = max(1, min(10, max_sentences))
    sentence_label = "sentence" if n == 1 else "sentences"
    return f"""You are Béatrice Meyer, qualification lead at Hercule (hercule.dev).

Output JSON only with keys: should_reply (boolean), reply_text (string|null), reason (string).

Reply rules when should_reply is true:
- Plain text only in reply_text (no HTML, no markdown).
- Write exactly {n} {sentence_label} in reply_text.
- Structure: acknowledge → address the question → redirect with urgent CTA to book a call.
- Always sign off as "Béatrice Meyer".
- Add urgency to the CTA (book this week / reserve a slot now).

Safety:
- If the answer is NOT clearly supported by the knowledge pack, set should_reply to false and explain in reason.
- Never invent prices, SLAs, guarantees, or product features.
- Use only the CTA link provided below — never invent URLs."""


GLOBAL_RULES = build_global_rules(max_sentences=3)


def assemble_system_prompt(
    config: dict[str, Any],
    prompt_snapshot: str,
    *,
    max_sentences: int = 3,
    custom_directive: str | None = None,
) -> str:
    parts = [
        build_global_rules(max_sentences=max_sentences),
        "",
        "## Knowledge pack",
        build_knowledge_pack(config),
        "",
        "## Campaign prompt",
        prompt_snapshot,
    ]
    directive = (custom_directive or "").strip()
    if directive:
        parts.extend(["", "## Custom directive (operator)", directive])
    return "\n".join(parts)


def build_knowledge_pack(config: dict[str, Any]) -> str:
    niche = config.get("niche_metadata") or {}
    niche_angle = niche.get("angle") if isinstance(niche.get("angle"), str) else config.get("niche_preset_id", "")
    niche_effectif = niche.get("effectif_cible") if isinstance(niche.get("effectif_cible"), str) else ""
    target_type = str(config.get("target_type") or "buyer")
    return build_knowledge_pack_cached(
        str(config.get("niche_preset_id") or ""),
        target_type,
        str(niche_angle or ""),
        str(niche_effectif or ""),
    )


def _resolve_model(env_name: str, default: str) -> str:
    value = os.getenv(env_name, "").strip()
    return value or default


def _parse_grok_json(content: str) -> dict[str, Any]:
    trimmed = content.strip()
    match = re.search(r"\{[\s\S]*\}", trimmed)
    raw = match.group(0) if match else trimmed
    parsed = json.loads(raw)
    should_reply = bool(parsed.get("should_reply"))
    reply_text = parsed.get("reply_text")
    if isinstance(reply_text, str) and reply_text.strip():
        reply_text = reply_text.strip()
    else:
        reply_text = None
    reason = str(parsed.get("reason") or "No reason provided").strip()
    return {
        "should_reply": should_reply and bool(reply_text),
        "reply_text": reply_text if should_reply and reply_text else None,
        "reason": reason,
    }


def _parse_cost_usd_ticks(data: dict[str, Any]) -> int | None:
    usage = data.get("usage")
    if not isinstance(usage, dict):
        return None
    raw = usage.get("cost_in_usd_ticks")
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str) and raw.strip().isdigit():
        return int(raw.strip())
    return None


def _parse_rate_limit_wait_seconds(error_text: str) -> float | None:
    match = re.search(r"try again in ([\d.]+)s", error_text, re.I)
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


def _is_rate_limit_error(exc: BaseException) -> bool:
    text = str(exc)
    return "429" in text or "rate limit" in text.lower()


def _call_grok_model(
    model: str,
    system_prompt: str,
    user_prompt: str,
) -> tuple[dict[str, Any], str, int | None]:
    response = requests.post(
        GROK_API_URL,
        headers={
            "Authorization": f"Bearer {grok_api_key()}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "temperature": 0.2,
            "max_tokens": MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=120,
    )
    if not response.ok:
        raise RuntimeError(
            f"Grok {model} failed ({response.status_code}): {response.text[:300]}"
        )
    data = response.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    if not str(content).strip():
        raise RuntimeError(f"Grok {model} returned empty content")
    return _parse_grok_json(str(content)), model, _parse_cost_usd_ticks(data)


def _generate_with_models(
    system_prompt: str,
    user_prompt: str,
) -> tuple[dict[str, Any], str, int | None]:
    primary = _resolve_model("GROK_PRIMARY_MODEL", PRIMARY_MODEL)
    fallback = _resolve_model("GROK_FALLBACK_MODEL", FALLBACK_MODEL)
    try:
        return _call_grok_model(primary, system_prompt, user_prompt)
    except Exception as primary_err:
        if not fallback or not _is_rate_limit_error(primary_err):
            raise
        try:
            return _call_grok_model(fallback, system_prompt, user_prompt)
        except Exception as fallback_err:
            raise RuntimeError(
                f"Primary ({primary}) failed: {primary_err}. "
                f"Fallback ({fallback}) failed: {fallback_err}"
            ) from fallback_err


def _target_type_from_config(config: dict[str, Any]) -> Literal["buyer", "seller"]:
    value = str(config.get("target_type") or "buyer").strip().lower()
    return "seller" if value == "seller" else "buyer"


def _max_sentences_from_config(config: dict[str, Any], override: int | None = None) -> int:
    if override is not None:
        return max(1, min(10, override))
    raw = config.get("max_sentences", 2)
    try:
        value = int(raw)
    except (TypeError, ValueError):
        value = 2
    return max(1, min(10, value))


def generate_reply_preview(
    config: dict[str, Any],
    inbound_text: str,
    lead_email: str,
    *,
    prompt_override: str | None = None,
    max_sentences: int | None = None,
    custom_directive: str | None = None,
) -> dict[str, Any]:
    prompt_snapshot = (
        prompt_override
        if prompt_override is not None
        else str(config.get("prompt_snapshot") or "")
    ).strip()
    if not prompt_snapshot:
        raise ValueError("Missing prompt_snapshot on campaign config")

    target_type = _target_type_from_config(config)
    cta_link = resolve_lead_cta_link(lead_email, target_type)
    prompt_snapshot = apply_prompt_link_variables(
        prompt_snapshot,
        cta_link,
        target_type,
    )
    sentence_count = _max_sentences_from_config(config, max_sentences)

    system_prompt = assemble_system_prompt(
        config,
        prompt_snapshot,
        max_sentences=sentence_count,
        custom_directive=custom_directive,
    )
    user_prompt = "\n".join(
        [
            f"Lead email: {lead_email}",
            "",
            f"CTA link (use this exact URL in reply_text): {cta_link}",
            "",
            "Inbound reply to answer:",
            truncate_inbound_text(inbound_text),
        ]
    )

    try:
        decision, model, cost_ticks = _generate_with_models(system_prompt, user_prompt)
    except Exception as exc:
        if not _is_rate_limit_error(exc):
            raise
        wait_s = _parse_rate_limit_wait_seconds(str(exc))
        if wait_s is None:
            raise
        time.sleep(min(wait_s + 1.0, 90.0))
        decision, model, cost_ticks = _generate_with_models(system_prompt, user_prompt)

    return {**decision, "model": model, "cost_usd_ticks": cost_ticks}
