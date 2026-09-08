"""Tab 3 — Instantly campaign (draft)."""

from __future__ import annotations

import streamlit as st

from bootstrap.provision import write_instantly_ids
from bootstrap.ui_helpers import get_api_key, load_preset_config, reload_presets
from instantly_client import ensure_campaign, instantly_resource_name, list_all_campaigns


def render_campaign_tab(preset_id: str) -> None:
    st.subheader("3 — Campagne Instantly (draft)")
    if not preset_id:
        st.warning("Sélectionnez ou créez une config (onglet 1).")
        return

    config = load_preset_config(preset_id)
    list_id = str(config.get("INSTANTLY_LIST_ID") or "").strip()
    if not list_id:
        st.warning("Liez d'abord une liste (onglet 2).")

    current = str(config.get("INSTANTLY_CAMPAIGN_ID") or "").strip()
    if current:
        st.success(f"Campagne liée : `{current}` (reste en draft)")
    else:
        st.info("Aucune campagne liée.")

    api_key = get_api_key()
    if not api_key:
        st.error("INSTANTLY_API_KEY manquant dans le .env")
        return

    mode = st.radio("Campagne", ["Select existing", "Create new"], horizontal=True, key="camp_mode")
    campaigns = list_all_campaigns(api_key)

    if mode == "Select existing":
        if not campaigns:
            st.warning("Aucune campagne dans le workspace.")
            return
        options = {str(x["id"]): str(x.get("name") or x["id"]) for x in campaigns}
        pick = st.selectbox(
            "Choisir une campagne",
            list(options.keys()),
            format_func=lambda i: options[i],
            key="camp_pick",
        )
        if st.button("Lier cette campagne", key="camp_link"):
            from bootstrap.discovery import preset_config_path

            subseq = str(config.get("INSTANTLY_SUBSEQUENCE_ID") or "").strip()
            write_instantly_ids(
                preset_config_path(preset_id),
                list_id=list_id,
                campaign_id=pick,
                subsequence_id=subseq,
            )
            reload_presets()
            st.success("Campagne liée.")
            st.rerun()
    else:
        name = st.text_input("Nom de la nouvelle campagne", key="camp_new_name")
        if st.button("Créer et lier (draft)", key="camp_create"):
            if not name.strip():
                st.error("Nom requis.")
                return
            created = ensure_campaign(api_key, instantly_resource_name(name.strip()))
            campaign_id = str(created.get("id") or "")
            from bootstrap.discovery import preset_config_path

            subseq = str(config.get("INSTANTLY_SUBSEQUENCE_ID") or "").strip()
            write_instantly_ids(
                preset_config_path(preset_id),
                list_id=list_id,
                campaign_id=campaign_id,
                subsequence_id=subseq,
            )
            reload_presets()
            st.success(f"Campagne draft créée : {campaign_id}")
            st.rerun()
