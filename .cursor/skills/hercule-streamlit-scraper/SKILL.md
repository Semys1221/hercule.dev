---
name: hercule-streamlit-scraper
description: >-
  Hercule.dev Outscraper lead pipeline (app/streamlit_scraper). Use when editing
  streamlit_scraper, presets, bootstrap, company_registry, Outscraper, enrich,
  SIRENE, scrape_state, push-instantly, onboarding tabs, VPS worker, or pnpm streamlit-scraper.
---

# Streamlit Scraper

Human reference: [app/streamlit_scraper/README.md](../../app/streamlit_scraper/README.md).

## Architecture

```
repo .env → config_loader.py → configs/{preset}_config.py
                                      ↓
                                 core_logic.py
                                  ↙         ↘
                            main.py      app.py (st.navigation)
```

| File / dir | Role |
|------------|------|
| `configs/` | Flat preset configs (`{id}_config.py`) |
| `configs/_bases/common.py` | Default tuning for config form |
| `app.py` | Entrypoint — `st.navigation` for Onboarding + Scrape |
| `bootstrap/ui_onboarding_page.py` | Onboarding layout (tabs 1–6) |
| `bootstrap/ui_scrape_page.py` | Scrape layout (always accessible) |
| `bootstrap/ui_tab_*.py` | Streamlit onboarding tabs |
| `bootstrap/ui_tab_scrape.py` | Scrape operations panel (live metrics, VPS control) |
| `bootstrap/ui_helpers.py` | Selectors, navigation (`register_navigation_pages`) |
| `bootstrap/vps_control.py` | SSH/systemd worker start/stop + remote state |
| `bootstrap/onboarding_state.py` | Track onboarding completion per preset |
| `core_logic.py` | Scrape, enrich, registry, Instantly push |
| `instantly_client.py` | Instantly API + sequence PATCH helpers |
| `scrape_metrics.py` | Instantly live count, heartbeat, cron events |
| `scrape_log.py` | Persistent `scrape.log` on disk |
| `commune_passes.py` | Pass 2+ commune expansion chunks |
| `taxonomy_gate.py` | Métier filter on Outscraper `type` / `category` / `subtypes` |

## Preset rules

- Auto-discovered from `configs/*_config.py` only (no root presets, no niche groups).
- Output isolated per preset under `output/{preset_id}/` (or `$HERCULE_DATA_ROOT/streamlit_scraper/output/{preset}/` on VPS).
- Dedup uses **own** list/campaign IDs only.

## Bootstrap workflow (UI)

```bash
pnpm streamlit-scraper
```

**Onboarding** (`bootstrap/ui_onboarding_page.py`): **Config → Liste → Campagne → 2 emails → E1–E3 → Prompt buyer**

**Scrape** (`bootstrap/ui_scrape_page.py`): always accessible — preset dropdown (`onboarding_complete` only); **Contrôles** bar (Démarrer/Continuer, Pause, Actualiser); live metrics; collapsed config summary.

Config Save does **not** require Instantly IDs. IDs are written in tabs 2–5.

Scrape page does **not** run the pipeline in-browser. Use **Démarrer / Continuer** in Contrôles (VPS systemd or local `worker-loop`).

## CLI

```bash
python main.py scrape --preset <id> --push-instantly --resume
python main.py worker-loop --preset <id> --push-instantly   # until target progress ≥ TARGET_LEADS
python main.py heal --preset <id>                           # hourly cron watchdog
python -m bootstrap cleanup-empty-instantly          # dry-run
python -m bootstrap cleanup-empty-instantly --execute
```

VPS install: `scripts/vps/install-scraper.sh` → systemd `hercule-scraper` + hourly heal cron per preset.

Dual comptable on VPS: `cabinets_expertise_comptable` (`TARGET_MODE=instantly_pushed`, live list) + `cabinets_expertise_comptable_vol` (`TARGET_MODE=instantly_pushed_run`, 10K checkpoint, taxonomy gate, same Instantly list). Volume worker: `VPS_SCRAPER_SERVICE=hercule-scraper-comptable-vol SCRAPER_PRESET=cabinets_expertise_comptable_vol`.

## Taxonomy gate (volume pipeline)

When `TAXONOMY_GATE_ENABLED=true`, scrape accepts leads only if `TAXONOMY_INCLUDED_KEYWORDS` match Outscraper fields **`type`**, **`category`**, **`subtypes`** (not company name, not website HTML). Implemented in `taxonomy_gate.py`, called from `_process_business` in `core_logic.py`. Rejects audit as `taxonomy_mismatch`.

## Outscraper API

**Always read** [outscraper skill](../outscraper/SKILL.md) for HTTP endpoints, async polling, params, and error handling before changing `OutscraperClient` or adding new Outscraper calls.

- API details: `.cursor/skills/outscraper/reference.md`
- Client implementation: `core_logic.py` (`OutscraperClient`)

## Pipeline stages

1. Scrape (Outscraper) — email/website/dedup; optional taxonomy gate on `type`/`category`/`subtypes`
2. Enrich (HTTP + BeautifulSoup) — skipped when `ENRICH_ENABLED=false`
3. SIRET / effectif (`company_registry`) — skipped when `PAPPERS_ENABLED=false`
4. Push (Instantly)

## Progress / metrics

- `TARGET_MODE=instantly_pushed` → worker/UI target = **Instantly live** API count (shared list total)
- `TARGET_MODE=instantly_pushed_run` → worker/UI target = **checkpoint** `instantly_pushed` in `scrape_state.json` (per-preset run; use when sharing a list with another worker)
- Helpers: `target_progress_value`, `target_uses_live_list` in `scrape_state.py`
- `worker_heartbeat.json` + `scrape.log` on disk; Scrape page reads remote files over SSH when `VPS_HOST` set

## Resume invariants

- `scrape_state.json` checkpoint; `incomplete` status is resumable
- Resume blocked on config fingerprint change — wipe local first
- Wipe local does **not** delete Instantly leads
- Scrape dropdown only shows presets with `onboarding_complete(preset)`

## Do not

- Hand-maintain preset registries
- Use personal `scrapping` skill (`apps/b2b-scraper/`)
- Run long scrape loops inside Streamlit (use worker-loop on VPS/local)
