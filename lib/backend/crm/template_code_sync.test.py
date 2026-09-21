"""Smoke tests for template_code_sync patching."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from template_code_sync import (
    PYTHON_DEFAULTS_PATH,
    TS_DEFAULTS_PATH,
    _patch_python_dict_entry,
    _patch_ts_const_backtick,
    _patch_ts_object_entry,
    _patch_ts_override_subject,
    sync_coded_defaults,
)


class TemplateCodeSyncTests(unittest.TestCase):
    def test_patch_python_default_block(self) -> None:
        sample = '''
DEFAULT_TEMPLATES = {
    "h48_confirm": {
        "subject": "Old subject",
        "body": """Old body""",
    },
}
'''
        updated = _patch_python_dict_entry(
            sample,
            section_marker="DEFAULT_TEMPLATES",
            key="h48_confirm",
            subject="New subject",
            body="New body line 1\nNew body line 2",
        )
        self.assertIn('"subject": "New subject"', updated)
        self.assertIn('body": """New body line 1\nNew body line 2"""', updated)
        self.assertNotIn("Old subject", updated)

    def test_patch_ts_default_block(self) -> None:
        sample = """
export const DEFAULT_BOOKING_EMAIL_TEMPLATES = {
  h48_confirm: {
    subject: "Old subject",
    body: `Old body`,
  },
};
"""
        updated = _patch_ts_object_entry(
            sample,
            "h48_confirm",
            "New subject",
            "New body",
        )
        self.assertIn('subject: "New subject"', updated)
        self.assertIn("body: `New body`", updated)
        self.assertNotIn("Old subject", updated)

    def test_patch_ts_entreprise_const_and_override(self) -> None:
        sample = """
const ENTREPRISE_H48_BODY = `Old body`;

export const ENTREPRISE_BOOKING_EMAIL_TEMPLATE_OVERRIDES = {
  h48_confirm: {
    subject: "Old subject",
    body: ENTREPRISE_H48_BODY,
  },
};
"""
        updated = _patch_ts_const_backtick(sample, "ENTREPRISE_H48_BODY", "New body")
        updated = _patch_ts_override_subject(updated, "h48_confirm", "New subject")
        self.assertIn("const ENTREPRISE_H48_BODY = `New body`;", updated)
        self.assertIn('subject: "New subject"', updated)

    def test_sync_coded_defaults_on_temp_copies(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            py_copy = Path(tmpdir) / "booking_templates.py"
            ts_copy = Path(tmpdir) / "templates.ts"
            shutil.copy(PYTHON_DEFAULTS_PATH, py_copy)
            shutil.copy(TS_DEFAULTS_PATH, ts_copy)

            marker = "SYNC_TEST_MARKER_UNIQUE"
            result = sync_coded_defaults(
                "agence",
                "h48_confirm",
                "Subject sync test",
                f"{{{{firstNameLine}}}}\n\n{marker}",
                python_path=py_copy,
                typescript_path=ts_copy,
            )

            self.assertTrue(result["python"], result["errors"])
            self.assertTrue(result["typescript"], result["errors"])
            self.assertIn(marker, py_copy.read_text(encoding="utf-8"))
            self.assertIn(marker, ts_copy.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
