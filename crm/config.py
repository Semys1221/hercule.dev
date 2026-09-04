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
    confirm_base_url: str = "https://www.hercule.dev/confirm-reservation.html"
    temporary_base_url: str = "https://www.hercule.dev/temporary-reservation.html"
    crm_backend_url: str = "http://localhost:3000"
    link_tracking_webhook_secret: str = ""
    instantly_campaign_id_agence: str = ""
    instantly_campaign_id_entreprise: str = ""
    instantly_patch_concurrency: int = 8
    supabase_insert_batch_size: int = 100
    supabase_batch_max_retries: int = 4

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
        if _env("BOOKING_CONFIRM_BASE_URL"):
            self.confirm_base_url = _env("BOOKING_CONFIRM_BASE_URL").rstrip("/")
        if _env("BOOKING_TEMPORARY_BASE_URL"):
            self.temporary_base_url = _env("BOOKING_TEMPORARY_BASE_URL").rstrip("/")
        raw_concurrency = _env("INSTANTLY_PATCH_CONCURRENCY")
        if raw_concurrency:
            try:
                parsed = int(raw_concurrency)
                self.instantly_patch_concurrency = max(1, min(parsed, 16))
            except ValueError:
                pass
        raw_batch_size = _env("SUPABASE_INSERT_BATCH_SIZE")
        if raw_batch_size:
            try:
                self.supabase_insert_batch_size = max(1, min(int(raw_batch_size), 200))
            except ValueError:
                pass
        raw_retries = _env("SUPABASE_BATCH_MAX_RETRIES")
        if raw_retries:
            try:
                self.supabase_batch_max_retries = max(1, min(int(raw_retries), 10))
            except ValueError:
                pass


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


def confirm_base_url_for(category: str) -> str:
    if category == "entreprise":
        return settings.confirm_base_url.rstrip("/")
    return settings.confirm_base_url.rstrip("/")


def temporary_base_url_for(category: str) -> str:
    if category == "entreprise":
        return settings.temporary_base_url.rstrip("/")
    return settings.temporary_base_url.rstrip("/")


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


def instantly_patch_concurrency() -> int:
    return max(1, min(settings.instantly_patch_concurrency, 16))


def supabase_insert_batch_size(row_count: int) -> int:
    configured = max(1, min(settings.supabase_insert_batch_size, 200))
    if row_count > 1000 and configured > 50:
        return 50
    return configured


def supabase_batch_max_retries() -> int:
    return max(1, min(settings.supabase_batch_max_retries, 10))


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
