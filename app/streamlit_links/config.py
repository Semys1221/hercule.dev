"""Environment for link-tracking Streamlit tool."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
_APP_DIR = Path(__file__).resolve().parent
_CRM_ENV = _REPO_ROOT / "crm" / ".env"
_ROOT_ENV = _REPO_ROOT / ".env"
_LOCAL_ENV = _APP_DIR / ".env"

for env_path in (_ROOT_ENV, _CRM_ENV, _LOCAL_ENV):
    if env_path.is_file():
        load_dotenv(env_path, override=env_path in (_CRM_ENV, _LOCAL_ENV))


def env(name: str, default: str = "") -> str:
    value = os.getenv(name, default).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        return value[1:-1].strip()
    return value


def env_source_label() -> str:
    if _LOCAL_ENV.is_file():
        return str(_LOCAL_ENV)
    if _CRM_ENV.is_file():
        return str(_CRM_ENV)
    if _ROOT_ENV.is_file():
        return str(_ROOT_ENV)
    return "process env"
