#!/usr/bin/env python3
"""Typer CLI — provision JUM leads from Instantly lists (restaurant / Terrassement / dentiste)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional

import typer
from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env")

if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from shared.instantly_client import InstantlyClient

app = typer.Typer(help="JUM niche link provisioning from Instantly lists.", no_args_is_help=True)

VALID_SEGMENTS = ("restaurant", "b2b", "dentiste")

# Mirrors lib/admin/niches/jum-verticals.ts (TEMP lists; Terrassement = BTP)
JUM_VERTICALS = [
    {
        "key": "restaurant",
        "label": "Restaurant",
        "segment": "restaurant",
        "list_id": "8ad641e7-3456-42df-9281-2c11f97df1c5",
        "campaign_id": "e4f11e76-717e-4be9-a6ad-c7f0a331afb7",
        "list_name": "TEMP - RESTAURANT",
        "campaign_name": "Hercule — Restaurants indépendants (France)",
        "calendly_url": "https://calendly.com/jum-advisory/rendez-vous-comptable-restaurant",
    },
    {
        "key": "btp",
        "label": "Terrassement / BTP",
        "segment": "b2b",
        "list_id": "ef52cbe1-e6cb-4076-85bc-55ead03cb4bd",
        "campaign_id": "05bc06f8-4f60-4e6c-bae1-7afe30df38c7",
        "list_name": "TEMP - TERRASSEMENT",
        "campaign_name": "Hercule — Terrassement / VRD (France)",
        "calendly_url": "https://calendly.com/jum-advisory/rendez-vous-comptable-btp",
    },
    {
        "key": "dentiste",
        "label": "Dentiste",
        "segment": "dentiste",
        "list_id": "c4eb10d7-2285-4fc3-aa06-3230d2498d8e",
        "campaign_id": "0f0b450a-e550-461c-96f6-1a7681678d67",
        "list_name": "TEMP - DENTISTE",
        "campaign_name": "Hercule — Chirurgiens-dentistes (France)",
        "calendly_url": "https://calendly.com/jum-advisory/rendez-vous-comptable-dentiste",
    },
]

VERTICAL_BY_LIST_ID = {row["list_id"]: row for row in JUM_VERTICALS}
VERTICAL_BY_KEY = {row["key"]: row for row in JUM_VERTICALS}


def _api_key() -> str:
    key = os.getenv("INSTANTLY_API_KEY", "").strip()
    if not key:
        typer.secho("INSTANTLY_API_KEY is not set.", fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1)
    return key


def _resolve_vertical(
    *,
    vertical: Optional[str] = None,
    list_id: Optional[str] = None,
) -> Optional[dict]:
    if vertical:
        return VERTICAL_BY_KEY.get(vertical.strip().lower())
    if list_id:
        return VERTICAL_BY_LIST_ID.get(list_id.strip())
    return None


@app.command("list-verticals")
def list_verticals_cmd() -> None:
    """Show JUM verticals (list + campaign + segment mapping)."""
    typer.echo(f"{'VERTICAL':<12} {'SEGMENT':<12} {'LIST ID':<38} {'CAMPAIGN ID'}")
    typer.echo("-" * 110)
    for row in JUM_VERTICALS:
        typer.echo(
            f"{row['key']:<12} {row['segment']:<12} {row['list_id']:<38} {row['campaign_id']}"
        )


@app.command("list-lists")
def list_lists_cmd() -> None:
    """List Instantly lead lists (JUM verticals highlighted)."""
    client = InstantlyClient(_api_key())
    lists = client.list_all_lead_lists()
    if not lists:
        typer.secho("No lead lists found.", fg=typer.colors.YELLOW)
        raise typer.Exit(code=0)

    typer.echo(f"{'NAME':<50} {'ID':<38} JUM")
    typer.echo("-" * 95)
    for row in lists:
        name = str(row.get("name") or "").strip()[:48]
        list_id = str(row.get("id") or "").strip()
        jum = VERTICAL_BY_LIST_ID.get(list_id, {}).get("key", "")
        typer.echo(f"{name:<50} {list_id:<38} {jum or '-'}")


def _run_provision(
    *,
    vertical: Optional[str] = None,
    list_id: Optional[str] = None,
    resync_all: bool = False,
    list_only: bool = False,
    segment: Optional[str] = None,
) -> None:
    resolved = _resolve_vertical(vertical=vertical, list_id=list_id)
    if not resolved and not list_id:
        typer.secho(
            "Unknown vertical or list — use list-verticals or pass --vertical=restaurant|btp|dentiste",
            fg=typer.colors.RED,
        )
        raise typer.Exit(code=1)

    effective_list_id = list_id or (resolved["list_id"] if resolved else None)
    effective_vertical = resolved["key"] if resolved else vertical
    effective_segment = segment or (resolved["segment"] if resolved else None)

    if effective_segment and effective_segment not in VALID_SEGMENTS:
        typer.secho(f"Invalid segment — choose: {', '.join(VALID_SEGMENTS)}", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    extra: list[str] = []
    if effective_vertical:
        extra.append(f"--vertical={effective_vertical}")
    elif effective_list_id:
        extra.append(f"--list-id={effective_list_id}")
    if effective_segment:
        extra.append(f"--segment={effective_segment}")
    if resync_all:
        extra.append("--resync-all")
    if list_only:
        extra.append("--list-only")

    args = ["pnpm", "provision-jum-links"]
    if extra:
        args.extend(["--", *extra])

    typer.secho(f"Running: {' '.join(args)}", fg=typer.colors.CYAN)
    result = subprocess.run(args, cwd=_REPO_ROOT, check=False)
    if result.returncode != 0:
        raise typer.Exit(code=result.returncode)


@app.command("provision-all")
def provision_all_cmd(
    resync_all: bool = typer.Option(False, "--resync-all", help="Re-provision all leads"),
    list_only: bool = typer.Option(False, "--list-only", help="Provision from lists only"),
) -> None:
    """Provision all three JUM verticals (restaurant, Terrassement/BTP, dentiste)."""
    args = ["pnpm", "provision-jum-links", "--", "--all"]
    if resync_all:
        args.append("--resync-all")
    if list_only:
        args.append("--list-only")
    typer.secho(f"Running: {' '.join(args)}", fg=typer.colors.CYAN)
    result = subprocess.run(args, cwd=_REPO_ROOT, check=False)
    if result.returncode != 0:
        raise typer.Exit(code=result.returncode)


@app.command("provision")
def provision_cmd(
    vertical: Optional[str] = typer.Option(
        None,
        "--vertical",
        help="JUM vertical: restaurant, btp (Terrassement), dentiste",
    ),
    list_id: Optional[str] = typer.Option(None, "--list-id", help="Instantly list UUID"),
    list_only: bool = typer.Option(False, "--list-only", help="Provision from list only"),
    resync_all: bool = typer.Option(False, "--resync-all", help="Re-provision all leads"),
    segment: Optional[str] = typer.Option(
        None,
        "--segment",
        help=f"Override segment (default from vertical): {', '.join(VALID_SEGMENTS)}",
    ),
) -> None:
    """Provision JUM tracking links for one vertical."""
    _run_provision(
        vertical=vertical,
        list_id=list_id,
        resync_all=resync_all,
        list_only=list_only,
        segment=segment,
    )


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    vertical: Optional[str] = typer.Option(None, "--vertical"),
    list_id: Optional[str] = typer.Option(None, "--list-id"),
    resync_all: bool = typer.Option(False, "--resync-all"),
    list_only: bool = typer.Option(False, "--list-only"),
    segment: Optional[str] = typer.Option(None, "--segment"),
) -> None:
    """Default: interactive JUM vertical selection then provision."""
    if ctx.invoked_subcommand is not None:
        return

    typer.echo("Select a JUM vertical:")
    for index, row in enumerate(JUM_VERTICALS, start=1):
        typer.echo(f"  {index}. {row['label']} — {row['list_name']}")

    choice = typer.prompt("Enter number", type=int)
    if choice < 1 or choice > len(JUM_VERTICALS):
        typer.secho("Invalid selection.", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    selected = JUM_VERTICALS[choice - 1]
    _run_provision(
        vertical=selected["key"],
        list_id=list_id,
        resync_all=resync_all,
        list_only=list_only,
        segment=segment,
    )


if __name__ == "__main__":
    app()
