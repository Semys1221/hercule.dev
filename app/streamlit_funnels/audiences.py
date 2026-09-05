"""Audience types and labels for streamlit_funnels."""

from __future__ import annotations

from typing import Literal

Audience = Literal["agence", "entreprise"]

AUDIENCE_LABELS: dict[Audience, str] = {
    "agence": "Agence",
    "entreprise": "Entreprise",
}

AUDIENCE_ICONS: dict[Audience, str] = {
    "agence": "🏢",
    "entreprise": "🏭",
}

AUDIENCE_CAPTIONS: dict[Audience, str] = {
    "agence": "Buyer — agences partenaires qui reçoivent des demandes qualifiées.",
    "entreprise": "Seller — entreprises qui recherchent une agence.",
}

TARGET_TYPES: dict[Audience, str] = {
    "agence": "buyer",
    "entreprise": "seller",
}
