"""Onboarding fiche create form."""

from __future__ import annotations

import streamlit as st

from audiences import AUDIENCE_LABELS, Audience
from fiches.repo import (
    DuplicateEmailError,
    OnboardingInsertError,
    create_onboarding_fiche,
    profile_columns_supported,
)


def render_fiche_form(audience: Audience) -> None:
    label = AUDIENCE_LABELS[audience]
    st.subheader(f"Créer une fiche {label}")
    st.caption(
        "Crée une fiche réelle en base (`agence` ou `entreprise`) — "
        "distincte des cartes mockup carousel."
    )

    profile_ok = profile_columns_supported()
    if not profile_ok:
        st.warning(
            "Migration `onboarding_profile` non appliquée — "
            "l'insertion utilisera les colonnes existantes sans `profile`."
        )

    with st.form(f"fiche_form_{audience}"):
        email = st.text_input("Email *")
        first_name = st.text_input("Prénom *")
        company = st.text_input("Société *")
        besoin = st.text_area("Besoin *")

        if audience == "agence":
            specialites = st.text_input("Spécialités (séparées par des virgules)")
            taille_equipe = st.text_input("Taille équipe")
            budget = st.text_input("Budget")
            droit_retractation = st.checkbox("Droit de rétractation (4 jours)")
            zone = ""
            taille = ""
        else:
            budget = st.text_input("Budget")
            zone = st.text_input("Zone")
            taille = st.text_input("Taille")
            specialites = ""
            taille_equipe = ""
            droit_retractation = False

        submitted = st.form_submit_button("Créer la fiche", type="primary")

    if not submitted:
        return

    if not email.strip() or not first_name.strip() or not company.strip() or not besoin.strip():
        st.error("Email, prénom, société et besoin sont obligatoires.")
        return

    form_fields: dict[str, str | bool | list[str]] = {
        "besoin": besoin.strip(),
        "company": company.strip(),
    }
    if audience == "agence":
        form_fields["specialites"] = [
            item.strip() for item in specialites.split(",") if item.strip()
        ]
        form_fields["taille_equipe"] = taille_equipe.strip()
        form_fields["budget"] = budget.strip()
        form_fields["droit_retractation"] = droit_retractation
    else:
        form_fields["budget"] = budget.strip()
        form_fields["zone"] = zone.strip()
        form_fields["taille"] = taille.strip()

    try:
        row = create_onboarding_fiche(
            category=audience,
            email=email,
            first_name=first_name,
            company=company,
            form_fields=form_fields,
            profile_supported=profile_ok,
        )
    except DuplicateEmailError as exc:
        st.error(str(exc))
        return
    except OnboardingInsertError as exc:
        st.error(f"Erreur lors de la création : {exc}")
        return

    st.success(f"Fiche {label} créée — id `{row.get('id')}`, slug `{row.get('slug')}`.")
    with st.expander("Aperçu ligne créée"):
        st.json(row)
