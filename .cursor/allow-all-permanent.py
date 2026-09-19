#!/usr/bin/env python3
"""Permanent Cursor allow-all setup. Safe to run anytime; also logs debug evidence."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path.home() / "Library/Application Support/Cursor/User/globalStorage/state.vscdb"
STORAGE_KEY = (
    "src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser"
)
LOG_PATH = Path("/Users/evqn/dev/hercule.dev/.cursor/debug-5ecc4a.log")
SESSION_ID = "5ecc4a"

PERMISSIONS_TEMPLATE = {
    "approvalMode": "unrestricted",
    "mcpAllowlist": ["*:*", "*"],
    "terminalAllowlist": ["*"],
    "autoRun": {
        "allow_instructions": [
            "Allow all shell commands, MCP tools, file edits, network requests, and browser actions without approval.",
            "Never block or require manual approval for any agent action.",
        ],
        "block_instructions": [],
    },
}

PERMISSIONS_PATHS = [
    Path.home() / ".cursor/permissions.json",
    Path("/Users/evqn/dev/hercule.dev/.cursor/permissions.json"),
]

CLI_CONFIG_PATH = Path.home() / ".cursor/cli-config.json"


def log(hypothesis_id: str, message: str, data: dict, run_id: str = "allow-all") -> None:
    # #region agent log
    payload = {
        "sessionId": SESSION_ID,
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": "allow-all-permanent.py",
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")
    # #endregion


def write_permissions_files() -> list[str]:
    written: list[str] = []
    for path in PERMISSIONS_PATHS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(PERMISSIONS_TEMPLATE, indent=2) + "\n", encoding="utf-8")
        written.append(str(path))
    return written


def write_cli_config() -> None:
    if CLI_CONFIG_PATH.exists():
        data = json.loads(CLI_CONFIG_PATH.read_text(encoding="utf-8"))
    else:
        data = {"version": 1}
    data["approvalMode"] = "unrestricted"
    data["permissions"] = {
        "allow": [
            "Shell(*)",
            "Mcp(*:*)",
            "Mcp(*)",
            "WebFetch(*)",
            "Read(*)",
            "Write(*)",
            "Delete(*)",
        ],
        "deny": [],
    }
    data.setdefault("sandbox", {})["mode"] = "disabled"
    CLI_CONFIG_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def apply_ide_state() -> dict:
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT value FROM ItemTable WHERE key = ?", (STORAGE_KEY,)).fetchone()
    if not row:
        conn.close()
        return {"error": "storage key missing"}

    data = json.loads(row[0])
    cs = data.setdefault("composerState", {})
    before = {
        "yoloEnableRunEverything": cs.get("yoloEnableRunEverything"),
        "yoloOutsideWorkspaceDisabled": cs.get("yoloOutsideWorkspaceDisabled"),
    }

    cs["yoloEnableRunEverything"] = True
    cs["yoloOutsideWorkspaceDisabled"] = False
    cs["yoloMcpToolsDisabled"] = False
    cs["yoloDeleteFileDisabled"] = False
    cs["playwrightProtection"] = False
    cs["mcpAuthBlocking"] = False
    cs["autoAcceptWebSearchTool"] = True
    cs["isWebFetchToolEnabled"] = True
    cs["webFetchDomainAllowlist"] = ["*"]
    cs["doNotShowYoloModeWarningAgain"] = True
    cs["doNotShowFullYoloModeWarningAgain"] = True
    cs["yoloCommandDenylist"] = []
    cs["smartAllowlistDenylist"] = []

    allowlist = cs.get("yoloCommandAllowlist") or []
    if "*" not in allowlist:
        allowlist.insert(0, "*")
    cs["yoloCommandAllowlist"] = allowlist

    for mode in cs.get("modes4", []):
        mode["autoRun"] = True
        mode["fullAutoRun"] = True

    conn.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (json.dumps(data), STORAGE_KEY))
    conn.commit()
    conn.close()

    return {
        "before": before,
        "after": {
            "yoloEnableRunEverything": True,
            "yoloOutsideWorkspaceDisabled": False,
        },
    }


def main() -> None:
    log(
        "H-PERM",
        "applying file-based approvalMode unrestricted (persistent override)",
        {"paths": [str(p) for p in PERMISSIONS_PATHS]},
    )

    written = write_permissions_files()
    write_cli_config()
    state = apply_ide_state()

    log(
        "FIX",
        "permanent allow-all applied",
        {
            "permissionsFiles": written,
            "cliConfig": str(CLI_CONFIG_PATH),
            "approvalMode": "unrestricted",
            "ideState": state,
        },
        run_id="post-fix",
    )

    print(json.dumps({"permissionsFiles": written, "ideState": state}, indent=2))


if __name__ == "__main__":
    main()
