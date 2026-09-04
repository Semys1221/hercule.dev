"""Auto-discover scraper presets from *_config.py modules."""

from __future__ import annotations

import importlib
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

_LIB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CACHE: dict[str, PresetMeta] | None = None


@dataclass(frozen=True)
class PresetMeta:
    preset_id: str
    label: str
    module_name: str
    config_path: str
    loader: Callable[[], dict[str, Any]]


def _ensure_lib_on_path() -> None:
    if _LIB_DIR not in sys.path:
        sys.path.insert(0, _LIB_DIR)


def _expected_module_name(preset_id: str) -> str:
    return f"{preset_id}_config"


def discover_presets(*, use_cache: bool = True) -> dict[str, PresetMeta]:
    global _CACHE
    if use_cache and _CACHE is not None:
        return dict(_CACHE)

    _ensure_lib_on_path()
    found: dict[str, PresetMeta] = {}

    for filename in sorted(os.listdir(_LIB_DIR)):
        if not filename.endswith("_config.py"):
            continue
        module_name = filename[:-3]
        config_path = os.path.join(_LIB_DIR, filename)

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

        if preset_id in found:
            raise ValueError(f"Duplicate PRESET_ID {preset_id!r}")

        found[preset_id] = PresetMeta(
            preset_id=preset_id,
            label=label.strip(),
            module_name=module_name,
            config_path=config_path,
            loader=lambda m=module: dict(m.CONFIG),
        )

    if use_cache:
        _CACHE = dict(found)
    return found


def invalidate_preset_cache() -> None:
    global _CACHE
    _CACHE = None


def preset_config_path(preset_id: str) -> str:
    return os.path.join(_LIB_DIR, f"{preset_id}_config.py")
