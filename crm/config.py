"""Environment configuration for link tracking Streamlit tool."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[1]
_CRM_DIR = Path(__file__).resolve().parent
_LOCAL_ENV = _CRM_DIR / ".env"
_ROOT_ENV = _REPO_ROOT / ".env"

# Load env files explicitly (crm/.env overrides repo root .env)
for env_path in (_ROOT_ENV, _LOCAL_ENV):
    if env_path.is_file():
        load_dotenv(env_path, override=env_path == _LOCAL_ENV)


def _env(name: str) -> str:
    """Read env var with optional surrounding quotes stripped."""
    value = os.getenv(name, "").strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        return value[1:-1].strip()
    return value


_env_files = tuple(
    str(p) for p in (_ROOT_ENV, _LOCAL_ENV) if p.is_file()
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore",
        env_file=_env_files or None,
        env_file_encoding="utf-8",
    )

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    instantly_api_key: str = ""
    tracking_base_url_agence: str = "https://www.hercule.dev/reservation.html"
    tracking_base_url_entreprise: str = (
        "https://www.hercule.dev/reservation-entreprise.html"
    )
    crm_backend_url: str = "http://localhost:3000"
    link_tracking_webhook_secret: str = ""
    instantly_campaign_id_agence: str = ""
    instantly_campaign_id_entreprise: str = ""

    def model_post_init(self, __context: object) -> None:
        if not self.supabase_url:
            self.supabase_url = _env("SUPABASE_URL") or _env("NEXT_PUBLIC_SUPABASE_URL")
        if not self.supabase_service_role_key:
            self.supabase_service_role_key = _env("SUPABASE_SERVICE_ROLE_KEY")
        if not self.instantly_api_key:
            self.instantly_api_key = _env("INSTANTLY_API_KEY")
        if _env("TRACKING_BASE_URL_AGENCE"):
            self.tracking_base_url_agence = _env("TRACKING_BASE_URL_AGENCE").rstrip("/")
        elif _env("TRACKING_BASE_URL"):
            self.tracking_base_url_agence = _env("TRACKING_BASE_URL").rstrip("/")
        if _env("TRACKING_BASE_URL_ENTREPRISE"):
            self.tracking_base_url_entreprise = _env(
                "TRACKING_BASE_URL_ENTREPRISE"
            ).rstrip("/")
        self.crm_backend_url = (
            _env("CRM_BACKEND_URL")
            or _env("NEXT_PUBLIC_APP_URL")
            or "http://localhost:3000"
        ).rstrip("/")
        self.link_tracking_webhook_secret = (
            _env("LINK_TRACKING_WEBHOOK_SECRET") or _env("CRON_SECRET")
        )
        self.instantly_campaign_id_agence = _env("INSTANTLY_CAMPAIGN_ID_AGENCE")
        self.instantly_campaign_id_entreprise = _env("INSTANTLY_CAMPAIGN_ID_ENTREPRISE")


settings = Settings()


def env_source_label() -> str:
    if _LOCAL_ENV.is_file():
        return str(_LOCAL_ENV)
    if _ROOT_ENV.is_file():
        return str(_ROOT_ENV)
    return "(aucun fichier .env trouvé)"


def tracking_base_url_for(category: str) -> str:
    if category == "entreprise":
        return settings.tracking_base_url_entreprise.rstrip("/")
    return settings.tracking_base_url_agence.rstrip("/")


def require_supabase() -> tuple[str, str]:
    url = settings.supabase_url.strip()
    key = settings.supabase_service_role_key.strip()
    if not url or not key:
        raise RuntimeError(
            f"Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and "
            f"SUPABASE_SERVICE_ROLE_KEY in {env_source_label()}"
        )
    return url, key


def require_instantly_key() -> str:
    key = settings.instantly_api_key.strip()
    if not key:
        raise RuntimeError(f"Set INSTANTLY_API_KEY in {env_source_label()}")
    return key


def crm_backend_headers() -> dict[str, str]:
    secret = settings.link_tracking_webhook_secret
    if not secret:
        raise RuntimeError(
            f"Set LINK_TRACKING_WEBHOOK_SECRET or CRON_SECRET in {env_source_label()}"
        )
    return {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json",
    }
