"""Extra commune query passes after KEYWORDS/EXPANSION locations are exhausted."""

from __future__ import annotations

from typing import Any

COMMUNE_CHUNK_SIZE = 400
GEO_PHASE_PASS = "pass"
GEO_PHASE_SKIP = "skip"
GEO_PHASE_DEPARTMENT = "department"

# Metropolitan + overseas (101 départements).
FRENCH_DEPARTEMENTS: list[str] = (
    [f"departement {i:02d}" for i in range(1, 20)]
    + [f"departement {i:02d}" for i in range(21, 96)]
    + ["departement 2A", "departement 2B"]
    + [f"departement {code}" for code in ("971", "972", "973", "974", "976")]
)

# Additional communes not in the 400-city or expansion lists (mid-size towns).
FRENCH_EXTRA_COMMUNES: list[str] = [
    "Abbeville",
    "Agde",
    "Agen",
    "Aix-les-Bains",
    "Albi",
    "Alencon",
    "Amberieu-en-Bugey",
    "Amboise",
    "Angouleme",
    "Annemasse",
    "Arles",
    "Arras",
    "Aubagne",
    "Auch",
    "Aurillac",
    "Auxerre",
    "Avignon",
    "Bayonne",
    "Beaune",
    "Beauvais",
    "Belfort",
    "Bergerac",
    "Bethune",
    "Blois",
    "Bourg-en-Bresse",
    "Bourges",
    "Brive-la-Gaillarde",
    "Cahors",
    "Calais",
    "Cambrai",
    "Carcassonne",
    "Carpentras",
    "Castres",
    "Chalon-sur-Saone",
    "Chalons-en-Champagne",
    "Chambery",
    "Charleville-Mezieres",
    "Chartres",
    "Chateauroux",
    "Chaumont",
    "Cholet",
    "Colmar",
    "Compiegne",
    "Creil",
    "Dax",
    "Dieppe",
    "Dole",
    "Douai",
    "Draguignan",
    "Dunkerque",
    "Epinal",
    "Epernay",
    "Evreux",
    "Foix",
    "Frejus",
    "Gap",
    "Grasse",
    "Gueret",
    "Haguenau",
    "La Roche-sur-Yon",
    "La Rochelle",
    "Laval",
    "Le Creusot",
    "Le Puy-en-Velay",
    "Libourne",
    "Lorient",
    "Luneville",
    "Macon",
    "Mantes-la-Jolie",
    "Martigues",
    "Meaux",
    "Melun",
    "Mende",
    "Millau",
    "Montauban",
    "Montbeliard",
    "Montlucon",
    "Morlaix",
    "Mulhouse",
    "Narbonne",
    "Nevers",
    "Niort",
    "Orange",
    "Pau",
    "Perigueux",
    "Poitiers",
    "Pontarlier",
    "Quimper",
    "Rodez",
    "Roanne",
    "Roubaix",
    "Saint-Brieuc",
    "Saint-Malo",
    "Saint-Nazaire",
    "Saint-Omer",
    "Sarreguemines",
    "Sartrouville",
    "Sete",
    "Soissons",
    "Tarbes",
    "Thionville",
    "Troyes",
    "Valence",
    "Valenciennes",
    "Vannes",
    "Vesoul",
    "Vichy",
    "Villefranche-sur-Saone",
]


def _normalize(name: str) -> str:
    return name.strip().lower()


def used_location_set(config: dict) -> set[str]:
    """Locations already covered by this preset's configured passes only."""
    used: set[str] = set()
    for key in ("LOCATIONS", "EXPANSION_LOCATIONS"):
        for item in config.get(key) or []:
            if str(item).strip():
                used.add(_normalize(str(item)))
    return used


def unused_communes(config: dict) -> list[str]:
    used = used_location_set(config)
    pool: list[str] = []
    seen: set[str] = set()
    for name in FRENCH_EXTRA_COMMUNES:
        norm = _normalize(name)
        if norm in used or norm in seen:
            continue
        seen.add(norm)
        pool.append(name)
    return pool


def commune_chunks(config: dict, *, chunk_size: int = COMMUNE_CHUNK_SIZE) -> list[list[str]]:
    pool = unused_communes(config)
    if not pool:
        return []
    return [pool[i : i + chunk_size] for i in range(0, len(pool), chunk_size)]


def chunk_count(config: dict) -> int:
    return len(commune_chunks(config))


def get_chunk(config: dict, chunk_index: int) -> list[str]:
    chunks = commune_chunks(config)
    if chunk_index < 0 or chunk_index >= len(chunks):
        return []
    return chunks[chunk_index]


def base_pass_count(config: dict) -> int:
    has_expansion = bool(config.get("EXPANSION_KEYWORDS") and config.get("EXPANSION_LOCATIONS"))
    return 2 if has_expansion else 1


def max_location_pass_index(config: dict) -> int:
    """Highest query_pass index for city/commune location passes (0-based)."""
    base = base_pass_count(config)
    extra = chunk_count(config)
    if extra <= 0:
        return base - 1
    return base - 1 + extra


def max_query_pass_index(config: dict) -> int:
    """Backward-compatible alias — location passes only."""
    return max_location_pass_index(config)


def commune_chunk_index(config: dict, query_pass: int) -> int | None:
    base = base_pass_count(config)
    if query_pass < base:
        return None
    return query_pass - base


def combined_keywords(config: dict) -> list[str]:
    keywords: list[str] = []
    seen: set[str] = set()
    for key in ("KEYWORDS", "EXPANSION_KEYWORDS"):
        for item in config.get(key) or []:
            text = str(item).strip()
            norm = text.lower()
            if text and norm not in seen:
                seen.add(norm)
                keywords.append(text)
    return keywords


def skip_places_step(limit_per_query: int) -> int:
    """Outscraper skipPlaces must be a multiple of 20."""
    raw = max(int(limit_per_query), 20)
    return max((raw // 20) * 20, 20)


def max_skip_places(config: dict) -> int:
    """Cap skip pagination (~8 pages per query at default limit)."""
    limit = max(int(config.get("OUTSCRAPER_LIMIT_PER_QUERY", 30)), 20)
    pages = max(int(config.get("OUTSCRAPER_SKIP_MAX_PAGES", 8)), 1)
    return skip_places_step(limit) * pages


def next_geo_phase(
    config: dict,
    *,
    geo_phase: str,
    query_pass: int,
    skip_places: int,
    limit_per_query: int,
) -> tuple[str, int, int] | None:
    """Advance geo continuation when current phase is exhausted. Returns None if fully done."""
    if geo_phase == GEO_PHASE_PASS:
        if query_pass < max_location_pass_index(config):
            return GEO_PHASE_PASS, query_pass + 1, 0
        return GEO_PHASE_SKIP, 0, 0

    if geo_phase == GEO_PHASE_SKIP:
        step = skip_places_step(limit_per_query)
        next_skip = skip_places + step
        if next_skip < max_skip_places(config):
            return GEO_PHASE_SKIP, query_pass, next_skip
        return GEO_PHASE_DEPARTMENT, 0, 0

    return None


def geo_exhausted(
    config: dict,
    *,
    geo_phase: str,
    query_pass: int,
    skip_places: int,
    limit_per_query: int,
) -> bool:
    return next_geo_phase(
        config,
        geo_phase=geo_phase,
        query_pass=query_pass,
        skip_places=skip_places,
        limit_per_query=limit_per_query,
    ) is None


def reload_enabled(config: dict) -> bool:
    return bool(config.get("SCRAPE_RELOAD_ENABLED"))


def reload_max_rounds(config: dict) -> int:
    return max(int(config.get("SCRAPE_RELOAD_MAX_ROUNDS", 0) or 0), 0)


def initial_geo_state(config: dict) -> tuple[str, int, int]:
    """Return (geo_phase, query_pass, skip_places) for a fresh geo sweep."""
    start_pass = max(int(config.get("SCRAPE_START_QUERY_PASS", 0) or 0), 0)
    return GEO_PHASE_PASS, start_pass, 0


def maybe_begin_reload_round(
    config: dict,
    run_state: dict,
    *,
    instantly_pushed: int,
    target: int,
    target_mode: str,
    log_cb: Any,
) -> tuple[bool, tuple[str, int, int] | None]:
    """Start next geo reload cycle if allowed. Returns (started, new_geo_state)."""
    from scrape_state import target_progress_value

    if not reload_enabled(config):
        return False, None

    reload_round = int(run_state.get("reload_round", 0) or 0)
    pushed_start = int(run_state.get("reload_round_pushed_start", instantly_pushed) or 0)
    delta = instantly_pushed - pushed_start
    max_rounds = reload_max_rounds(config)

    progress = target_progress_value(
        target_mode,
        instantly_pushed=instantly_pushed,
        leads_saved=0,
    )
    if progress >= target:
        return False, None

    if reload_round > 0 and delta == 0:
        log_cb(
            f"Reload round {reload_round} pushed 0 new lead(s) — stopping reload cycles."
        )
        return False, None

    if reload_round >= max_rounds:
        log_cb(f"Reload max rounds ({max_rounds}) reached — no further geo re-scans.")
        return False, None

    new_round = reload_round + 1
    run_state["reload_round"] = new_round
    run_state["reload_round_pushed_start"] = instantly_pushed
    geo_phase, query_pass, skip_places = initial_geo_state(config)
    run_state["geo_phase"] = geo_phase
    run_state["query_pass"] = query_pass
    run_state["skip_places"] = skip_places
    log_cb(
        f"Reload round {new_round}/{max_rounds} — resetting geo to pass {query_pass + 1}, "
        f"phase={geo_phase} (checkpoint pushed={instantly_pushed}, last round delta={delta})."
    )
    return True, (geo_phase, query_pass, skip_places)
