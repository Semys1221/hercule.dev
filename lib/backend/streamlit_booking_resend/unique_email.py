"""Onglet Email unique — composition libre et envoi multi-destinataires."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, Literal

import streamlit as st

from booking_templates import send_test_email
from crm_api import send_booking_email_once
from schedule import format_paris

CategoryFilter = Literal["all", "agence", "entreprise"]
Category = Literal["agence", "entreprise"]

VARIABLES_HELP = (
    "Variables : {{firstNameLine}}, {{date}}, {{heure}}, "
    "{{confirmUrl}}, {{confirmation_agence_link}}, {{confirmLink}}"
)

DEFAULT_TEST_TO = "nanguy29@gmail.com"
CUSTOM_EMAIL_TYPE = "h48_confirm"


def _parse_iso_dt(value: str) -> datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=UTC)
        return dt
    except ValueError:
        return None


def _row_category(row: dict[str, Any]) -> str:
    return str(
        row.get("booking_category")
        or row.get("lead_category")
        or "agence"
    )


def _recipient_label(row: dict[str, Any]) -> str:
    email = str(row.get("email") or "")
    first_name = str(row.get("first_name") or row.get("name") or "").strip()
    company = str(row.get("company") or "").strip()
    start = _parse_iso_dt(str(row.get("start_time") or ""))
    rdv = format_paris(start) if start else "—"
    parts = [email]
    if first_name:
        parts.append(first_name)
    if company:
        parts.append(company)
    parts.append(f"RDV {rdv}")
    return " — ".join(parts)


def list_recipient_options(
    bookings: list[dict[str, Any]] | None,
    category_filter: CategoryFilter,
) -> list[dict[str, Any]]:
    if not bookings:
        return []

    options: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in bookings:
        lead_id = str(row.get("lead_id") or "").strip()
        if not lead_id:
            continue
        category = _row_category(row)
        if category_filter != "all" and category != category_filter:
            continue
        email = str(row.get("email") or "").strip()
        dedupe_key = f"{category}:{lead_id}"
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        label = _recipient_label(row)
        options.append(
            {
                "label": label,
                "email": email,
                "lead_id": lead_id,
                "category": category,
            }
        )
    options.sort(key=lambda item: item["label"].lower())
    return options


def _resolve_selected_recipients(
    options: list[dict[str, Any]],
    selected_labels: list[str],
) -> list[dict[str, Any]]:
    by_label = {opt["label"]: opt for opt in options}
    return [by_label[label] for label in selected_labels if label in by_label]


def _validate_compose(subject: str, body: str) -> bool:
    if not subject.strip() or not body.strip():
        st.warning("Renseignez l'objet et le corps.")
        return False
    return True


def render_unique_email_tab(
    *,
    fetch_bookings: Callable[[], list[dict[str, Any]]],
    display_rendered_email: Callable[[dict[str, Any]], None],
    fetch_rendered_email: Callable[..., dict[str, Any]],
) -> None:
    st.subheader("Email unique")
    st.caption(
        "Composez un email libre et envoyez-le à un ou plusieurs leads provisionnés "
        "(réservations Calendly chargées)."
    )

    col_load, col_refresh, _ = st.columns([1, 1, 2])
    with col_load:
        if st.button("Charger Calendly", type="primary", key="unique_load"):
            try:
                loaded = fetch_bookings()
                st.success(f"{len(loaded)} réservation(s) chargée(s).")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
    with col_refresh:
        if st.button("Actualiser", key="unique_refresh"):
            try:
                loaded = fetch_bookings()
                st.toast(f"{len(loaded)} réservation(s) rechargée(s).")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))

    bookings = st.session_state.get("bookings")
    if bookings is None:
        st.info("Cliquez sur « Charger Calendly » pour lister les réservations.")
        return

    category_filter = st.selectbox(
        "Catégorie",
        ["all", "agence", "entreprise"],
        format_func=lambda v: {"all": "Toutes", "agence": "Agence", "entreprise": "Entreprise"}[v],
        key="unique_category_filter",
    )

    options = list_recipient_options(bookings, category_filter)  # type: ignore[arg-type]
    if not options:
        st.warning(
            "Aucun destinataire provisionné pour ce filtre. "
            "Provisionnez des leads depuis l'onglet Réservations Agence ou Entreprise."
        )
        return

    labels = [opt["label"] for opt in options]
    selected_labels = st.multiselect(
        "Destinataires",
        labels,
        key="unique_recipients",
        help="Seules les réservations avec un lead Supabase provisionné sont listées.",
    )
    st.caption(f"{len(selected_labels)} destinataire(s) sélectionné(s).")

    subject = st.text_input("Objet", key="unique_subject")
    body = st.text_area(
        "Corps",
        height=220,
        key="unique_body",
        help=VARIABLES_HELP,
    )

    format_mode = st.radio(
        "Format d'envoi",
        ["React (HTML)", "Plain text"],
        horizontal=True,
        key="unique_format",
        help=(
            "React : email HTML avec signature React. "
            "Plain text : signature texte Hercule ajoutée automatiquement."
        ),
    )
    use_html = format_mode == "React (HTML)"
    if not use_html:
        st.caption("En plain text, la signature Hercule est ajoutée automatiquement au corps.")

    test_to = st.text_input("Email de test", value=DEFAULT_TEST_TO, key="unique_test_to")

    preview_col, test_col, send_col = st.columns(3)
    selected = _resolve_selected_recipients(options, selected_labels)
    preview_lead = selected[0] if selected else None
    preview_category: Category = (
        preview_lead["category"] if preview_lead else "agence"  # type: ignore[assignment]
    )

    with preview_col:
        if st.button("Aperçu", key="unique_preview"):
            if not _validate_compose(subject, body):
                pass
            else:
                try:
                    rendered = fetch_rendered_email(
                        category=preview_category,
                        email_type=CUSTOM_EMAIL_TYPE,
                        subject=subject,
                        body=body,
                        lead_id=preview_lead["lead_id"] if preview_lead else None,
                        use_html=use_html,
                        sample=preview_lead is None,
                    )
                    if preview_lead:
                        st.caption(f"Aperçu pour : {preview_lead['label']}")
                    else:
                        st.caption("Aperçu avec données exemple (aucun destinataire sélectionné).")
                    display_rendered_email(rendered)
                except Exception as exc:
                    st.error(str(exc))

    with test_col:
        if st.button("Envoyer test", key="unique_send_test"):
            if not _validate_compose(subject, body):
                pass
            elif not test_to.strip() or "@" not in test_to:
                st.warning("Adresse de test invalide.")
            else:
                try:
                    result = send_test_email(
                        to=test_to.strip(),
                        category=preview_category,
                        email_type=CUSTOM_EMAIL_TYPE,
                        subject=subject.strip(),
                        body=body,
                        use_html=use_html,
                    )
                    st.success(
                        f"Test envoyé à {result.get('to', test_to)} "
                        f"(Resend id: {result.get('resend_email_id', '—')})"
                    )
                except Exception as exc:
                    st.error(str(exc))

    with send_col:
        if st.button("Envoyer", type="primary", key="unique_send"):
            if not _validate_compose(subject, body):
                pass
            elif not selected:
                st.warning("Sélectionnez au moins un destinataire.")
            else:
                ok = 0
                errors: list[str] = []
                for recipient in selected:
                    try:
                        result = send_booking_email_once(
                            lead_id=recipient["lead_id"],
                            category=recipient["category"],
                            email_type="h48_confirm",
                            subject=subject.strip(),
                            body=body,
                            use_html=use_html,
                        )
                        ok += 1
                        st.success(
                            f"{recipient['email']} — envoyé "
                            f"(Resend id: {result.get('resend_email_id', '—')})"
                        )
                    except Exception as exc:
                        errors.append(f"{recipient['email']}: {exc}")
                if ok:
                    st.success(f"{ok} email(s) envoyé(s).")
                for err in errors:
                    st.error(err)
