"""Select 15 accounting + 15 brokerage cabinets from exported replies."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

from conference_clients import ACCOUNTING_QUOTA, BROKERAGE_QUOTA
from conference_clients.denylist import is_denied

FREEMAIL_DOMAINS = frozenset(
    {
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoo.fr",
        "hotmail.com",
        "hotmail.fr",
        "outlook.com",
        "outlook.fr",
        "live.com",
        "live.fr",
        "msn.com",
        "icloud.com",
        "me.com",
        "mac.com",
        "proton.me",
        "protonmail.com",
        "orange.fr",
        "wanadoo.fr",
        "free.fr",
        "sfr.fr",
        "neuf.fr",
        "laposte.net",
        "aliceadsl.fr",
        "aol.com",
        "gmx.fr",
        "gmx.com",
    }
)

_DOMAIN_RE = re.compile(r"^[a-z0-9.-]+\.[a-z]{2,}$")


def email_domain(email: str) -> str | None:
    local_at = (email or "").strip().lower().rsplit("@", 1)
    if len(local_at) != 2:
        return None
    domain = local_at[1].strip(".")
    if not domain or domain in FREEMAIL_DOMAINS:
        return None
    if not _DOMAIN_RE.match(domain):
        return None
    return domain


def website_domain(website: str) -> str | None:
    raw = (website or "").strip()
    if not raw:
        return None
    if "://" not in raw:
        raw = f"https://{raw}"
    parsed = urlparse(raw)
    host = (parsed.hostname or "").lower().strip(".")
    if host.startswith("www."):
        host = host[4:]
    if not host or host in FREEMAIL_DOMAINS:
        return None
    return host


def resolve_website(row: dict[str, Any]) -> str | None:
    from_site = website_domain(str(row.get("website") or ""))
    if from_site:
        return f"https://{from_site}"
    from_email = email_domain(str(row.get("email") or ""))
    if from_email:
        return f"https://{from_email}"
    return None


def cabinet_name(row: dict[str, Any], domain: str) -> str:
    company = str(row.get("company_name") or "").strip()
    if company:
        return company
    label = domain.split(".")[0].replace("-", " ").strip()
    return label.title() if label else domain


def slug_for_domain(domain: str) -> str:
    slug = re.sub(r"[^a-z0-9-]", "-", domain.lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "cabinet"


def to_candidate(row: dict[str, Any]) -> dict[str, Any] | None:
    website = resolve_website(row)
    if not website:
        return None
    domain = website_domain(website)
    if not domain:
        return None
    name = cabinet_name(row, domain)
    if is_denied(name, domain):
        return None
    category = row.get("category")
    if category not in ("accounting", "brokerage"):
        return None
    return {
        "email": str(row.get("email") or "").strip().lower(),
        "name": name,
        "category": category,
        "website": website,
        "domain": domain,
        "slug": slug_for_domain(domain),
        "campaign_id": row.get("campaign_id") or "",
        "campaign_name": row.get("campaign_name") or "",
        "lead_id": row.get("lead_id") or "",
    }


def _dedupe_key(candidate: dict[str, Any]) -> str:
    email = str(candidate.get("email") or "").strip().lower()
    if email:
        return f"email:{email}"
    return f"domain:{candidate['domain']}"


def dedupe(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    domains: set[str] = set()
    out: list[dict[str, Any]] = []
    for item in candidates:
        key = _dedupe_key(item)
        domain = item["domain"]
        if key in seen or domain in domains:
            continue
        seen.add(key)
        domains.add(domain)
        out.append(item)
    return out


def apply_selection_overrides(
    candidates: list[dict[str, Any]],
    *,
    include_domains: list[str] | None = None,
    exclude_domains: list[str] | None = None,
) -> list[dict[str, Any]]:
    exclude = {d.lower().lstrip("www.") for d in (exclude_domains or [])}
    include = {d.lower().lstrip("www.") for d in (include_domains or [])}
    filtered = [c for c in candidates if c["domain"] not in exclude]
    if not include:
        return filtered
    preferred = [c for c in filtered if c["domain"] in include]
    rest = [c for c in filtered if c["domain"] not in include]
    return preferred + rest


def split_by_category(
    candidates: list[dict[str, Any]],
    *,
    accounting_quota: int = ACCOUNTING_QUOTA,
    brokerage_quota: int = BROKERAGE_QUOTA,
) -> dict[str, Any]:
    accounting = [c for c in candidates if c["category"] == "accounting"]
    brokerage = [c for c in candidates if c["category"] == "brokerage"]
    chosen = accounting[:accounting_quota] + brokerage[:brokerage_quota]
    pool = accounting[accounting_quota:] + brokerage[brokerage_quota:]
    return {
        "chosen": chosen,
        "pool": pool,
        "quotas": {
            "accounting": min(len(accounting), accounting_quota),
            "brokerage": min(len(brokerage), brokerage_quota),
            "accounting_available": len(accounting),
            "brokerage_available": len(brokerage),
        },
    }


def replace_failed_logos(
    chosen: list[dict[str, Any]],
    pool: list[dict[str, Any]],
    failed_domains: set[str],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Swap cabinets whose logo failed with the next same-category pool item."""
    remaining_pool = list(pool)
    next_chosen: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []

    def take_replacement(category: str) -> dict[str, Any] | None:
        for index, item in enumerate(remaining_pool):
            if item["category"] == category and item["domain"] not in failed_domains:
                return remaining_pool.pop(index)
        return None

    for item in chosen:
        if item["domain"] not in failed_domains:
            next_chosen.append(item)
            continue
        dropped.append(item)
        replacement = take_replacement(item["category"])
        if replacement:
            next_chosen.append(replacement)

    return next_chosen, remaining_pool, dropped


def public_firm(candidate: dict[str, Any], logo_path: str) -> dict[str, str]:
    return {
        "slug": candidate["slug"],
        "name": candidate["name"],
        "category": candidate["category"],
        "website": candidate["website"],
        "logo": logo_path,
    }


def select_from_export(
    rows: list[dict[str, Any]],
    *,
    include_domains: list[str] | None = None,
    exclude_domains: list[str] | None = None,
) -> dict[str, Any]:
    rejected_no_website = 0
    rejected_denied = 0
    candidates: list[dict[str, Any]] = []
    for row in rows:
        website = resolve_website(row)
        if not website:
            rejected_no_website += 1
            continue
        domain = website_domain(website) or ""
        name = cabinet_name(row, domain)
        if is_denied(name, domain):
            rejected_denied += 1
            continue
        candidate = to_candidate(row)
        if candidate:
            candidates.append(candidate)
    candidates = dedupe(candidates)
    candidates = apply_selection_overrides(
        candidates,
        include_domains=include_domains,
        exclude_domains=exclude_domains,
    )
    split = split_by_category(candidates)
    split["rejected_no_website"] = rejected_no_website
    split["rejected_denied"] = rejected_denied
    return split
