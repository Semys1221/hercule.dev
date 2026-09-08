"""Tab 6 — Buyer reply agent prompt."""

from __future__ import annotations

from pathlib import Path

import streamlit as st

from bootstrap.app_imports import load_app_module
from bootstrap.ui_helpers import load_preset_config, status_for_active

_REPO_ROOT = Path(__file__).resolve().parents[3]
_REPLY_APP = _REPO_ROOT / "app" / "streamlit_reply_agent"


def _load_existing_prompt(preset_id: str) -> str:
    path = _REPLY_APP / "prompts" / f"{preset_id}_buyer.md"
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return ""


def render_reply_tab(preset_id: str) -> None:
    st.subheader("6 — Prompt reply agent (buyer)")
    if not preset_id:
        st.warning("Sélectionnez ou créez une config (onglet 1).")
        return

    config = load_preset_config(preset_id)
    campaign_id = str(config.get("INSTANTLY_CAMPAIGN_ID") or "").strip()

    existing = _load_existing_prompt(preset_id)
    if existing.strip():
        st.success("Prompt buyer existant.")

    prompt_text = st.text_area(
        "Prompt buyer (markdown)",
        value=existing,
        height=400,
        key="reply_buyer_prompt",
    )

    if st.button("Enregistrer le prompt buyer", type="primary", key="reply_save"):
        if not prompt_text.strip():
            st.error("Le prompt ne peut pas être vide.")
            return

        reply_dir = str(_REPLY_APP)
        prompt_store = load_app_module(reply_dir, "prompt_store")

        reply_config = None
        if campaign_id:
            try:
                supabase_repo = load_app_module(reply_dir, "supabase_repo")
                reply_config = supabase_repo.get_config(campaign_id)
            except Exception:
                reply_config = None

        result = prompt_store.save_prompt(
            preset_id,
            "buyer",
            prompt_text.strip(),
            campaign_id=campaign_id or None,
            config=reply_config,
            push_prod=bool(campaign_id and reply_config),
        )
        if result.get("prod"):
            st.success("Prompt enregistré (fichier + Supabase).")
        else:
            st.success("Prompt enregistré (fichier).")
            if result.get("reason"):
                st.caption(f"Supabase : {result['reason']}")

        status = status_for_active(preset_id)
        if status.complete:
            st.caption("Preset prêt — ouvrez **Scrape** dans la barre latérale.")
        else:
            missing = status.missing()
            if missing:
                st.caption(f"Onboarding restant : {', '.join(missing)}")
