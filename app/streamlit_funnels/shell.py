"""Workspace chrome and funnel router."""

from __future__ import annotations

from audiences import Audience
from content import render_funnel_content
from navigation import get_path
from sidebar import render_sidebar


def render_workspace(audience: Audience) -> None:
    audience = render_sidebar(audience)
    path = get_path(audience)
    render_funnel_content(audience, path)
