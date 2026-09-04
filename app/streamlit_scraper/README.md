# Streamlit Scraper

Config-driven Outscraper pipeline for French B2B leads. Supports multiple bootstrap presets with isolated output directories.

```
repo .env  →  config_loader.py  →  *_config.py (preset)
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

Output files are isolated per preset under `output/{preset_id}/`.

Presets are auto-discovered from `*_config.py` files (each must export `PRESET_ID`, `PRESET_LABEL`, `CONFIG`).

## Creating a new preset

Interactive wizard (recommended):

```bash
cd app/streamlit_scraper
python -m bootstrap create      # step-by-step prompts
python -m bootstrap list          # show discovered presets
python -m bootstrap validate      # schema + load check on all presets
python -m bootstrap validate my_preset --dry-run

# Or via main CLI:
python main.py bootstrap create
python main.py bootstrap list
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

## Pipeline

1. **Scrape (Outscraper)** — minimal gates: valid email, website present, dedup, exclude domains
2. **Enrich (HTTP + BeautifulSoup)** — inline batches of 50; keyword include/exclude on fetched website HTML text. Hard exclusions always reject; soft exclusions only reject when no included keyword matches.
3. **Push (Instantly)** — only leads marked **Valide** post-enrich; target **5,000 pushed**

Set `ENRICH_ENABLED=false` in config to skip website enrich and push scraped leads directly.

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

Instantly custom variables per lead: `city`, `service`, `type`, `category`, `subtypes`.

CSV columns: `Email`, `Company`, `Website`, `Service`, `City`, `Type`, `Category`, `Subtypes`.

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
