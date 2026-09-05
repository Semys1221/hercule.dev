"""Unit tests for profile_builder."""

from __future__ import annotations

import sys
from pathlib import Path

_APP_DIR = Path(__file__).resolve().parent.parent
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from fiches.profile_builder import build_default_profile


def test_agence_profile_shape() -> None:
    profile = build_default_profile(
        {"besoin": "Site web", "droit_retractation": True},
        "agence",
    )
    assert profile["form"]["besoin"] == "Site web"
    assert profile["communication"]["delays"]["retraction_days"] == 4
    assert profile["match"]["active_rdv"] is False
    assert len(profile["display"]["timeline"]) == 4


def test_entreprise_profile_shape() -> None:
    profile = build_default_profile({"besoin": "Refonte"}, "entreprise")
    assert profile["communication"]["delays"]["retraction_days"] == 0
    assert profile["display"]["timeline"][0]["label"] == "Qualification de votre besoin"


if __name__ == "__main__":
    test_agence_profile_shape()
    test_entreprise_profile_shape()
    print("profile_builder.test.py: ok")
