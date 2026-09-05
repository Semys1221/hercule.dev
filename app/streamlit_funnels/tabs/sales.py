"""Sales leaf renderers."""

from __future__ import annotations

from audiences import Audience
from components.placeholder import render_placeholder
from demands.mockup_editor import render_mockup_editor


def render_sales_funnel_stage(audience: Audience, stage: str) -> None:
    render_placeholder(
        f"Sales — {stage}",
        f"Contenu à venir pour l'étape {stage.lower()} ({audience}).",
    )


def render_sales_mockup(audience: Audience) -> None:
    render_mockup_editor(audience)
