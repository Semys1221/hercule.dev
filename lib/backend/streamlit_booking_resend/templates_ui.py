"""Template editor — unique place to edit auto + legacy copy."""

from __future__ import annotations

import streamlit as st

from booking_templates import (
    default_use_html,
    list_templates,
    save_template,
    send_test_email,
    upsert_templates,
)
from shared import (
    EMAIL_TYPE_LABELS,
    EMAIL_TYPE_VARS,
    ENTREPRISE_EMAIL_TYPE_LABELS,
    ENTREPRISE_TYPES,
    LEGACY_TEMPLATE_TYPES,
    MAIN_AGENCE_TYPES,
    display_rendered_email,
    fetch_rendered_email,
)


def _update_template_cache(
    cache_key: str,
    email_type: str,
    subject: str,
    body: str,
) -> None:
    templates = list(st.session_state.get(cache_key) or [])
    for row in templates:
        if str(row.get("email_type")) == email_type:
            row["subject"] = subject
            row["body"] = body
            return
    templates.append(
        {
            "email_type": email_type,
            "subject": subject,
            "body": body,
            "updated_at": None,
        }
    )
    st.session_state[cache_key] = templates


def _show_save_result(result: dict) -> None:
    st.success("Modèle enregistré (DB + prod Resend).")
    code_sync = result.get("code_sync") or {}
    if code_sync.get("python") and code_sync.get("typescript"):
        st.caption("Defaults code synchronisés (booking_templates.py + templates.ts).")
    elif code_sync.get("errors"):
        st.warning(
            "DB OK — sync code partielle : "
            + "; ".join(str(err) for err in code_sync["errors"])
        )


def _editor_block(
    *,
    category: str,
    key_prefix: str,
    email_types: list[str],
    expanded_type: str,
) -> list[dict[str, str]]:
    test_to = st.text_input(
        "Email de test",
        value="nanguy29@gmail.com",
        key=f"{key_prefix}_email_test_to",
    )
    cache_key = f"email_templates_{category}"
    if st.button("Recharger les modèles", key=f"{key_prefix}_reload_templates"):
        st.session_state.pop(cache_key, None)
        st.rerun()

    if cache_key not in st.session_state:
        try:
            st.session_state[cache_key] = list_templates(category)  # type: ignore[arg-type]
        except Exception as exc:
            st.error(f"Impossible de charger les modèles : {exc}")
            st.session_state[cache_key] = []

    templates = st.session_state.get(cache_key) or []
    by_type = {str(row.get("email_type")): row for row in templates}
    edited: list[dict[str, str]] = []

    label_map = (
        ENTREPRISE_EMAIL_TYPE_LABELS if category == "entreprise" else EMAIL_TYPE_LABELS
    )

    for email_type in email_types:
        template = by_type.get(email_type) or {"subject": "", "body": ""}
        label = label_map.get(email_type, email_type)
        with st.expander(label, expanded=email_type == expanded_type):
            st.caption(f"Variables : {EMAIL_TYPE_VARS.get(email_type, '')}")
            subject = st.text_input(
                "Objet",
                value=template.get("subject") or "",
                key=f"{key_prefix}_subject_{email_type}",
            )
            body = st.text_area(
                "Corps (texte brut)",
                value=template.get("body") or "",
                height=220,
                key=f"{key_prefix}_body_{email_type}",
            )
            plain_text_only = email_type in ("immediate", "role_seq_48")
            if plain_text_only:
                st.caption("Mail 1 — toujours plain text + signature plain text")
                use_html = False
            else:
                use_html = st.checkbox(
                    "Signature React (HTML)",
                    value=default_use_html(email_type),
                    key=f"{key_prefix}_template_react_{email_type}",
                )
            col_preview, col_test, col_save = st.columns(3)
            with col_preview:
                if st.button("Aperçu", key=f"{key_prefix}_preview_{email_type}"):
                    try:
                        rendered = fetch_rendered_email(
                            category=category,  # type: ignore[arg-type]
                            email_type=email_type,
                            subject=subject,
                            body=body,
                            use_html=use_html,
                            sample=True,
                        )
                        display_rendered_email(rendered)
                    except Exception as exc:
                        st.error(str(exc))
            with col_test:
                if st.button("Envoyer test", key=f"{key_prefix}_test_{email_type}"):
                    try:
                        result = send_test_email(
                            to=test_to.strip() or "nanguy29@gmail.com",
                            category=category,  # type: ignore[arg-type]
                            email_type=email_type,
                            subject=subject,
                            body=body,
                            use_html=use_html,
                        )
                        st.success(
                            f"Test envoyé à {result.get('to', test_to)} "
                            f"(Resend id: {result.get('resend_email_id', '—')})"
                        )
                    except Exception as exc:
                        st.error(str(exc))
            with col_save:
                if st.button("Enregistrer", key=f"{key_prefix}_save_{email_type}"):
                    try:
                        result = save_template(
                            category,  # type: ignore[arg-type]
                            email_type,  # type: ignore[arg-type]
                            subject,
                            body,
                        )
                        _update_template_cache(cache_key, email_type, subject, body)
                        _show_save_result(result)
                    except Exception as exc:
                        st.error(str(exc))
            edited.append(
                {
                    "email_type": email_type,
                    "subject": subject,
                    "body": body,
                }
            )

    if st.button(
        "Enregistrer les modèles",
        type="primary",
        key=f"{key_prefix}_save_templates",
    ):
        try:
            upsert_templates(category, edited)  # type: ignore[arg-type]
            st.session_state[cache_key] = edited
            st.success(
                f"Modèles enregistrés pour `{category}` (DB + defaults code)."
            )
            st.rerun()
        except Exception as exc:
            st.error(str(exc))

    return edited


def render_templates_tab() -> None:
    st.subheader("Séquences")
    st.caption(
        "Édition unique des templates Resend. Les envois auto (webhook + cron) "
        "et les envois manuels Legacy utilisent ces modèles."
    )

    auto_agence, auto_entreprise, legacy = st.tabs(
        ["Séquence auto — Agence", "Séquence auto — Entreprise", "Templates legacy"]
    )

    with auto_agence:
        st.caption("immediate → H-48 → H-24 → H-20. Démarrage automatique à la réservation.")
        _editor_block(
            category="agence",
            key_prefix="seq_agence",
            email_types=MAIN_AGENCE_TYPES,
            expanded_type="immediate",
        )

    with auto_entreprise:
        st.caption(
            "immediate → H-48 (préparation) → H-24 (rappel). Démarrage automatique à la réservation. "
            "Signature auto : Mise en relation de projets Web & Tech."
        )
        _editor_block(
            category="entreprise",
            key_prefix="seq_entreprise",
            email_types=list(ENTREPRISE_TYPES),
            expanded_type="immediate",
        )

    with legacy:
        st.caption(
            "Intro = role_seq_48. Relance page temporaire = role_seq_24. "
            "La relance lien standard réutilise Email 2 auto (h48_confirm)."
        )
        _editor_block(
            category="agence",
            key_prefix="seq_legacy",
            email_types=LEGACY_TEMPLATE_TYPES,
            expanded_type="role_seq_48",
        )
