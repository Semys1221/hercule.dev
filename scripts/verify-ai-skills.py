#!/usr/bin/env python3
"""Verify Hercule AI skills and Cursor rules enforcement structure."""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]

STREAMLIT_SKILL_COUNT = 9
NEXTJS_SKILL_COUNT = 8
MAX_SKILL_LINES = 500

SECRET_PATTERNS = [
    re.compile(r"sk_live_[a-zA-Z0-9]+"),
    re.compile(r"sk_test_[a-zA-Z0-9]+"),
    re.compile(r"\bre_[a-zA-Z0-9]{20,}\b"),
    re.compile(r"eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+"),
]

# Paths used for spot-check simulation (mirrors manual Cursor verification plan)
SPOT_CHECKS = [
    {
        "id": "nextjs-internal",
        "path": "app/internal/(app-shell)/clients/page.tsx",
        "expect_streamlit_rule": False,
        "expect_nextjs_rule": True,
        "expect_skill": "hercule-nextjs-internal",
        "expect_not_skill": "scrapping",
        "content_question": "internal admin uses .internal tokens",
        "content_must_contain": ["hercule-nextjs-internal", "verifyAdminRequest"],
        "content_file": ".cursor/skills/hercule-nextjs-internal/SKILL.md",
    },
    {
        "id": "streamlit-scraper",
        "path": "app/streamlit_scraper/core_logic.py",
        "expect_streamlit_rule": True,
        "expect_nextjs_rule": False,
        "expect_skill": "hercule-streamlit-scraper",
        "expect_not_skill": "scrapping",
        "content_question": "streamlit scraper pipeline",
        "content_must_contain": ["hercule-streamlit-scraper", "Do not"],
        "content_file": ".cursor/skills/hercule-streamlit-scraper/SKILL.md",
    },
    {
        "id": "communication-orchestrator",
        "path": "lib/booking-communication/orchestrator.ts",
        "expect_streamlit_rule": False,
        "expect_nextjs_rule": True,
        "expect_skill": "hercule-nextjs-communication",
        "content_must_contain": ["CRON_SECRET", "webhook"],
        "content_file": ".cursor/skills/hercule-nextjs-communication/SKILL.md",
    },
    {
        "id": "marketing-home",
        "path": "app/page.tsx",
        "expect_streamlit_rule": False,
        "expect_nextjs_rule": True,
        "expect_skill": "hercule-nextjs-marketing",
        "content_must_contain": ["Do not", "inline", "#09090B"],
        "content_file": ".cursor/skills/hercule-nextjs-marketing/SKILL.md",
    },
]

NEXTJS_GLOB_PREFIXES = (
    "app/api/",
    "app/internal/",
    "app/dashboard/",
    "app/survey/",
    "app/",
    "components/",
    "lib/",
    "emails/",
    "content/",
)

STREAMLIT_READMES = list((ROOT / "app").glob("streamlit_*/README.md"))
NEXTJS_DOC_POINTERS = [
    ROOT / "README.md",
    ROOT / "doc/README.md",
    ROOT / "app/internal/README.md",
    ROOT / "app/crm/doc.md",
    ROOT / "app/dashboard/README.md",
    ROOT / "lib/booking-communication/README.md",
    ROOT / "components/internal/funnels/sales/README.md",
]


def parse_frontmatter(text: str) -> dict | None:
    if not text.startswith("---"):
        return None
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return None
    if yaml is None:
        # Minimal parse without PyYAML
        result: dict[str, str] = {}
        for line in match.group(1).splitlines():
            if ":" in line:
                key, val = line.split(":", 1)
                result[key.strip()] = val.strip().strip('"')
        return result
    return yaml.safe_load(match.group(1))


def matches_streamlit_rule(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized.startswith("app/streamlit_")


def matches_nextjs_rule(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized.startswith("app/streamlit_"):
        return False
    return any(normalized.startswith(prefix) for prefix in NEXTJS_GLOB_PREFIXES)


def check_rules(errors: list[str]) -> None:
    streamlit_rule = ROOT / ".cursor/rules/streamlit-tools.mdc"
    nextjs_rule = ROOT / ".cursor/rules/nextjs-hercule.mdc"

    if not streamlit_rule.is_file():
        errors.append("Missing .cursor/rules/streamlit-tools.mdc")
    else:
        text = streamlit_rule.read_text()
        if "app/streamlit_" not in text:
            errors.append("streamlit-tools.mdc: missing streamlit glob")
        for token in ("hercule-streamlit", "scrapping", "smartlead"):
            if token not in text:
                errors.append(f"streamlit-tools.mdc: missing {token!r}")

    if not nextjs_rule.is_file():
        errors.append("Missing .cursor/rules/nextjs-hercule.mdc")
    else:
        text = nextjs_rule.read_text()
        if "app/**" in text and "streamlit" not in text.lower():
            errors.append(
                "nextjs-hercule.mdc: broad app/** glob still present without streamlit exclusion"
            )
        for token in ("hercule-nextjs", "CRON_SECRET", "streamlit"):
            if token not in text:
                errors.append(f"nextjs-hercule.mdc: missing {token!r}")


def check_skills(errors: list[str], warnings: list[str]) -> None:
    streamlit_skills = sorted((ROOT / ".cursor/skills").glob("hercule-streamlit*/SKILL.md"))
    nextjs_skills = sorted((ROOT / ".cursor/skills").glob("hercule-nextjs*/SKILL.md"))

    if len(streamlit_skills) != STREAMLIT_SKILL_COUNT:
        errors.append(f"Expected {STREAMLIT_SKILL_COUNT} streamlit skills, got {len(streamlit_skills)}")
    if len(nextjs_skills) != NEXTJS_SKILL_COUNT:
        errors.append(f"Expected {NEXTJS_SKILL_COUNT} nextjs skills, got {len(nextjs_skills)}")

    for skill_path in streamlit_skills + nextjs_skills:
        text = skill_path.read_text()
        lines = len(text.splitlines())
        if lines > MAX_SKILL_LINES:
            errors.append(f"{skill_path.relative_to(ROOT)}: {lines} lines exceeds {MAX_SKILL_LINES}")

        fm = parse_frontmatter(text)
        if not fm or not fm.get("name") or not fm.get("description"):
            errors.append(f"{skill_path.relative_to(ROOT)}: invalid frontmatter")
        elif len(str(fm.get("description", ""))) < 80:
            warnings.append(f"{skill_path.relative_to(ROOT)}: short description")

        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(
                    f"{skill_path.relative_to(ROOT)}: possible secret ({pattern.pattern})"
                )

    clean_skill = ROOT / ".cursor/skills/hercule-streamlit-clean/SKILL.md"
    if clean_skill.is_file() and "myemailverifier" not in clean_skill.read_text():
        errors.append("hercule-streamlit-clean: missing myemailverifier reference")


def check_readmes(errors: list[str]) -> None:
    for readme in STREAMLIT_READMES:
        text = readme.read_text()
        if "## AI agents" not in text:
            errors.append(f"{readme.relative_to(ROOT)}: missing ## AI agents")
        if "streamlit-tools.mdc" not in text:
            errors.append(f"{readme.relative_to(ROOT)}: missing streamlit-tools.mdc link")

    for doc in NEXTJS_DOC_POINTERS:
        if not doc.is_file():
            errors.append(f"Missing doc pointer file: {doc.relative_to(ROOT)}")
            continue
        text = doc.read_text()
        if "hercule-nextjs" not in text and "nextjs-hercule" not in text:
            errors.append(f"{doc.relative_to(ROOT)}: missing hercule-nextjs / nextjs-hercule reference")


def check_ai_agent_links(errors: list[str], warnings: list[str]) -> None:
    """Resolve relative links in ## AI agents sections of streamlit READMEs."""
    for readme in STREAMLIT_READMES:
        base = readme.parent
        for match in re.finditer(r"\]\(([^)]+)\)", readme.read_text()):
            link = match.group(1)
            if link.startswith(("http", "#", "mailto:")):
                continue
            target = (base / link).resolve()
            if not target.exists():
                warnings.append(
                    f"{readme.relative_to(ROOT)}: broken link {link} -> {target}"
                )


def run_spot_checks(errors: list[str]) -> None:
    print("\n--- Spot checks (glob + skill content) ---")
    for check in SPOT_CHECKS:
        path = check["path"]
        st = matches_streamlit_rule(path)
        nx = matches_nextjs_rule(path)
        ok = True

        if st != check["expect_streamlit_rule"]:
            errors.append(
                f"Spot {check['id']}: {path} streamlit rule={st}, expected {check['expect_streamlit_rule']}"
            )
            ok = False
        if nx != check.get("expect_nextjs_rule", True):
            errors.append(
                f"Spot {check['id']}: {path} nextjs rule={nx}, expected {check.get('expect_nextjs_rule')}"
            )
            ok = False

        skill_file = ROOT / check["content_file"]
        if skill_file.is_file():
            skill_text = skill_file.read_text()
            if check.get("expect_skill") and check["expect_skill"] not in skill_text:
                errors.append(f"Spot {check['id']}: skill file missing {check['expect_skill']}")
                ok = False
            for token in check.get("content_must_contain", []):
                if token not in skill_text:
                    errors.append(f"Spot {check['id']}: skill missing content {token!r}")
                    ok = False
            not_skill = check.get("expect_not_skill")
            if not_skill and f"personal `{not_skill}`" not in skill_text and not_skill not in skill_text:
                # scraper skill says "Do not" use scrapping - check ban exists in rule or skill
                rule_or_skill = (ROOT / ".cursor/rules/streamlit-tools.mdc").read_text()
                if not_skill not in rule_or_skill and not_skill not in skill_text:
                    errors.append(f"Spot {check['id']}: missing ban on {not_skill}")
                    ok = False

        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {check['id']}: {path}")


def check_frontend_audit(errors: list[str]) -> None:
    readme = ROOT / "app/react_doctor/README.md"
    cli = ROOT / "app/react_doctor/cli.ts"
    skill = ROOT / ".cursor/skills/hercule-frontend-audit/SKILL.md"

    for path in (readme, cli, skill):
        if not path.is_file():
            errors.append(f"Missing frontend audit file: {path.relative_to(ROOT)}")

    pkg = ROOT / "package.json"
    if pkg.is_file():
        text = pkg.read_text()
        if '"frontend-audit"' not in text:
            errors.append("package.json: missing frontend-audit script")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    print("Verifying Hercule AI skills enforcement...")
    check_rules(errors)
    check_skills(errors, warnings)
    check_readmes(errors)
    check_frontend_audit(errors)
    check_ai_agent_links(errors, warnings)
    run_spot_checks(errors)

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  WARN: {w}")

    if errors:
        print("\nFailures:")
        for e in errors:
            print(f"  FAIL: {e}")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
