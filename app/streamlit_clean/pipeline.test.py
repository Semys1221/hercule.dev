"""Unit tests for pipeline custom_variables merge."""

from __future__ import annotations

import pandas as pd

from pipeline import _merge_custom_variables, _read_row_custom_variables


def test_read_row_custom_variables_from_json_string() -> None:
    parsed = _read_row_custom_variables('{"foo": "bar"}')
    assert parsed == {"foo": "bar"}


def test_merge_custom_variables_preserves_existing_keys() -> None:
    row = pd.Series(
        {
            "email": "lead@example.com",
            "custom_variables": {"existing": "keep"},
        }
    )
    merged = _merge_custom_variables(
        row,
        {
            "lead@example.com": {
                "reservation_cif_link": "https://example.com/r",
                "statut": "NOTBOOKED",
            }
        },
        "email",
    )
    assert merged["existing"] == "keep"
    assert merged["reservation_cif_link"] == "https://example.com/r"
    assert merged["statut"] == "NOTBOOKED"
