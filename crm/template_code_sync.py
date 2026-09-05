"""Sync booking email template defaults into coded source files."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Literal

LeadCategory = Literal["agence", "entreprise"]

REPO_ROOT = Path(__file__).resolve().parents[1]
PYTHON_DEFAULTS_PATH = REPO_ROOT / "crm" / "booking_templates.py"
TS_DEFAULTS_PATH = REPO_ROOT / "lib" / "booking-communication" / "templates.ts"

ENTREPRISE_OVERRIDE_TYPES = frozenset({"h48_confirm", "h24_relance"})
TS_ENTREPRISE_BODY_CONSTS = {
    "h48_confirm": "ENTREPRISE_H48_BODY",
    "h24_relance": "ENTREPRISE_H24_BODY",
}


def _uses_entreprise_override(category: LeadCategory, email_type: str) -> bool:
    return category == "entreprise" and email_type in ENTREPRISE_OVERRIDE_TYPES


def _escape_py_double(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _escape_py_triple(value: str) -> str:
    if '"""' in value:
        raise ValueError("Body cannot contain triple double-quotes")
    return value


def _escape_ts_backtick(value: str) -> str:
    return value.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def _patch_python_dict_entry(
    content: str,
    *,
    section_marker: str,
    key: str,
    subject: str,
    body: str,
) -> str:
    pattern = re.compile(
        rf'({section_marker}[\s\S]*?"{re.escape(key)}":\s*\{{\s*"subject":\s*")'
        rf'([^"]*)(",\s*"body":\s*)(""")(.*?)("""\s*,\s*\}})',
        re.DOTALL,
    )

    def repl(match: re.Match[str]) -> str:
        return (
            f"{match.group(1)}{_escape_py_double(subject)}{match.group(3)}"
            f'{match.group(4)}{_escape_py_triple(body)}{match.group(6)}'
        )

    new_content, count = pattern.subn(repl, content, count=1)
    if count != 1:
        raise ValueError(f"Could not find Python template block for {key} in {section_marker}")
    return new_content


def _patch_ts_object_entry(content: str, key: str, subject: str, body: str) -> str:
    pattern = re.compile(
        rf"(DEFAULT_BOOKING_EMAIL_TEMPLATES[\s\S]*?{re.escape(key)}:\s*\{{\s*subject:\s*\")"
        rf'([^"]*)(",\s*body:\s*`)(.*?)(`,\s*\n?\s*\}},?)',
        re.DOTALL,
    )

    def repl(match: re.Match[str]) -> str:
        return (
            f"{match.group(1)}{_escape_ts_backtick(subject)}{match.group(3)}"
            f"{_escape_ts_backtick(body)}{match.group(5)}"
        )

    new_content, count = pattern.subn(repl, content, count=1)
    if count != 1:
        raise ValueError(f"Could not find TypeScript template block for {key}")
    return new_content


def _patch_ts_const_backtick(content: str, const_name: str, body: str) -> str:
    pattern = re.compile(rf"(const {const_name} = `)(.*?)(`;)", re.DOTALL)

    def repl(match: re.Match[str]) -> str:
        return f"{match.group(1)}{_escape_ts_backtick(body)}{match.group(3)}"

    new_content, count = pattern.subn(repl, content, count=1)
    if count != 1:
        raise ValueError(f"Could not find TypeScript constant {const_name}")
    return new_content


def _patch_ts_override_subject(content: str, email_type: str, subject: str) -> str:
    pattern = re.compile(
        rf"(ENTREPRISE_BOOKING_EMAIL_TEMPLATE_OVERRIDES[\s\S]*?"
        rf"{re.escape(email_type)}:\s*\{{\s*subject:\s*\")"
        rf'([^"]*)(")',
        re.DOTALL,
    )

    def repl(match: re.Match[str]) -> str:
        return f"{match.group(1)}{_escape_ts_backtick(subject)}{match.group(3)}"

    new_content, count = pattern.subn(repl, content, count=1)
    if count != 1:
        raise ValueError(f"Could not find TypeScript override subject for {email_type}")
    return new_content


def sync_coded_defaults(
    category: LeadCategory,
    email_type: str,
    subject: str,
    body: str,
    *,
    python_path: Path | None = None,
    typescript_path: Path | None = None,
) -> dict[str, Any]:
    """Update coded defaults in booking_templates.py and templates.ts."""
    errors: list[str] = []
    python_ok = False
    typescript_ok = False

    py_file = python_path or PYTHON_DEFAULTS_PATH
    ts_file = typescript_path or TS_DEFAULTS_PATH

    try:
        py_content = py_file.read_text(encoding="utf-8")
        if _uses_entreprise_override(category, email_type):
            py_content = _patch_python_dict_entry(
                py_content,
                section_marker="ENTREPRISE_TEMPLATE_OVERRIDES",
                key=email_type,
                subject=subject,
                body=body,
            )
        else:
            py_content = _patch_python_dict_entry(
                py_content,
                section_marker="DEFAULT_TEMPLATES",
                key=email_type,
                subject=subject,
                body=body,
            )
        py_file.write_text(py_content, encoding="utf-8")
        python_ok = True
    except Exception as exc:
        errors.append(f"python: {exc}")

    try:
        ts_content = ts_file.read_text(encoding="utf-8")
        if _uses_entreprise_override(category, email_type):
            const_name = TS_ENTREPRISE_BODY_CONSTS[email_type]
            ts_content = _patch_ts_const_backtick(ts_content, const_name, body)
            ts_content = _patch_ts_override_subject(ts_content, email_type, subject)
        else:
            ts_content = _patch_ts_object_entry(ts_content, email_type, subject, body)
        ts_file.write_text(ts_content, encoding="utf-8")
        typescript_ok = True
    except Exception as exc:
        errors.append(f"typescript: {exc}")

    return {"python": python_ok, "typescript": typescript_ok, "errors": errors}
