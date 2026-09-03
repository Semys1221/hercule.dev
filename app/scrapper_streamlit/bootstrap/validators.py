"""Preset schema validation and Instantly URL parsing."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

UUID_RE = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    re.I,
)
PRESET_ID_RE = re.compile(r"^[a-z][a-z0-9_]*$")

REQUIRED_CONFIG_KEYS = (
    "INSTANTLY_LIST_ID",
    "TARGET_LEADS",
    "TARGET_MODE",
    "KEYWORDS",
    "LOCATIONS",
    "EXPANSION_KEYWORDS",
    "EXPANSION_LOCATIONS",
    "ENRICH_ENABLED",
    "ENRICH_INCLUDED_KEYWORDS",
    "ENRICH_HARD_EXCLUDED_KEYWORDS",
    "ENRICH_SOFT_EXCLUDED_KEYWORDS",
    "EXCLUDE_DOMAINS",
    "OUTSCRAPER_BATCH_SIZE",
    "OUTSCRAPER_CONCURRENCY",
    "OUTSCRAPER_LIMIT_PER_QUERY",
)

REQUIRED_LIST_KEYS = (
    "KEYWORDS",
    "LOCATIONS",
    "EXPANSION_KEYWORDS",
    "EXPANSION_LOCATIONS",
    "ENRICH_INCLUDED_KEYWORDS",
    "ENRICH_HARD_EXCLUDED_KEYWORDS",
    "ENRICH_SOFT_EXCLUDED_KEYWORDS",
    "EXCLUDE_DOMAINS",
)


@dataclass
class ValidationResult:
    preset_id: str
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        self.ok = False
        self.errors.append(msg)

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)


def parse_instantly_uuid(value: str, *, kind: str = "id") -> str:
    """Extract UUID from raw ID or Instantly app URL."""
    raw = value.strip()
    if not raw:
        return ""

    match = UUID_RE.search(raw)
    if not match:
        raise ValueError(f"Invalid Instantly {kind}: no UUID found in {raw!r}")
    return match.group(0).lower()


def validate_preset_id(preset_id: str) -> str:
    normalized = preset_id.strip().lower().replace("-", "_").replace(" ", "_")
    if not PRESET_ID_RE.match(normalized):
        raise ValueError(
            "Preset ID must be snake_case (lowercase letters, digits, underscores; "
            "must start with a letter)."
        )
    return normalized


def parse_keyword_list(raw: str) -> list[str]:
    if not raw.strip():
        return []
    parts: list[str] = []
    for line in raw.replace(";", ",").splitlines():
        for item in line.split(","):
            kw = item.strip()
            if kw:
                parts.append(kw)
    return parts


def validate_config_schema(config: dict[str, Any], *, preset_id: str) -> ValidationResult:
    result = ValidationResult(preset_id=preset_id, ok=True)

    for key in REQUIRED_CONFIG_KEYS:
        if key not in config:
            result.add_error(f"CONFIG missing key: {key}")

    for key in REQUIRED_LIST_KEYS:
        value = config.get(key)
        if value is not None and not isinstance(value, list):
            result.add_error(f"CONFIG[{key!r}] must be a list")
        elif isinstance(value, list) and len(value) == 0:
            result.add_warning(f"CONFIG[{key!r}] is empty")

    list_id = str(config.get("INSTANTLY_LIST_ID", "")).strip()
    if list_id and not UUID_RE.fullmatch(list_id):
        result.add_error(f"INSTANTLY_LIST_ID is not a valid UUID: {list_id!r}")

    campaign_id = str(config.get("INSTANTLY_CAMPAIGN_ID", "")).strip()
    if campaign_id and not UUID_RE.fullmatch(campaign_id):
        result.add_error(f"INSTANTLY_CAMPAIGN_ID is not a valid UUID: {campaign_id!r}")

    target = config.get("TARGET_LEADS")
    if target is not None and int(target) <= 0:
        result.add_error("TARGET_LEADS must be positive")

    return result


def validate_preset_runtime(preset_id: str, *, dry_run: bool = False) -> ValidationResult:
    from config_loader import load_config
    from scrape_state import build_config_fingerprint

    result = ValidationResult(preset_id=preset_id, ok=True)

    try:
        config = load_config(preset_id, require_keys=False)
    except SystemExit as exc:
        result.add_error(str(exc))
        return result
    except Exception as exc:
        result.add_error(f"load_config failed: {exc}")
        return result

    schema = validate_config_schema(config, preset_id=preset_id)
    result.errors.extend(schema.errors)
    result.warnings.extend(schema.warnings)
    if not schema.ok:
        result.ok = False

    try:
        build_config_fingerprint(config)
    except Exception as exc:
        result.add_error(f"build_config_fingerprint failed: {exc}")

    if dry_run:
        try:
            import asyncio
            from core_logic import run_scraper_pipeline

            summary: dict[str, Any] = {}

            def _log(_: str) -> None:
                pass

            summary = asyncio.run(
                run_scraper_pipeline(
                    config,
                    log_cb=_log,
                    progress_cb=lambda _: None,
                    metric_cb=lambda *_: None,
                    dry_run=True,
                    preset=preset_id,
                )
            )
            if int(summary.get("queries_total", 0)) <= 0:
                result.add_warning("dry-run produced zero queries")
        except Exception as exc:
            result.add_error(f"dry-run failed: {exc}")

    return result
