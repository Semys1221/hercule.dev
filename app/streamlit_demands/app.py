"""Agence demandes — Streamlit editor for homepage carousel cards."""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import streamlit as st

_APP_DIR = Path(__file__).resolve().parent
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

from supabase_repo import get_card, list_all_cards, update_demande, update_teaser

NICHE_OPTIONS = [
    "comptabilite",
    "conseil-financier",
    "renovation",
    "grossiste",
    "a-venir",
]

ORIGINE_PRESETS = [
    "Recrutement actif",
    "Changement de locaux",
    "Nouveau gérant",
    "Expansion réseau",
    "Refonte identité",
    "Croissance commerciale",
    "Fusion / acquisition",
    "Recrutement mandataires",
    "Recrutement comptable",
    "Recrutement conseillers",
    "Recrutement installateurs",
    "Recrutement commercial",
    "Campagne commerciale",
    "Marchés publics remportés",
    "Migration catalogue digital",
    "Expansion export",
    "Autre",
]

st.set_page_config(page_title="Streamlit Demands", layout="wide")
st.title("Streamlit Demands")
st.caption("Édition des cartes affichées sur la homepage agence. Le jeu de cartes est fixé — pas de création.")

try:
    cards = list_all_cards()
except Exception as exc:
    st.error(f"Impossible de charger les demandes : {exc}")
    st.stop()

if not cards:
    st.warning("Aucune carte en base. Appliquez la migration `apply-agence-demandes-migration`.")
    st.stop()

labels = {
    row["external_id"]: (
        f"{row['external_id']} — {row['secteur']}"
        + (" (teaser)" if row["record_type"] == "teaser" else f" [{row.get('status', 'n/a')}]")
    )
    for row in cards
}

selected_id = st.selectbox(
    "Carte à éditer",
    options=[row["external_id"] for row in cards],
    format_func=lambda external_id: labels[external_id],
)

card = get_card(selected_id)
if not card:
    st.error("Carte introuvable.")
    st.stop()

st.divider()
st.subheader(f"Édition : {selected_id}")
st.caption(f"Type : {card['record_type']} · Ordre carousel : {card['sort_order']}")

if card["record_type"] == "demande":
    with st.form("edit_demande"):
        col1, col2 = st.columns(2)

        with col1:
            niche = st.selectbox(
                "Niche",
                options=NICHE_OPTIONS,
                index=NICHE_OPTIONS.index(card["niche"]) if card["niche"] in NICHE_OPTIONS else 0,
            )
            secteur = st.text_input("Secteur", value=card.get("secteur") or "")
            current_origine = (card.get("origine") or "").strip()
            preset_options = [
                value for value in ORIGINE_PRESETS if value != "Autre"
            ]
            if current_origine and current_origine not in preset_options:
                preset_options = [current_origine, *preset_options, "Autre"]
            else:
                preset_options = [*preset_options, "Autre"]
            origine_preset = st.selectbox(
                "Origine (preset)",
                options=preset_options,
                index=preset_options.index(current_origine)
                if current_origine in preset_options
                else preset_options.index("Autre"),
            )
            origine_custom = ""
            if origine_preset == "Autre":
                origine_custom = st.text_input(
                    "Origine (saisie libre)",
                    value=current_origine if current_origine not in ORIGINE_PRESETS else "",
                    help="Signal public détecté expliquant l'existence du projet (ex. recrutement, changement de locaux).",
                )
            origine = origine_custom.strip() if origine_preset == "Autre" else origine_preset
            prestation = st.text_area("Prestation", value=card.get("prestation") or "")
            budget = st.text_input("Budget", value=card.get("budget") or "")
            taille = st.text_input("Taille", value=card.get("taille") or "")

        with col2:
            zone = st.text_input("Zone", value=card.get("zone") or "")
            disponibilite = st.text_input("Disponibilité", value=card.get("disponibilite") or "")
            assigned = st.toggle(
                "Attribué",
                value=card.get("status") == "assigned",
                help="Marque la demande comme déjà attribuée à une agence.",
            )
            available_from = st.date_input(
                "Disponible à partir du",
                value=date.fromisoformat(card["available_from"])
                if card.get("available_from")
                else date.today(),
            )
            available_until = st.date_input(
                "Disponible jusqu'au",
                value=date.fromisoformat(card["available_until"])
                if card.get("available_until")
                else date.today(),
            )

        submitted = st.form_submit_button("Enregistrer", type="primary")
        if submitted:
            try:
                update_demande(
                    selected_id,
                    {
                        "niche": niche,
                        "secteur": secteur.strip(),
                        "origine": origine.strip(),
                        "prestation": prestation.strip(),
                        "budget": budget.strip(),
                        "taille": taille.strip(),
                        "zone": zone.strip(),
                        "disponibilite": disponibilite.strip(),
                        "status": "assigned" if assigned else "available",
                        "available_from": available_from.isoformat(),
                        "available_until": available_until.isoformat(),
                    },
                )
                st.success("Demande mise à jour.")
                st.rerun()
            except Exception as exc:
                st.error(f"Erreur lors de la sauvegarde : {exc}")

else:
    with st.form("edit_teaser"):
        secteur = st.text_input("Secteur", value=card.get("secteur") or "")
        titre = st.text_input("Titre", value=card.get("titre") or "")
        description = st.text_area("Description", value=card.get("description") or "")
        note = st.text_area("Note", value=card.get("note") or "")

        submitted = st.form_submit_button("Enregistrer", type="primary")
        if submitted:
            try:
                update_teaser(
                    selected_id,
                    {
                        "secteur": secteur.strip(),
                        "titre": titre.strip(),
                        "description": description.strip(),
                        "note": note.strip(),
                    },
                )
                st.success("Teaser mis à jour.")
                st.rerun()
            except Exception as exc:
                st.error(f"Erreur lors de la sauvegarde : {exc}")

st.divider()
with st.expander("Aperçu JSON"):
    st.json(card)
