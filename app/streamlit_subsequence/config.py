"""Environment for Instantly subsequence bypass Streamlit tool."""

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


def require_instantly_api_key() -> str:
    key = env("INSTANTLY_API_KEY")
    if not key:
        raise ValueError("INSTANTLY_API_KEY is not set")
    return key


def webhook_public_url() -> str:
    base = env("NEXT_PUBLIC_APP_URL", "https://www.hercule.dev").rstrip("/")
    return f"{base}/api/webhooks/instantly"


def webhook_secret() -> str:
    return env("INSTANTLY_BYPASS_WEBHOOK_SECRET") or env("CRON_SECRET")


def supabase_url() -> str:
    return env("SUPABASE_URL") or env("NEXT_PUBLIC_SUPABASE_URL")


def supabase_service_role_key() -> str:
    return env("SUPABASE_SERVICE_ROLE_KEY")


def waiting_for_reply_interest_value() -> int | None:
    raw = env("INSTANTLY_WAITING_FOR_REPLY_INTEREST_VALUE")
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def no_reply_email2_delay_days() -> int:
    raw = env("INSTANTLY_NO_REPLY_EMAIL2_DELAY_DAYS", "3")
    try:
        parsed = int(raw)
        return parsed if parsed > 0 else 3
    except ValueError:
        return 3
