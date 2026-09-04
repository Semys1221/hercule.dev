# Streamlit Scraper

Config-driven Outscraper pipeline for French B2B leads. Supports multiple bootstrap presets with isolated output directories.

```
repo .env  →  config_loader.py  →  *_config.py + configs/*_config.py
                                        ↓
                                   core_logic.py
                                    ↙         ↘
                              main.py      app.py
                             (Typer CLI)   (Streamlit)
                                        ↓
                          output/{preset}/outscraper_leads.csv
                          output/{preset}/enrich_audit.csv
                          output/{preset}/scrape_state.json
```

## Setup

```bash
cd app/streamlit_scraper
pip install -r requirements.txt
```

Required in repo root [`.env`](../../.env):

| Variable | Purpose |
|----------|---------|
| `OUTSCRAPER_API_KEY` | Outscraper Google Maps API |
| `INSTANTLY_API_KEY` | Instantly push (native duplicate skip) |
| `INSTANTLY_LIST_ID` | Optional override for **biggy_agency** preset only |
| `INSTANTLY_LIST_ID_CONSEILLERS_FINANCIERS` | Optional override for conseillers_financiers preset |
| `INSTANTLY_LIST_ID_COMPTABLES` | Optional override for comptables preset |

## Presets

| Preset ID | UI label | Target | Instantly list |
|-----------|----------|--------|----------------|
| `biggy_agency` | Biggy Agency (France) | 5,000 pushed | `52324f4b-22f0-4cde-a033-56dfda5ae6f3` |
| `conseillers_financiers` | Conseillers Financiers (France) | 5,000 pushed | `4a616678-06a0-44d2-a27c-f9248a4c34bf` |
| `comptables` | Comptables (France) | 5,000 pushed | `a3cd8ff6-34e6-4864-9ed7-c066a8ca20c9` |
| `btp_reno` | BTP Second Œuvre & Rénovation | 5,000 pushed | `4cb53db3-b323-4dba-bd82-152f486ecd2c` |
| `pme_industrie` | PME B2B & Industrie | 5,000 pushed | `d6b95e96-0e79-4aa1-948a-89916f7f8586` |
| `cliniques_medical` | Cliniques Vétérinaires & Médical Privé | 5,000 pushed | `f98cb5fc-811e-4bdb-8c84-5b3d77824043` |
| `transport_logistique` | Transport, Logistique & Déménagement B2B | 5,000 pushed | `e803f27d-db8a-40b1-8b8a-285d3cfe7d23` |
| `expertise_conseil` | Expertise Comptable & Conseil | 5,000 pushed | `5170998d-da9b-4992-9628-bf5bc5b4edbf` |
| `formation_cfa` | Formation, Écoles Privées & CFA | 5,000 pushed | `533e3686-08ef-4c30-b961-de635af85643` |
| `services_fm` | Services aux Bâtiments (FM) | 5,000 pushed | `29119a30-89fb-457c-a723-583a7ddc98bd` |

Output files are isolated per preset under `output/{preset_id}/`.

Presets are auto-discovered from `*_config.py` files in this folder and [`configs/`](configs/) (each must export `PRESET_ID`, `PRESET_LABEL`, `CONFIG`). The 7 niche files live under `configs/`.

## Creating a new preset

Interactive wizard (recommended):

```bash
cd app/streamlit_scraper
python -m bootstrap create      # step-by-step prompts
python -m bootstrap list          # show discovered presets
python -m bootstrap validate      # schema + load check on all presets
python -m bootstrap validate my_preset --dry-run
python -m bootstrap provision-instantly          # create/reuse Instantly list + draft campaign
python -m bootstrap provision-instantly btp_reno

# Or via main CLI:
python main.py bootstrap create
python main.py bootstrap list
python main.py bootstrap provision-instantly
```

After creation, no manual registry edit is needed — the new `{preset_id}_config.py` is picked up automatically.

```bash
python main.py dry-run --preset <new_id>
python main.py scrape --preset <new_id> --target 5000 --push-instantly
```

### Biggy Agency (France)

17 keywords × 400 locations (+ expansion pass). Targets French marketing agencies (Google Ads, SEO, digital marketing).

Config: [`biggy_agency_config.py`](biggy_agency_config.py)

### Conseillers Financiers (France)

15 keywords × 400 locations (+ expansion pass). Targets CGP / wealth management / patrimoine advisors.

Config: [`conseillers_financiers_config.py`](conseillers_financiers_config.py)

- **Instantly list:** `4a616678-06a0-44d2-a27c-f9248a4c34bf`
- **Instantly campaign:** `cb5ce1d8-8a45-47c8-8630-3099dad06e71`
- **Scrape keywords:** conseiller en gestion de patrimoine, CGP, family office, wealth management, etc.
- **Enrich included:** gestion de patrimoine, assurance-vie, transmission, PER, immobilier locatif, etc.
- **Enrich hard excluded:** agence immobilière, expert-comptable, notaire, assurance auto, etc.

### Comptables (France)

14 keywords × 400 locations (+ expansion pass). Targets cabinets d'expertise comptable, fiduciaires, commissaires aux comptes.

Config: [`comptables_config.py`](comptables_config.py)

- **Instantly list:** `a3cd8ff6-34e6-4864-9ed7-c066a8ca20c9`
- **Instantly campaign:** `affdc6cf-1e4d-496b-a0b2-cf3a02f073aa`
- **Scrape keywords:** expert-comptable, cabinet comptable, commissaire aux comptes, Cerfrance, etc.
- **Enrich included:** expertise comptable, tenue de comptabilité, liasse fiscale, paie, bilan, etc.
- **Enrich hard excluded:** gestion de patrimoine, CGP, agence de communication, notaire, etc.

### Niche presets (`configs/`)

Seven B2B niches with Pappers effectif >= 10. Provision Instantly list + draft campaign (idempotent, name `Hercule — {label}`):

```bash
python -m bootstrap provision-instantly
```

Campaigns are created as **drafts** (not activated, no sequences). Copy is out of scope.

## Pipeline

1. **Scrape (Outscraper)** — minimal gates: valid email, website present, dedup, exclude domains
2. **Enrich (HTTP + BeautifulSoup)** — inline batches of 50; keyword include/exclude on fetched website HTML text. Hard exclusions always reject; soft exclusions only reject when no included keyword matches.
3. **SIRET / effectif** — overlapped with website enrich (no extra homepage fetch). BeautifulSoup extracts SIRET from the site; official no-key JSON (`recherche-entreprises.api.gouv.fr`) returns tranche d'effectif. Annuaire HTML is fallback only. Reject `REJECT_EMPLOYEE_COUNT` when tranche is under 10 salariés (or EI without staff).
4. **Push (Instantly)** — only leads marked **Valide** post-enrich + SIRET; target **5,000 pushed**

Set `ENRICH_ENABLED=false` in config to skip website enrich. SIRET lookup still runs when `PAPPERS_ENABLED=true`. No Pappers API key is required.

## Commands

```bash
python main.py ui                          # Streamlit dashboard
streamlit run app.py                       # same UI directly
python main.py dry-run --preset conseillers_financiers
python main.py scrape --preset conseillers_financiers --target 5000 --push-instantly
python main.py scrape --preset biggy_agency --target 100 --reset
python main.py clear-leads --preset conseillers_financiers
python main.py scrape --preset conseillers_financiers --resume --push-instantly
python main.py push-instantly --preset conseillers_financiers
python main.py enrich-csv --preset conseillers_financiers
python main.py filter-audit --preset conseillers_financiers --batches 1
python main.py remediate --preset conseillers_financiers --execute
```

Default preset is `biggy_agency` when `--preset` is omitted.

## Resume / abort after interruption

If Streamlit or the CLI stops mid-scrape, reopen the dashboard or run `--resume`:

- **`output/{preset}/scrape_state.json`** — checkpoint (batch index, scraped/enriched/pushed counts, in-flight task IDs)
- **`output/{preset}/outscraper_leads.csv`** — leads that passed scrape gates
- **`output/{preset}/enrich_audit.csv`** — leads rejected by website keyword check

On reopen, the Streamlit dashboard shows a **Previous scrape data detected** panel when local CSV, checkpoint, or Outscraper jobs remain:

1. **Continue scraping** — resumes from the last completed batch (disabled if config changed)
2. **Push to Instantly** — uploads CSV rows (Instantly skips duplicates server-side)
3. **Abort + clear local** — cancel Outscraper jobs, remove CSV + checkpoint + enrich audit
4. **Abort Outscraper + restart from scratch** — cancel remote jobs, clear local files, start fresh

**Start Engine** is disabled while leftover work exists — continue or abort first.

**Config change:** if keywords, locations, enrich keywords, or filters changed since the saved run, resume is blocked — use **Abort + restart**.

## Instantly push

When `--push-instantly` is enabled (or auto-push checkbox during scrape):

1. Scrapes leads to CSV (email + website gates)
2. Enriches in batches of **50** (`ENRICH_BATCH_SIZE`) via HTTP fetch + BeautifulSoup
3. Pushes to Instantly every **100** enriched-valid leads (`INSTANTLY_PUSH_EVERY`), plus final flush
4. Instantly skips leads already in any campaign or list

Instantly custom variables per lead: `city`, `service`, `type`, `category`, `subtypes`, `siret`, `siren`, `effectif`, `naf`, `forme_juridique`, `annee_creation`, `chiffre_affaires`.

CSV columns: `Email`, `Company`, `Website`, `Service`, `City`, `Type`, `Category`, `Subtypes`, plus Pappers fields (`Siret`, `Siren`, `Effectif`, `TrancheEffectif`, `Naf`, `FormeJuridique`, `AnneeCreation`, `ChiffreAffaires`).

## Enrich tuning

| Key | Default | Purpose |
|-----|---------|---------|
| `ENRICH_ENABLED` | `true` | Toggle website keyword check |
| `ENRICH_BATCH_SIZE` | 50 | Scraped leads before enrich batch |
| `ENRICH_CONCURRENCY` | 20 | Parallel HTTP requests |
| `ENRICH_TIMEOUT_MS` | 10000 | HTTP request timeout |
| `ENRICH_INCLUDED_KEYWORDS` | preset-specific | Must match on website |
| `ENRICH_HARD_EXCLUDED_KEYWORDS` | preset-specific | Always reject if matched |
| `ENRICH_SOFT_EXCLUDED_KEYWORDS` | preset-specific | Reject only when no included match |
| `PAPPERS_ENABLED` | `true` | SIRET / effectif via site + Annuaire (no API key) |
| `PAPPERS_MIN_EMPLOYEES` | 10 | Hard floor (INSEE tranche 11+) |
| `PAPPERS_ON_UNKNOWN` | `reject` | Fail closed when effectif is missing |
| `PAPPERS_NAF_PREFIXES` | preset-specific | Optional APE prefix filter |
| `PAPPERS_CONCURRENCY` | 20 | Parallel SIRET lookups |

Pappers reject reasons in `enrich_audit.csv`: `REJECT_EMPLOYEE_COUNT`, `REJECT_NAF`, `REJECT_PAPPERS_NOT_FOUND`, `REJECT_UNKNOWN_EFFECTIF`, `REJECT_PAPPERS_UNAVAILABLE`.

### Outscraper performance tuning

Override via repo [`.env`](../../.env):

| Variable | Default | Purpose |
|----------|---------|---------|
| `OUTSCRAPER_BATCH_SIZE` | 200 | Queries per API request |
| `OUTSCRAPER_CONCURRENCY` | 6 | In-flight async tasks |
| `OUTSCRAPER_LIMIT_PER_QUERY` | 30 | Places per query |
| `OUTSCRAPER_POLL_TIMEOUT_S` | 600 | Task timeout (10 min) |

## Remediation

```bash
python main.py remediate --preset conseillers_financiers --dry-run
python main.py remediate --preset conseillers_financiers --execute
python main.py remediate --preset conseillers_financiers --execute --target 500
```

Output files: `output/{preset}/enrich_audit.csv`, `output/{preset}/filter_audit.csv`, `output/{preset}/outscraper_raw.jsonl`, `output/{preset}/remediation_report.json`.

## Legacy

Older implementations live in [`app/scrapper/`](../scrapper/) (`agence_pipeline.py`, `streamlite_agence_pipeline.py`). This folder is the consolidated entrypoint.
