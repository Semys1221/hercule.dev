"""Persistent data directory for streamlit_filter artifacts."""

from __future__ import annotations

import os
import sys

_LIB_DIR = os.path.dirname(os.path.abspath(__file__))
_APP_DIR = os.path.dirname(_LIB_DIR)
if _APP_DIR not in sys.path:
    sys.path.insert(0, _APP_DIR)
from outreach_data import app_data_dir  # noqa: E402


def data_dir() -> str:
    path = os.path.join(app_data_dir("streamlit_filter"), "data")
    os.makedirs(path, exist_ok=True)
    return path


def output_dir() -> str:
    path = os.path.join(data_dir(), "filter_output")
    os.makedirs(path, exist_ok=True)
    return path
