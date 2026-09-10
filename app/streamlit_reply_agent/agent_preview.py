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
from lead_links import apply_prompt_link_variables, resolve_prompt_links
from lead_tags import TAG_LABELS, TAG_NOT_INTERESTED
from legal_content import build_knowledge_pack_cached, is_comptable_niche_preset

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


def build_global_rules(
    *,
    max_sentences: int = 3,
    niche_preset_id: str | None = None,
) -> str:
    n = max(1, min(10, max_sentences))
    phrase_label = "phrase" if n == 1 else "phrases"
    pricing_url = (
        "https://hercule.dev/cvg/comptable"
        if is_comptable_niche_preset(niche_preset_id or "")
        else "https://hercule.dev/cvg"
    )
    return f"""Tu es Béatrice Meyer, responsable qualification chez Hercule (hercule.dev).

Réponds uniquement en JSON avec les clés : should_reply (boolean), reply_text (string|null), reason (string).

Règles quand should_reply est true :
- Texte brut uniquement dans reply_text (pas de HTML, pas de markdown).
- Écris exactement {n} {phrase_label} dans reply_text.
- Rédige reply_text en français.
- Structure : accuser réception → répondre à la question → CTA urgent pour réserver un appel.
- Sépare le corps, le lien CTA et la signature par une ligne vide (\\n\\n).
- Mets le lien CTA seul sur sa propre ligne, en URL brute (sera affiché « Réserver » à l'envoi).
- Termine toujours par « Béatrice Meyer », puis une nouvelle ligne avec l'URL du site (https://hercule.dev ou {pricing_url} si question tarifs).
- Signe toujours « Béatrice Meyer ».
- Ajoute de l'urgence au CTA (réserver cette semaine / réserver un créneau maintenant).

Sécurité :
- Si le tag Instantly du lead est « Not interested », mets should_reply à false et indique dans reason que le lead a été marqué non intéressé — ne jamais relancer une conversation.
- Si la réponse n'est PAS clairement couverte par le pack de connaissances, mets should_reply à false et explique dans reason (en français).
- N'invente jamais de prix, délais, garanties ou fonctionnalités.
- Utilise uniquement le lien CTA fourni — n'invente jamais d'URL."""


def assemble_system_prompt(
    config: dict[str, Any],
    prompt_snapshot: str,
    *,
    max_sentences: int = 3,
    custom_directive: str | None = None,
) -> str:
    niche_preset_id = str(config.get("niche_preset_id") or "")
    parts = [
        build_global_rules(max_sentences=max_sentences, niche_preset_id=niche_preset_id),
        "",
        "## Pack de connaissances",
        build_knowledge_pack(config),
        "",
        "## Prompt campagne",
        prompt_snapshot,
    ]
    directive = (custom_directive or "").strip()
    if directive:
        parts.extend(["", "## Directive custom (opérateur)", directive])
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
    reason = str(parsed.get("reason") or "Aucune raison fournie").strip()
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


NOT_INTERESTED_SKIP_REASON = (
    "Lead marqué Not interested dans Instantly — ne pas relancer."
)


def generate_reply_preview(
    config: dict[str, Any],
    inbound_text: str,
    lead_email: str,
    *,
    prompt_override: str | None = None,
    max_sentences: int | None = None,
    custom_directive: str | None = None,
    interest_label: str | None = None,
) -> dict[str, Any]:
    prompt_snapshot = (
        prompt_override
        if prompt_override is not None
        else str(config.get("prompt_snapshot") or "")
    ).strip()
    if not prompt_snapshot:
        raise ValueError("Missing prompt_snapshot on campaign config")

    tag_label = (interest_label or TAG_LABELS["lead"]).strip()
    if tag_label == TAG_LABELS[TAG_NOT_INTERESTED]:
        return {
            "should_reply": False,
            "reply_text": None,
            "reason": NOT_INTERESTED_SKIP_REASON,
            "model": None,
            "cost_usd_ticks": None,
        }

    target_type = _target_type_from_config(config)
    prompt_links = resolve_prompt_links(lead_email, target_type)
    prompt_snapshot = apply_prompt_link_variables(
        prompt_snapshot,
        prompt_links["primary"],
        target_type,
        prompt_links,
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
            f"Email du lead : {lead_email}",
            f"Tag Instantly du lead : {tag_label}",
            "",
            f"Lien CTA (utilise exactement cette URL dans reply_text) : {prompt_links['primary']}",
            "",
            "Réponse entrante à traiter :",
            truncate_inbound_text(inbound_text),
        ]
    )

    knowledge_pack = build_knowledge_pack(config)
    legal_anchors = (
        "Nanguy Evan Gbeho",
        "entrepreneur individuel",
        "885 248 039",
    )
    pack_lower = knowledge_pack.lower()
    # #region agent log
    try:
        requests.post(
            "http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d",
            headers={
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "4c294f",
            },
            json={
                "sessionId": "4c294f",
                "runId": "pre-grok",
                "hypothesisId": "A",
                "location": "agent_preview.py:generate_reply_preview",
                "message": "knowledge pack legal anchor coverage",
                "data": {
                    "niche_preset_id": config.get("niche_preset_id"),
                    "target_type": config.get("target_type"),
                    "anchors_present": {
                        anchor: anchor.lower() in pack_lower for anchor in legal_anchors
                    },
                    "inbound_preview": truncate_inbound_text(inbound_text)[:120],
                },
                "timestamp": int(time.time() * 1000),
            },
            timeout=2,
        )
    except Exception:
        pass
    # #endregion

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

    reply_text = decision.get("reply_text") or ""
    reply_lower = reply_text.lower()
    # #region agent log
    try:
        requests.post(
            "http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d",
            headers={
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "4c294f",
            },
            json={
                "sessionId": "4c294f",
                "runId": "post-grok",
                "hypothesisId": "C",
                "location": "agent_preview.py:generate_reply_preview",
                "message": "grok decision for inbound reply",
                "data": {
                    "should_reply": decision.get("should_reply"),
                    "reason": decision.get("reason"),
                    "reply_has_legal_name": "nanguy" in reply_lower,
                    "reply_has_ei": "entrepreneur individuel" in reply_lower
                    or " ei" in reply_lower,
                    "reply_has_rcs": "885" in reply_lower or "rcs" in reply_lower,
                    "reply_preview": reply_text[:180],
                },
                "timestamp": int(time.time() * 1000),
            },
            timeout=2,
        )
    except Exception:
        pass
    # #endregion

    return {**decision, "model": model, "cost_usd_ticks": cost_ticks}
