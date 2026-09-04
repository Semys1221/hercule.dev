"""Auto-discover scraper presets from *_config.py modules."""

from __future__ import annotations

import importlib
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

_LIB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CONFIGS_DIR = os.path.join(_LIB_DIR, "configs")
_CACHE: dict[str, PresetMeta] | None = None


@dataclass(frozen=True)
class PresetMeta:
    preset_id: str
    label: str
    module_name: str
    config_path: str
    loader: Callable[[], dict[str, Any]]


def _ensure_lib_on_path() -> None:
    for path in (_LIB_DIR, _CONFIGS_DIR):
        if path not in sys.path:
            sys.path.insert(0, path)


def _expected_module_name(preset_id: str) -> str:
    return f"{preset_id}_config"


def _iter_config_files() -> list[tuple[str, str]]:
    """Return (filename, absolute path) for root then configs/ presets."""
    found: list[tuple[str, str]] = []
    for directory in (_LIB_DIR, _CONFIGS_DIR):
        if not os.path.isdir(directory):
            continue
        for filename in sorted(os.listdir(directory)):
            if not filename.endswith("_config.py"):
                continue
            found.append((filename, os.path.join(directory, filename)))
    return found


def _load_preset_file(filename: str, config_path: str) -> PresetMeta:
    module_name = filename[:-3]
    module = importlib.import_module(module_name)
    preset_id = getattr(module, "PRESET_ID", None)
    label = getattr(module, "PRESET_LABEL", None)
    config = getattr(module, "CONFIG", None)

    if not isinstance(preset_id, str) or not preset_id.strip():
        raise ValueError(f"{filename}: missing PRESET_ID")
    if not isinstance(label, str) or not label.strip():
        raise ValueError(f"{filename}: missing PRESET_LABEL")
    if not isinstance(config, dict):
        raise ValueError(f"{filename}: missing CONFIG dict")

    preset_id = preset_id.strip()
    if _expected_module_name(preset_id) != module_name:
        raise ValueError(
            f"{filename}: PRESET_ID {preset_id!r} must match file "
            f"{_expected_module_name(preset_id)}.py"
        )

    return PresetMeta(
        preset_id=preset_id,
        label=label.strip(),
        module_name=module_name,
        config_path=config_path,
        loader=lambda m=module: dict(m.CONFIG),
    )


def discover_presets(*, use_cache: bool = True) -> dict[str, PresetMeta]:
    global _CACHE
    if use_cache and _CACHE is not None:
        return dict(_CACHE)

    _ensure_lib_on_path()
    found: dict[str, PresetMeta] = {}

    for filename, config_path in _iter_config_files():
        meta = _load_preset_file(filename, config_path)
        if meta.preset_id in found:
            raise ValueError(f"Duplicate PRESET_ID {meta.preset_id!r}")
        found[meta.preset_id] = meta

    if use_cache:
        _CACHE = dict(found)
    return found


def invalidate_preset_cache() -> None:
    global _CACHE
    _CACHE = None


def preset_config_path(preset_id: str) -> str:
    """Existing file path, or the configs/ path for a new preset."""
    root_path = os.path.join(_LIB_DIR, f"{preset_id}_config.py")
    configs_path = os.path.join(_CONFIGS_DIR, f"{preset_id}_config.py")
    if os.path.isfile(root_path):
        return root_path
    if os.path.isfile(configs_path):
        return configs_path
    return configs_path


def configs_dir() -> str:
    return _CONFIGS_DIR


def is_configs_preset(preset_id: str) -> bool:
    path = preset_config_path(preset_id)
    return os.path.dirname(os.path.abspath(path)) == os.path.abspath(_CONFIGS_DIR)
