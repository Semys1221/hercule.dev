"""Company gate configuration."""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from typing import Any

_LIB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_APP_DIR = os.path.dirname(_LIB_DIR)
if _APP_DIR not in sys.path:
    sys.path.insert(0, _APP_DIR)
from outreach_data import default_sirene_path, hercule_data_root  # noqa: E402

DEFAULT_SIRENE_PATH = default_sirene_path()


@dataclass
class CompanyGateConfig:
    enabled: bool = True
    min_employees: int = 3
    min_score: int = 55
    scoring_enabled: bool = True
    on_unknown: str = "reject"
    naf_prefixes: list[str] | None = None
    concurrency: int = 50
    timeout_s: float = 5.0
    sirene_index_enabled: bool = True
    sirene_index_path: str = DEFAULT_SIRENE_PATH
    deep_enrich: bool = False
    reject_holdings: bool = True
    cache_path: str = ""

    @classmethod
    def from_dict(cls, config: dict[str, Any], *, cache_path: str = "") -> CompanyGateConfig:
        return cls(
            enabled=bool(config.get("PAPPERS_ENABLED", False)),
            min_employees=max(int(config.get("PAPPERS_MIN_EMPLOYEES", 3)), 0),
            min_score=max(int(config.get("PAPPERS_MIN_SCORE", 55) or 55), 0),
            scoring_enabled=bool(config.get("PAPPERS_SCORING_ENABLED", True)),
            on_unknown=str(config.get("PAPPERS_ON_UNKNOWN") or "reject").strip().lower(),
            naf_prefixes=list(config.get("PAPPERS_NAF_PREFIXES") or []),
            concurrency=max(int(config.get("PAPPERS_CONCURRENCY", 50) or 50), 1),
            timeout_s=5.0,
            sirene_index_enabled=bool(config.get("SIRENE_INDEX_ENABLED", True)),
            sirene_index_path=str(config.get("SIRENE_INDEX_PATH") or DEFAULT_SIRENE_PATH),
            deep_enrich=bool(config.get("REGISTRY_DEEP_ENRICH", False)),
            reject_holdings=bool(config.get("REJECT_HOLDINGS", True)),
            cache_path=cache_path,
        )

    def resolve_sirene_path(self) -> str:
        path = self.sirene_index_path
        if os.path.isabs(path):
            return path
        if hercule_data_root():
            from outreach_data import app_data_dir

            return os.path.join(app_data_dir("streamlit_scraper"), path)
        return os.path.join(_LIB_DIR, path)


def pappers_settings(config: dict[str, Any]) -> dict[str, Any]:
    """Backward-compatible settings dict."""
    gate = CompanyGateConfig.from_dict(config)
    return {
        "enabled": gate.enabled,
        "min_employees": gate.min_employees,
        "on_unknown": gate.on_unknown,
        "naf_prefixes": gate.naf_prefixes or [],
        "concurrency": gate.concurrency,
        "timeout_s": gate.timeout_s,
        "min_score": gate.min_score,
        "scoring_enabled": gate.scoring_enabled,
        "sirene_index_enabled": gate.sirene_index_enabled,
        "deep_enrich": gate.deep_enrich,
    }


# Shared registry constants
TRANCHE_MIN: dict[str, int] = {
    "NN": 0,
    "00": 0,
    "0": 0,
    "01": 1,
    "02": 3,
    "03": 6,
    "11": 10,
    "12": 20,
    "21": 50,
    "22": 100,
    "31": 200,
    "32": 250,
    "41": 500,
    "42": 1000,
    "51": 2000,
    "52": 5000,
    "53": 10000,
}

EI_FORME_CODES = {
    "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900",
}
HOLDING_FORME_CODES = {"5710", "6540", "6599"}
HOLDING_NAF_PREFIXES = ("64.20", "68.20", "70.10")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
