"""Shared persistent data paths for outreach Streamlit apps (Render disk / local)."""

from __future__ import annotations

import os

_APP_DIR = os.path.dirname(os.path.abspath(__file__))


def hercule_data_root() -> str:
    return os.environ.get("HERCULE_DATA_ROOT", "").strip()


def app_data_dir(app_name: str) -> str:
    root = hercule_data_root()
    if root:
        base = os.path.join(root, app_name)
    else:
        base = os.path.join(_APP_DIR, app_name)
    os.makedirs(base, exist_ok=True)
    return base


def scraper_output_base() -> str:
    return os.path.join(app_data_dir("streamlit_scraper"), "output")


def default_sirene_path() -> str:
    data_dir = os.path.join(app_data_dir("streamlit_scraper"), "data")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "sirene.db")


def clean_data_dir() -> str:
    data_dir = os.path.join(app_data_dir("streamlit_clean"), "data")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir
