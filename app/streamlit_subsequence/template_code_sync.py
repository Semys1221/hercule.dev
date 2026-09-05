"""Sync Instantly bypass bootstrap defaults into coded source files."""

from __future__ import annotations

import re
from pathlib import Path

DEFAULT_TEMPLATES_PATH = Path(__file__).resolve().parent / "default_templates.py"


def sync_e1_bootstrap_default(
    body_html: str,
    *,
    path: Path | None = None,
) -> None:
    if '"""' in body_html:
        raise ValueError("Body cannot contain triple double-quotes")

    target = path or DEFAULT_TEMPLATES_PATH
    content = target.read_text(encoding="utf-8")
    pattern = re.compile(r"DEFAULT_E1_BODY_HTML = \([\s\S]*?\)\n")
    replacement = f'DEFAULT_E1_BODY_HTML = """{body_html}"""\n'
    new_content, count = pattern.subn(replacement, content, count=1)
    if count != 1:
        raise ValueError("Could not find DEFAULT_E1_BODY_HTML in default_templates.py")
    target.write_text(new_content, encoding="utf-8")
