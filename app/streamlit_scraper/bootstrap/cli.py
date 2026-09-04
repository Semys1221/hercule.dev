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


@app.command("reload")
def reload_cmd() -> None:
    """Clear preset discovery cache (after manual config edits)."""
    invalidate_preset_cache()
    from config_loader import invalidate_preset_registry

    invalidate_preset_registry()
    typer.secho("Preset cache cleared.", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
