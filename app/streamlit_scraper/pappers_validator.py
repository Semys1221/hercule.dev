"""Pappers SIREN/SIRET enrichment and employee-count gate."""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass, field
from typing import Any, Callable
from urllib.parse import quote

import httpx

PAPPERS_API_BASE = "https://api.pappers.fr/v2"
REJECT_EMPLOYEE_COUNT = "REJECT_EMPLOYEE_COUNT"
REJECT_NAF = "REJECT_NAF"
REJECT_PAPPERS_NOT_FOUND = "REJECT_PAPPERS_NOT_FOUND"
REJECT_UNKNOWN_EFFECTIF = "REJECT_UNKNOWN_EFFECTIF"
REJECT_PAPPERS_UNAVAILABLE = "REJECT_PAPPERS_UNAVAILABLE"

# INSEE tranche_effectif → lower bound of the official range.
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
_EI_FORME_RE = re.compile(
    r"\b(entrepreneur\s+individuel|eirl|ei)\b",
    re.I,
)
_SIREN_RE = re.compile(r"\b(\d{9})\b")
_SIRET_RE = re.compile(r"\b(\d{14})\b")
_EFFECTIF_RANGE_RE = re.compile(
    r"(\d+)\s*(?:à|au|and|-|–)\s*(\d+)",
    re.I,
)
_EFFECTIF_MIN_RE = re.compile(r"(\d+)\s*\+", re.I)
_EFFECTIF_EXACT_RE = re.compile(r"(\d+)\s+salari", re.I)


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
            "Effectif": self.effectif_label or (
                str(self.effectif_min) if self.effectif_min is not None else ""
            ),
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
        api_key: str,
        *,
        min_employees: int = 10,
        on_unknown: str = "reject",
        naf_prefixes: list[str] | None = None,
        concurrency: int = 5,
        timeout_s: float = 15.0,
    ) -> None:
        self.api_key = (api_key or "").strip()
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
        siret = _digits(lead.get("Siret") or lead.get("siret") or "")
        siren = _digits(lead.get("Siren") or lead.get("siren") or "")
        if len(siret) == 14:
            siren = siren or siret[:9]
        elif len(siret) == 9:
            siren = siren or siret
            siret = ""

        key = self.cache_key(company, city, siret=siret, siren=siren)
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        if not self.api_key:
            verdict = PappersVerdict(False, REJECT_PAPPERS_UNAVAILABLE)
            self._cache[key] = verdict
            return verdict

        payload, unavailable = await self._lookup(client, company=company, city=city, siret=siret, siren=siren)
        if unavailable:
            verdict = self._unknown(REJECT_PAPPERS_UNAVAILABLE)
            self._cache[key] = verdict
            return verdict
        if payload is None:
            verdict = self._unknown(REJECT_PAPPERS_NOT_FOUND)
            self._cache[key] = verdict
            return verdict

        parsed = _parse_entreprise(payload)
        verdict = self._apply_rules(parsed)
        self._cache[key] = verdict
        if parsed.siren:
            self._cache[f"id:{parsed.siren}"] = verdict
        if parsed.siret:
            self._cache[f"id:{parsed.siret}"] = verdict
        return verdict

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

    async def _lookup(
        self,
        client: httpx.AsyncClient,
        *,
        company: str,
        city: str,
        siret: str,
        siren: str,
    ) -> tuple[dict[str, Any] | None, bool]:
        if len(siret) == 14:
            data, unavailable = await self._get_entreprise(client, siret=siret)
            if data or unavailable:
                return data, unavailable
        if len(siren) == 9:
            data, unavailable = await self._get_entreprise(client, siren=siren)
            if data or unavailable:
                return data, unavailable

        if not company:
            return None, False

        result, unavailable = await self._search(client, company, city)
        if unavailable:
            return None, True
        if not result:
            return None, False

        found_siren = _digits(str(result.get("siren") or ""))
        found_siret = _digits(str((result.get("siege") or {}).get("siret") or result.get("siret") or ""))
        if len(found_siren) == 9 or len(found_siret) == 14:
            data, unavailable = await self._get_entreprise(
                client,
                siren=found_siren if len(found_siren) == 9 else "",
                siret=found_siret if len(found_siret) == 14 else "",
            )
            if data or unavailable:
                return data, unavailable
        return result if isinstance(result, dict) else None, False

    async def _get_entreprise(
        self,
        client: httpx.AsyncClient,
        *,
        siren: str = "",
        siret: str = "",
    ) -> tuple[dict[str, Any] | None, bool]:
        params: dict[str, str] = {"api_token": self.api_key}
        if siret:
            params["siret"] = siret
        elif siren:
            params["siren"] = siren
        else:
            return None, False
        return await self._get_json(client, "/entreprise", params)

    async def _search(
        self,
        client: httpx.AsyncClient,
        company: str,
        city: str,
    ) -> tuple[dict[str, Any] | None, bool]:
        params = {"api_token": self.api_key, "q": company, "par_page": "5"}
        if city:
            params["ville"] = city
        data, unavailable = await self._get_json(client, "/recherche", params)
        if unavailable:
            return None, True
        if not data:
            return None, False
        results = data.get("resultats") or data.get("resultats_sirene") or []
        if not isinstance(results, list) or not results:
            return None, False
        return results[0] if isinstance(results[0], dict) else None, False

    async def _get_json(
        self,
        client: httpx.AsyncClient,
        path: str,
        params: dict[str, str],
    ) -> tuple[dict[str, Any] | None, bool]:
        try:
            response = await client.get(f"{PAPPERS_API_BASE}{path}", params=params)
        except httpx.HTTPError:
            return None, True

        if response.status_code in (401, 402, 403):
            html = await self._html_fallback(client, params)
            return html, html is None
        if response.status_code == 404:
            return None, False
        if response.status_code == 429:
            await asyncio.sleep(2.0)
            try:
                retry = await client.get(f"{PAPPERS_API_BASE}{path}", params=params)
            except httpx.HTTPError:
                return None, True
            if retry.status_code >= 400:
                return None, True
            payload = retry.json() if retry.text else None
            return payload if isinstance(payload, dict) else None, False
        if response.status_code >= 400:
            return None, True

        payload = response.json() if response.text else None
        return payload if isinstance(payload, dict) else None, False

    async def _html_fallback(
        self,
        client: httpx.AsyncClient,
        params: dict[str, str],
    ) -> dict[str, Any] | None:
        query = params.get("siret") or params.get("siren") or params.get("q") or ""
        if not query:
            return None
        url = f"https://www.pappers.fr/recherche?q={quote(query)}"
        try:
            response = await client.get(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                },
            )
        except httpx.HTTPError:
            return None
        if response.status_code >= 400:
            return None
        text = response.text or ""
        siren_match = _SIREN_RE.search(text)
        siret_match = _SIRET_RE.search(text)
        if not siren_match and not siret_match:
            return None
        return {
            "siren": siren_match.group(1) if siren_match else "",
            "siege": {"siret": siret_match.group(1) if siret_match else ""},
        }


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
    if not match:
        return None
    return int(match.group(0))


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


def _parse_entreprise(payload: dict[str, Any]) -> PappersCompany:
    siege = payload.get("siege") if isinstance(payload.get("siege"), dict) else {}
    tranche = str(payload.get("tranche_effectif") or siege.get("tranche_effectif") or "").strip()
    label = str(
        payload.get("effectif")
        or siege.get("effectif")
        or payload.get("tranche_effectif_insee")
        or ""
    ).strip()
    effectif_min = _parse_int(siege.get("effectif_min") if siege.get("effectif_min") is not None else payload.get("effectif_min"))
    if effectif_min is None and tranche:
        effectif_min = _TRANCHE_MIN.get(tranche.upper())
        if effectif_min is None:
            effectif_min = _TRANCHE_MIN.get(tranche)
    if effectif_min is None:
        effectif_min = _parse_effectif_label(label)
    if effectif_min is None:
        effectif_min = _parse_int(payload.get("effectif"))

    date_creation = str(payload.get("date_creation") or payload.get("date_creation_entreprise") or "")
    year = date_creation[:4] if len(date_creation) >= 4 else ""

    ca = payload.get("chiffre_affaires")
    if ca is None:
        ca = payload.get("ca")
    ca_text = "" if ca is None else str(ca)

    siret = _digits(str(siege.get("siret") or payload.get("siret") or ""))
    siren = _digits(str(payload.get("siren") or ""))
    if not siren and len(siret) == 14:
        siren = siret[:9]

    return PappersCompany(
        siren=siren,
        siret=siret,
        tranche_effectif=tranche,
        effectif_min=effectif_min,
        effectif_label=label or tranche,
        chiffre_affaires=ca_text,
        annee_creation=year,
        code_naf=str(payload.get("code_naf") or siege.get("code_naf") or "").strip(),
        forme_juridique=str(payload.get("forme_juridique") or "").strip(),
        forme_juridique_code=str(payload.get("forme_juridique_code") or "").strip(),
    )


def _is_entreprise_individuelle(company: PappersCompany) -> bool:
    if company.forme_juridique_code in _EI_FORME_CODES:
        return True
    return bool(_EI_FORME_RE.search(company.forme_juridique))


def pappers_settings(config: dict[str, Any]) -> dict[str, Any]:
    return {
        "enabled": bool(config.get("PAPPERS_ENABLED", False)),
        "api_key": str(config.get("PAPPERS_API_KEY") or "").strip(),
        "min_employees": int(config.get("PAPPERS_MIN_EMPLOYEES", 10) or 10),
        "on_unknown": str(config.get("PAPPERS_ON_UNKNOWN") or "reject"),
        "naf_prefixes": list(config.get("PAPPERS_NAF_PREFIXES") or []),
        "concurrency": max(int(config.get("PAPPERS_CONCURRENCY", 5) or 5), 1),
    }


async def validate_leads(
    rows: list[dict[str, str]],
    config: dict[str, Any],
    *,
    log_cb: Callable[[str], None] | None = None,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    settings = pappers_settings(config)
    if not settings["enabled"]:
        return rows, []
    if not settings["api_key"]:
        if log_cb:
            log_cb("Pappers enabled but PAPPERS_API_KEY is missing — fail closed, no push.")
        rejected = [
            {**row, "Statut_Lead": "Non Valide", "Enrich_Reason": REJECT_PAPPERS_UNAVAILABLE}
            for row in rows
        ]
        return [], rejected

    validator = PappersSirenValidator(
        settings["api_key"],
        min_employees=settings["min_employees"],
        on_unknown=settings["on_unknown"],
        naf_prefixes=settings["naf_prefixes"],
        concurrency=settings["concurrency"],
    )
    if log_cb:
        log_cb(
            f"Pappers enrich — {len(rows)} lead(s), min effectif {settings['min_employees']}, "
            f"concurrency {settings['concurrency']}"
        )

    semaphore = asyncio.Semaphore(settings["concurrency"])
    valid: list[dict[str, str]] = []
    rejected: list[dict[str, str]] = []

    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0), follow_redirects=True) as client:

        async def _one(row: dict[str, str]) -> tuple[dict[str, str], PappersVerdict]:
            async with semaphore:
                verdict = await validator.validate_lead(row, client)
            return row, verdict

        results = await asyncio.gather(*[_one(row) for row in rows])

    for row, verdict in results:
        enriched = {**row, **verdict.company.as_lead_fields()}
        if verdict.accepted:
            valid.append(enriched)
        else:
            enriched["Statut_Lead"] = "Non Valide"
            enriched["Enrich_Reason"] = verdict.reason
            rejected.append(enriched)

    if log_cb:
        log_cb(f"Pappers enrich done — {len(valid)} valid, {len(rejected)} rejected")
    return valid, rejected
