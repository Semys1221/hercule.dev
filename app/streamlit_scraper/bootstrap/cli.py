"""Typer CLI for preset bootstrap."""

from __future__ import annotations

import typer

from bootstrap.discovery import discover_presets, invalidate_preset_cache
from bootstrap.prompts import confirm_and_create, run_create_wizard
from bootstrap.validators import validate_preset_runtime

app = typer.Typer(
    help="Bootstrap scraper preset configurations interactively.",
    no_args_is_help=True,
)


@app.command("create")
def create_cmd() -> None:
    """Interactive wizard to create a new preset config file."""
    data = run_create_wizard()
    confirm_and_create(data)


@app.command("list")
def list_cmd() -> None:
    """List discovered presets."""
    presets = discover_presets(use_cache=True)
    if not presets:
        typer.secho("No presets found.", fg=typer.colors.YELLOW)
        raise typer.Exit(code=0)

    typer.echo(f"{'ID':<28} {'LABEL':<40} {'TARGET':>8} {'KW':>4}  LIST_ID")
    typer.echo("-" * 100)
    for meta in presets.values():
        config = meta.loader()
        typer.echo(
            f"{meta.preset_id:<28} {meta.label:<40} "
            f"{int(config.get('TARGET_LEADS', 0)):>8,} "
            f"{len(config.get('KEYWORDS') or []):>4}  "
            f"{config.get('INSTANTLY_LIST_ID', '')}"
        )


@app.command("validate")
def validate_cmd(
    preset_id: str = typer.Argument(
        "",
        help="Preset to validate (default: all presets)",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Also run pipeline dry-run (query count check)",
    ),
) -> None:
    """Validate preset schema and loadability."""
    presets = discover_presets(use_cache=True)
    targets = [preset_id] if preset_id else sorted(presets.keys())

    if preset_id and preset_id not in presets:
        typer.secho(f"Unknown preset {preset_id!r}.", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    failed = False
    for pid in targets:
        result = validate_preset_runtime(pid, dry_run=dry_run)
        if result.ok and not result.warnings:
            typer.secho(f"OK  {pid}", fg=typer.colors.GREEN)
        elif result.ok:
            typer.secho(f"OK  {pid} (with warnings)", fg=typer.colors.YELLOW)
            for warn in result.warnings:
                typer.echo(f"    warn: {warn}")
        else:
            failed = True
            typer.secho(f"FAIL {pid}", fg=typer.colors.RED)
            for err in result.errors:
                typer.echo(f"    error: {err}")
            for warn in result.warnings:
                typer.echo(f"    warn: {warn}")

    if failed:
        raise typer.Exit(code=1)


@app.command("provision-instantly")
def provision_instantly_cmd(
    preset_id: str = typer.Argument(
        "",
        help="Preset to provision (default: all configs/ niches)",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Show what would be created without calling Instantly",
    ),
) -> None:
    """Create or reuse Instantly list + draft campaign for niche presets."""
    import os

    from bootstrap.provision import provision_preset, provision_targets
    from config_loader import load_config

    try:
        targets = provision_targets(preset_id)
    except KeyError:
        typer.secho(f"Unknown preset {preset_id!r}.", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    if not targets:
        typer.secho("No configs/ presets to provision.", fg=typer.colors.YELLOW)
        raise typer.Exit(code=0)

    api_key = ""
    if not dry_run:
        sample = load_config(targets[0], require_keys=False)
        api_key = str(sample.get("INSTANTLY_API_KEY") or os.getenv("INSTANTLY_API_KEY") or "").strip()
        if not api_key:
            typer.secho("INSTANTLY_API_KEY is required (set it in repo .env).", fg=typer.colors.RED)
            raise typer.Exit(code=1)

    failed = False
    for pid in targets:
        try:
            result = provision_preset(pid, api_key=api_key, dry_run=dry_run)
        except Exception as exc:
            failed = True
            typer.secho(f"FAIL {pid}: {exc}", fg=typer.colors.RED)
            continue

        status = "SKIP" if result.get("skipped") else ("DRY" if dry_run else "OK")
        color = typer.colors.YELLOW if status != "OK" else typer.colors.GREEN
        typer.secho(
            f"{status} {pid} — {result['name']} "
            f"list={result.get('list_id') or '(pending)'} "
            f"campaign={result.get('campaign_id') or '(pending)'}",
            fg=color,
        )

    if failed:
        raise typer.Exit(code=1)


@app.command("reload")
def reload_cmd() -> None:
    """Clear preset discovery cache (after manual config edits)."""
    invalidate_preset_cache()
    from config_loader import invalidate_preset_registry

    invalidate_preset_registry()
    typer.secho("Preset cache cleared.", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
