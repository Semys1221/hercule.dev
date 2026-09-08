"""Tests for commune expansion passes."""

from commune_passes import (
    base_pass_count,
    chunk_count,
    commune_chunk_index,
    get_chunk,
    max_query_pass_index,
)


def test_commune_passes_after_expansion() -> None:
    config = {
        "KEYWORDS": ["expert comptable"],
        "EXPANSION_KEYWORDS": ["expert-comptable"],
        "LOCATIONS": ["Paris"],
        "EXPANSION_LOCATIONS": ["Lyon"],
    }
    assert base_pass_count(config) == 2
    assert commune_chunk_index(config, 0) is None
    assert commune_chunk_index(config, 1) is None
    assert commune_chunk_index(config, 2) == 0
    assert chunk_count(config) >= 1
    assert max_query_pass_index(config) >= 2
    assert get_chunk(config, 0)
