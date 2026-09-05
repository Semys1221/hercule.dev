"""Environment for streamlit_funnels."""

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


def supabase_url() -> str:
    return env("SUPABASE_URL") or env("NEXT_PUBLIC_SUPABASE_URL")


def supabase_service_role_key() -> str:
    return env("SUPABASE_SERVICE_ROLE_KEY")
