"""Onboarding leaf renderers."""

from __future__ import annotations

from audiences import Audience
from components.placeholder import render_placeholder
from fiches.form import render_fiche_form


def render_onboarding_funnel(audience: Audience) -> None:
    render_placeholder(
        "Onboarding funnel",
        f"Parcours onboarding {audience} — contenu à venir.",
    )


def render_onboarding_fiche_form(audience: Audience) -> None:
    render_fiche_form(audience)
