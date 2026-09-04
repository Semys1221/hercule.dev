"""SIRET / effectif gate — BeautifulSoup identity + official no-key JSON fast path."""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass, field
from typing import Any, Callable
from urllib.parse import quote, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

SEARCH_API = "https://recherche-entreprises.api.gouv.fr/search"
ANNUAIRE_SEARCH = "https://annuaire-entreprises.data.gouv.fr/rechercher"
ANNUAIRE_ENTREPRISE = "https://annuaire-entreprises.data.gouv.fr/entreprise"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

REJECT_EMPLOYEE_COUNT = "REJECT_EMPLOYEE_COUNT"
REJECT_NAF = "REJECT_NAF"
REJECT_PAPPERS_NOT_FOUND = "REJECT_PAPPERS_NOT_FOUND"
REJECT_UNKNOWN_EFFECTIF = "REJECT_UNKNOWN_EFFECTIF"
REJECT_PAPPERS_UNAVAILABLE = "REJECT_PAPPERS_UNAVAILABLE"

_TRANCHE_MIN: dict[str, int] = {
    "NN": 0,
    "00": 0,
    "0": 0,
    "01": 1,
    "02": 3,
    "03": 6,
    "11": 10,
    "12": 20,
    "21": 50,
    "22": 100,
    "31": 200,
    "32": 250,
    "41": 500,
    "42": 1000,
    "51": 2000,
    "52": 5000,
    "53": 10000,
}

_EI_FORME_CODES = {"1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900"}
_EI_FORME_RE = re.compile(r"\b(entrepreneur\s+individuel|eirl|ei)\b", re.I)
_SIREN_RE = re.compile(r"\b(\d{9})\b")
_SIRET_RE = re.compile(r"\b(\d{14})\b")
_SIRET_LABELED_RE = re.compile(
    r"siret\s*[:\s-]*([0-9][0-9\s]{12,20}[0-9])",
    re.I,
)
_SIREN_LABELED_RE = re.compile(
    r"siren\s*[:\s-]*([0-9][0-9\s]{7,12}[0-9])",
    re.I,
)
_EFFECTIF_RANGE_RE = re.compile(r"(\d+)\s*(?:à|au|and|-|–)\s*(\d+)", re.I)
_EFFECTIF_MIN_RE = re.compile(r"(\d+)\s*\+", re.I)
_EFFECTIF_EXACT_RE = re.compile(r"(\d+)\s+salari", re.I)
_LEGAL_PATHS = ("/mentions-legales", "/mentions-legales/", "/legal", "/mentions_legales")


@dataclass
class PappersCompany:
    siren: str = ""
    siret: str = ""
    tranche_effectif: str = ""
    effectif_min: int | None = None
    effectif_label: str = ""
    chiffre_affaires: str = ""
    annee_creation: str = ""
    code_naf: str = ""
    forme_juridique: str = ""
    forme_juridique_code: str = ""

    def as_lead_fields(self) -> dict[str, str]:
        return {
            "Siret": self.siret,
            "Siren": self.siren,
            "Effectif": self.effectif_label
            or (str(self.effectif_min) if self.effectif_min is not None else ""),
            "TrancheEffectif": self.tranche_effectif,
            "Naf": self.code_naf,
            "FormeJuridique": self.forme_juridique,
            "AnneeCreation": self.annee_creation,
            "ChiffreAffaires": self.chiffre_affaires,
        }


@dataclass
class PappersVerdict:
    accepted: bool
    reason: str = ""
    company: PappersCompany = field(default_factory=PappersCompany)


class PappersSirenValidator:
    def __init__(
        self,
        *,
        min_employees: int = 10,
        on_unknown: str = "reject",
        naf_prefixes: list[str] | None = None,
        concurrency: int = 20,
        timeout_s: float = 5.0,
    ) -> None:
        self.min_employees = max(int(min_employees), 0)
        self.on_unknown = (on_unknown or "reject").strip().lower()
        self.naf_prefixes = [str(item).strip().lower() for item in (naf_prefixes or []) if item]
        self.concurrency = max(int(concurrency), 1)
        self.timeout_s = timeout_s
        self._cache: dict[str, PappersVerdict] = {}

    def cache_key(self, company: str, city: str, siret: str = "", siren: str = "") -> str:
        ident = (siret or siren or "").strip()
        if ident:
            return f"id:{ident}"
        return f"name:{(company or '').strip().lower()}|{(city or '').strip().lower()}"

    async def validate_lead(self, lead: dict[str, str], client: httpx.AsyncClient) -> PappersVerdict:
        company = (lead.get("Company") or "").strip()
        city = (lead.get("City") or "").strip()
        website = (lead.get("Website") or "").strip()
        site_text = lead.get("_website_text") or lead.get("_html_text") or ""
        siret = _digits(lead.get("Siret") or lead.get("siret") or "")
        siren = _digits(lead.get("Siren") or lead.get("siren") or "")
        if len(siret) != 14:
            extracted_siret, extracted_siren = extract_siret_siren(site_text)
            siret = siret if len(siret) == 14 else extracted_siret
            siren = siren if len(siren) == 9 else extracted_siren
        if len(siret) == 14:
            siren = siren or siret[:9]
        elif len(siret) == 9:
            siren = siren or siret
            siret = ""

        key = self.cache_key(company, city, siret=siret, siren=siren)
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        parsed = await self._resolve_company(
            client,
            company=company,
            city=city,
            website=website,
            site_text=site_text,
            siret=siret,
            siren=siren,
        )
        if parsed is None:
            verdict = self._unknown(REJECT_PAPPERS_NOT_FOUND)
        else:
            verdict = self._apply_rules(parsed)
        self._remember(key, verdict, parsed)
        return verdict

    def _remember(self, key: str, verdict: PappersVerdict, parsed: PappersCompany | None) -> None:
        self._cache[key] = verdict
        if parsed and parsed.siren:
            self._cache[f"id:{parsed.siren}"] = verdict
        if parsed and parsed.siret:
            self._cache[f"id:{parsed.siret}"] = verdict

    def _unknown(self, reason: str) -> PappersVerdict:
        if self.on_unknown == "accept":
            return PappersVerdict(True, "", PappersCompany())
        return PappersVerdict(False, reason)

    def _apply_rules(self, company: PappersCompany) -> PappersVerdict:
        if company.effectif_min is None:
            return self._unknown(REJECT_UNKNOWN_EFFECTIF)
        if company.effectif_min < self.min_employees:
            return PappersVerdict(False, REJECT_EMPLOYEE_COUNT, company)
        if _is_entreprise_individuelle(company) and company.effectif_min < self.min_employees:
            return PappersVerdict(False, REJECT_EMPLOYEE_COUNT, company)
        if self.naf_prefixes and company.code_naf:
            normalized = company.code_naf.lower().replace(" ", "")
            if not any(normalized.startswith(prefix.replace(" ", "")) for prefix in self.naf_prefixes):
                return PappersVerdict(False, REJECT_NAF, company)
        return PappersVerdict(True, "", company)

    async def _resolve_company(
        self,
        client: httpx.AsyncClient,
        *,
        company: str,
        city: str,
        website: str,
        site_text: str,
        siret: str,
        siren: str,
    ) -> PappersCompany | None:
        query = siret or siren or " ".join(part for part in (company, city) if part).strip()
        if query:
            hit = await self._search_json(client, query, city)
            if hit and (hit.effectif_min is not None or hit.siren or hit.siret):
                return hit

        if not siret and not siren:
            legal_text = await self._fetch_mentions_legales(client, website)
            extra_siret, extra_siren = extract_siret_siren(legal_text)
            siret = extra_siret
            siren = extra_siren or (extra_siret[:9] if len(extra_siret) == 14 else "")
            if siret or siren:
                hit = await self._search_json(client, siret or siren, city)
                if hit:
                    return hit

        html_company = await self._annuaire_html(client, company=company, city=city, siren=siren, siret=siret)
        return html_company

    async def _search_json(
        self,
        client: httpx.AsyncClient,
        query: str,
        city: str,
    ) -> PappersCompany | None:
        params = {"q": query, "per_page": "5"}
        data = await self._get_json(client, SEARCH_API, params)
        if not data:
            if city and query != city:
                data = await self._get_json(client, SEARCH_API, {"q": f"{query} {city}", "per_page": "5"})
        if not data:
            return None
        results = data.get("results") or []
        if not isinstance(results, list) or not results:
            return None
        city_l = city.strip().lower()
        chosen = None
        for item in results:
            if not isinstance(item, dict):
                continue
            if city_l and _result_matches_city(item, city_l):
                chosen = item
                break
        if chosen is None:
            chosen = results[0] if isinstance(results[0], dict) else None
        if not chosen:
            return None
        return _parse_search_result(chosen)

    async def _fetch_mentions_legales(self, client: httpx.AsyncClient, website: str) -> str:
        base = _normalize_site(website)
        if not base:
            return ""
        for path in _LEGAL_PATHS:
            html = await self._get_html(client, urljoin(base.rstrip("/") + "/", path.lstrip("/")))
            if html:
                return _html_to_text(html)
        return ""

    async def _annuaire_html(
        self,
        client: httpx.AsyncClient,
        *,
        company: str,
        city: str,
        siren: str,
        siret: str,
    ) -> PappersCompany | None:
        if len(siren) == 9:
            html = await self._get_html(client, f"{ANNUAIRE_ENTREPRISE}/{siren}")
            parsed = _parse_annuaire_fiche(html or "", siren=siren)
            if parsed:
                return parsed
        terme = " ".join(part for part in (siret or company, city) if part).strip()
        if not terme:
            return None
        search_html = await self._get_html(client, f"{ANNUAIRE_SEARCH}?terme={quote(terme)}")
        found_siren, found_siret = _parse_annuaire_search(search_html or "")
        use_siren = found_siren or (found_siret[:9] if len(found_siret) == 14 else "")
        if len(use_siren) != 9:
            return None
        html = await self._get_html(client, f"{ANNUAIRE_ENTREPRISE}/{use_siren}")
        return _parse_annuaire_fiche(html or "", siren=use_siren, siret=found_siret)

    async def _get_json(
        self,
        client: httpx.AsyncClient,
        url: str,
        params: dict[str, str],
    ) -> dict[str, Any] | None:
        try:
            response = await client.get(url, params=params)
        except httpx.HTTPError:
            return None
        if response.status_code == 429:
            await asyncio.sleep(0.5)
            try:
                response = await client.get(url, params=params)
            except httpx.HTTPError:
                return None
        if response.status_code == 404:
            return None
        if response.status_code >= 400:
            return None
        try:
            payload = response.json()
        except ValueError:
            return None
        return payload if isinstance(payload, dict) else None

    async def _get_html(self, client: httpx.AsyncClient, url: str) -> str:
        try:
            response = await client.get(url)
        except httpx.HTTPError:
            return ""
        if response.status_code >= 400:
            return ""
        return response.text or ""


def extract_siret_siren(text: str) -> tuple[str, str]:
    raw = text or ""
    labeled_siret = _SIRET_LABELED_RE.search(raw)
    if labeled_siret:
        siret = _digits(labeled_siret.group(1))
        if len(siret) == 14:
            return siret, siret[:9]
    labeled_siren = _SIREN_LABELED_RE.search(raw)
    siren = _digits(labeled_siren.group(1)) if labeled_siren else ""
    if len(siren) == 9:
        return "", siren
    siret_match = _SIRET_RE.search(raw)
    if siret_match:
        return siret_match.group(1), siret_match.group(1)[:9]
    siren_match = _SIREN_RE.search(raw)
    if siren_match:
        return "", siren_match.group(1)
    return "", ""


def _normalize_site(raw: str) -> str:
    url = (raw or "").strip()
    if not url or url.lower() == "nan":
        return ""
    if not url.startswith("http"):
        url = "https://" + url.lstrip("/")
    parsed = urlparse(url)
    if not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def _parse_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    match = re.search(r"\d+", str(value))
    return int(match.group(0)) if match else None


def _parse_effectif_label(label: str) -> int | None:
    text = (label or "").strip().lower()
    if not text:
        return None
    if "non employ" in text or text in {"nn", "sans salarié", "0 salarié", "0 salaries"}:
        return 0
    range_match = _EFFECTIF_RANGE_RE.search(text)
    if range_match:
        return int(range_match.group(1))
    plus_match = _EFFECTIF_MIN_RE.search(text)
    if plus_match:
        return int(plus_match.group(1))
    exact = _EFFECTIF_EXACT_RE.search(text)
    if exact:
        return int(exact.group(1))
    return None


def _tranche_min(code: str) -> int | None:
    raw = (code or "").strip()
    if not raw:
        return None
    return _TRANCHE_MIN.get(raw.upper()) or _TRANCHE_MIN.get(raw)


def _result_matches_city(item: dict[str, Any], city_l: str) -> bool:
    siege = item.get("siege") if isinstance(item.get("siege"), dict) else {}
    candidates = [
        str(siege.get("libelle_commune") or ""),
        str(item.get("libelle_commune") or ""),
        str(siege.get("commune") or ""),
    ]
    return any(city_l in value.lower() for value in candidates if value)


def _parse_search_result(item: dict[str, Any]) -> PappersCompany:
    siege = item.get("siege") if isinstance(item.get("siege"), dict) else {}
    tranche = str(
        item.get("tranche_effectif_salarie")
        or siege.get("tranche_effectif_salarie")
        or item.get("tranche_effectif")
        or ""
    ).strip()
    date_creation = str(item.get("date_creation") or "")
    siret = _digits(str(siege.get("siret") or item.get("siret") or ""))
    siren = _digits(str(item.get("siren") or ""))
    if not siren and len(siret) == 14:
        siren = siret[:9]
    nature = str(item.get("nature_juridique") or item.get("forme_juridique") or "").strip()
    return PappersCompany(
        siren=siren,
        siret=siret,
        tranche_effectif=tranche,
        effectif_min=_tranche_min(tranche),
        effectif_label=tranche,
        chiffre_affaires=str(item.get("chiffre_affaires") or ""),
        annee_creation=date_creation[:4] if len(date_creation) >= 4 else "",
        code_naf=str(item.get("activite_principale") or siege.get("activite_principale") or "").strip(),
        forme_juridique=nature,
        forme_juridique_code=_digits(nature) or nature,
    )


def _parse_annuaire_search(html: str) -> tuple[str, str]:
    if not html:
        return "", ""
    soup = BeautifulSoup(html, "html.parser")
    for anchor in soup.find_all("a", href=True):
        href = str(anchor.get("href") or "")
        entreprise = re.search(r"/entreprise/(\d{9})", href)
        if entreprise:
            return entreprise.group(1), ""
        etablissement = re.search(r"/etablissement/(\d{14})", href)
        if etablissement:
            siret = etablissement.group(1)
            return siret[:9], siret
    found_siret, found_siren = extract_siret_siren(_html_to_text(html))
    return found_siren or (found_siret[:9] if len(found_siret) == 14 else ""), found_siret


def _parse_annuaire_fiche(html: str, *, siren: str = "", siret: str = "") -> PappersCompany | None:
    if not html:
        return None
    text = _html_to_text(html)
    found_siret, found_siren = extract_siret_siren(text)
    siren = siren or found_siren
    siret = siret if len(siret) == 14 else found_siret
    if not siren and not siret:
        return None

    effectif_label = ""
    effectif_match = re.search(
        r"(?:tranche d['’]effectif|effectif)[^0-9a-z]{0,40}([0-9].{0,40}salari\w*)",
        text,
        re.I,
    )
    if effectif_match:
        effectif_label = effectif_match.group(1)
    naf_match = re.search(r"(?:naf|ape)\s*[:\s]*([0-9]{2}\.[0-9]{2}[a-z]?)", text, re.I)
    forme_match = re.search(
        r"(?:forme juridique|nature juridique)\s*[:\s]*([A-Za-zÉÈÀÙÂÊÎÔÛéèàùâêîôû0-9 \-]{2,40})",
        text,
        re.I,
    )
    year_match = re.search(r"(?:date de création|créée? le)\s*[:\s]*(\d{2}/\d{2}/(\d{4})|\d{4})", text, re.I)
    year = ""
    if year_match:
        year = year_match.group(2) or year_match.group(1)[:4]

    tranche = ""
    soup = BeautifulSoup(html, "html.parser")
    for node in soup.find_all(string=re.compile(r"effectif", re.I)):
        parent = node.parent
        chunk = parent.get_text(" ", strip=True) if parent else str(node)
        if _parse_effectif_label(chunk) is not None or _tranche_min(chunk):
            effectif_label = effectif_label or chunk
            break

    effectif_min = _parse_effectif_label(effectif_label) or _tranche_min(effectif_label)
    return PappersCompany(
        siren=siren or (siret[:9] if len(siret) == 14 else ""),
        siret=siret,
        tranche_effectif=tranche,
        effectif_min=effectif_min,
        effectif_label=effectif_label,
        annee_creation=year,
        code_naf=naf_match.group(1) if naf_match else "",
        forme_juridique=(forme_match.group(1).strip() if forme_match else ""),
    )


def _is_entreprise_individuelle(company: PappersCompany) -> bool:
    if company.forme_juridique_code in _EI_FORME_CODES:
        return True
    return bool(_EI_FORME_RE.search(company.forme_juridique))


def pappers_settings(config: dict[str, Any]) -> dict[str, Any]:
    return {
        "enabled": bool(config.get("PAPPERS_ENABLED", False)),
        "min_employees": int(config.get("PAPPERS_MIN_EMPLOYEES", 10) or 10),
        "on_unknown": str(config.get("PAPPERS_ON_UNKNOWN") or "reject"),
        "naf_prefixes": list(config.get("PAPPERS_NAF_PREFIXES") or []),
        "concurrency": max(int(config.get("PAPPERS_CONCURRENCY", 20) or 20), 1),
        "timeout_s": 5.0,
    }


def build_validator(config: dict[str, Any]) -> PappersSirenValidator:
    settings = pappers_settings(config)
    return PappersSirenValidator(
        min_employees=settings["min_employees"],
        on_unknown=settings["on_unknown"],
        naf_prefixes=settings["naf_prefixes"],
        concurrency=settings["concurrency"],
        timeout_s=settings["timeout_s"],
    )


async def validate_leads(
    rows: list[dict[str, str]],
    config: dict[str, Any],
    *,
    log_cb: Callable[[str], None] | None = None,
    client: httpx.AsyncClient | None = None,
    validator: PappersSirenValidator | None = None,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    settings = pappers_settings(config)
    if not settings["enabled"]:
        return rows, []
    if not rows:
        return [], []

    validator = validator or build_validator(config)
    if log_cb:
        log_cb(
            f"SIRET enrich — {len(rows)} lead(s), min effectif {settings['min_employees']}, "
            f"concurrency {settings['concurrency']}"
        )

    semaphore = asyncio.Semaphore(settings["concurrency"])
    own_client = client is None

    async def _run(active_client: httpx.AsyncClient) -> list[tuple[dict[str, str], PappersVerdict]]:
        async def _one(row: dict[str, str]) -> tuple[dict[str, str], PappersVerdict]:
            async with semaphore:
                verdict = await validator.validate_lead(row, active_client)
            return row, verdict

        return list(await asyncio.gather(*[_one(row) for row in rows]))

    if own_client:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings["timeout_s"]),
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
        ) as active_client:
            results = await _run(active_client)
    else:
        results = await _run(client)

    valid: list[dict[str, str]] = []
    rejected: list[dict[str, str]] = []
    for row, verdict in results:
        cleaned = {k: v for k, v in row.items() if not str(k).startswith("_")}
        enriched = {**cleaned, **verdict.company.as_lead_fields()}
        if verdict.accepted:
            valid.append(enriched)
        else:
            enriched["Statut_Lead"] = "Non Valide"
            enriched["Enrich_Reason"] = verdict.reason
            rejected.append(enriched)

    if log_cb:
        log_cb(f"SIRET enrich done — {len(valid)} valid, {len(rejected)} rejected")
    return valid, rejected
