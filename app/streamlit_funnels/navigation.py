"""Funnel path navigation tree and session-state helpers."""

from __future__ import annotations

from dataclasses import dataclass, field

import streamlit as st

from audiences import AUDIENCE_LABELS, Audience

PATH_KEY = "funnel_path"


@dataclass(frozen=True)
class NavNode:
    label: str
    caption: str = ""
    children: dict[str, NavNode] = field(default_factory=dict)
    leaf: str | None = None

    def is_leaf(self) -> bool:
        return self.leaf is not None and not self.children


def _sales_tree() -> dict[str, NavNode]:
    return {
        "funnel": NavNode(
            label="Funnel",
            caption="Parcours commercial discovery → pitch → closing.",
            children={
                "discovery": NavNode(
                    label="Discovery",
                    leaf="sales_funnel_discovery",
                ),
                "pitch": NavNode(
                    label="Pitch",
                    leaf="sales_funnel_pitch",
                ),
                "closing": NavNode(
                    label="Closing",
                    leaf="sales_funnel_closing",
                ),
            },
        ),
        "mockup": NavNode(
            label="Fiches mockup",
            caption="Cartes carousel homepage agence (agence_demandes).",
            leaf="sales_mockup",
        ),
    }


def _onboarding_tree() -> dict[str, NavNode]:
    return {
        "funnel": NavNode(
            label="Funnel",
            caption="Parcours onboarding — contenu à venir.",
            leaf="onboarding_funnel",
        ),
        "fiche_form": NavNode(
            label="Fiche form",
            caption="Créer une fiche réelle en base.",
            leaf="onboarding_fiche_form",
        ),
    }


def _legal_tree() -> dict[str, NavNode]:
    return {
        "cgv": NavNode(label="CGV", leaf="legal_cgv"),
        "mentions": NavNode(label="Mentions légales", leaf="legal_mentions"),
        "confidentialite": NavNode(label="Confidentialité", leaf="legal_confidentialite"),
        "faq": NavNode(label="FAQ", leaf="legal_faq"),
    }


def _emails_tree() -> dict[str, NavNode]:
    return {
        "pre_close": NavNode(
            label="PRE-CLOSE",
            caption="Outreach, subsequence, reply prompt, booking.",
            children={
                "outreach": NavNode(label="Outreach", leaf="emails_pre_close_outreach"),
                "subsequence": NavNode(label="Subsequence", leaf="emails_pre_close_subsequence"),
                "reply_prompt": NavNode(label="Reply prompt", leaf="emails_pre_close_reply_prompt"),
                "booking": NavNode(label="Booking", leaf="emails_pre_close_booking"),
            },
        ),
        "close": NavNode(
            label="CLOSE",
            caption="Onboarding et notifications post-signature.",
            children={
                "onboarding": NavNode(label="Onboarding", leaf="emails_close_onboarding"),
                "notifications": NavNode(label="Notifications", leaf="emails_close_notifications"),
            },
        ),
    }


MODULES: dict[str, NavNode] = {
    "sales": NavNode(
        label="Sales",
        caption="Funnel commercial et fiches mockup.",
        children=_sales_tree(),
    ),
    "onboarding": NavNode(
        label="Onboarding",
        caption="Parcours et création de fiches réelles.",
        children=_onboarding_tree(),
    ),
    "dashboard": NavNode(
        label="Dashboard",
        caption="KPIs funnel — à venir.",
        leaf="dashboard",
    ),
    "legal": NavNode(
        label="CVG & légal",
        caption="Documents légaux par audience.",
        children=_legal_tree(),
    ),
    "emails": NavNode(
        label="Emails",
        caption="Workflows email PRE-CLOSE et CLOSE.",
        children=_emails_tree(),
    ),
}


def get_path(audience: Audience) -> list[str]:
    raw = st.session_state.get(PATH_KEY)
    if not isinstance(raw, list) or not raw:
        return [audience]
    path = [str(segment) for segment in raw]
    if path[0] != audience:
        path[0] = audience
    return normalize_path(path)


def normalize_path(path: list[str]) -> list[str]:
    if not path:
        return []
    audience = path[0]
    if audience not in ("agence", "entreprise"):
        return [audience]

    node: NavNode | None = None
    current_children = MODULES
    normalized = [audience]

    for segment in path[1:]:
        child = current_children.get(segment)
        if child is None:
            break
        normalized.append(segment)
        node = child
        current_children = child.children

    return normalized


def navigate_to(path: list[str]) -> None:
    st.session_state[PATH_KEY] = normalize_path(path)
    st.rerun()


def navigate_append(segment: str) -> None:
    path = list(st.session_state.get(PATH_KEY, []))
    path.append(segment)
    st.session_state[PATH_KEY] = normalize_path(path)
    st.rerun()


def navigate_back(audience: Audience) -> None:
    path = get_path(audience)
    if len(path) <= 1:
        st.session_state["funnel_view"] = "landing"
        st.session_state.pop(PATH_KEY, None)
    else:
        st.session_state[PATH_KEY] = path[:-1]
    st.rerun()


def go_home() -> None:
    st.session_state["funnel_view"] = "landing"
    st.session_state.pop(PATH_KEY, None)
    st.rerun()


def init_workspace_path(audience: Audience) -> None:
    st.session_state[PATH_KEY] = [audience]


def resolve_node(path: list[str]) -> NavNode | None:
    if len(path) < 2:
        return None
    node = MODULES.get(path[1])
    for segment in path[2:]:
        if node is None:
            return None
        node = node.children.get(segment)
    return node


def get_children(path: list[str]) -> dict[str, NavNode]:
    if len(path) == 1:
        return MODULES
    node = resolve_node(path)
    if node is None:
        return {}
    return node.children


def is_hub(path: list[str]) -> bool:
    node = resolve_node(path) if len(path) >= 2 else None
    if len(path) == 1:
        return True
    if node is None:
        return False
    return bool(node.children) and not node.is_leaf()


def leaf_key(path: list[str]) -> str | None:
    node = resolve_node(path)
    if node is None or not node.is_leaf():
        return None
    return node.leaf


def breadcrumb(path: list[str]) -> str:
    labels = ["Funnels"]
    if not path:
        return " › ".join(labels)

    labels.append(AUDIENCE_LABELS.get(path[0], path[0]))  # type: ignore[arg-type]

    current_children = MODULES
    for segment in path[1:]:
        node = current_children.get(segment)
        if node is None:
            labels.append(segment)
            break
        labels.append(node.label)
        current_children = node.children

    return " › ".join(labels)


def module_options() -> list[tuple[str, str]]:
    return [(node_id, node.label) for node_id, node in MODULES.items()]


def child_options(path: list[str]) -> list[tuple[str, str]]:
    children = get_children(path)
    return [(node_id, node.label) for node_id, node in children.items()]


def path_for_sidebar(
    audience: Audience,
    module_id: str | None,
    section_id: str | None,
    step_id: str | None,
) -> list[str]:
    path: list[str] = [audience]
    if module_id:
        path.append(module_id)
    if section_id and len(path) >= 2:
        path.append(section_id)
    if step_id and len(path) >= 3:
        path.append(step_id)
    return normalize_path(path)
