# Streamlit Scraper

## AI agents

Before editing this app, read:
1. [`.cursor/rules/streamlit-tools.mdc`](../../.cursor/rules/streamlit-tools.mdc)
2. [`.cursor/skills/hercule-streamlit/SKILL.md`](../../.cursor/skills/hercule-streamlit/SKILL.md)
3. [`.cursor/skills/hercule-streamlit-scraper/SKILL.md`](../../.cursor/skills/hercule-streamlit-scraper/SKILL.md)

## Architecture

```
repo .env  →  config_loader.py  →  configs/{preset}_config.py
                                        ↓
                                   core_logic.py
                                    ↙         ↘
                              main.py      app.py (st.navigation)
                                        ↓
                          output/{preset}/outscraper_leads.csv
                          output/{preset}/onboarding_state.json
```

Presets are **flat** (no niche groups). Each preset lives in [`configs/`](configs/) as `{preset_id}_config.py`.

## Setup

```bash
cd app/streamlit_scraper
pip install -r requirements.txt
pnpm streamlit-scraper
```

Required in repo root [`.env`](../../.env):

| Variable | Purpose |
|----------|---------|
| `OUTSCRAPER_API_KEY` | Outscraper Google Maps API |
| `INSTANTLY_API_KEY` | Instantly list/campaign/push |
| `CRON_SECRET` / `INSTANTLY_BYPASS_WEBHOOK_SECRET` | Subsequence webhook (tab 5); CIF post-push link provision |
| `CRM_BACKEND_URL` | Hercule API base for auto link provision (default `https://www.hercule.dev`) |

Optional VPS remote control (Scrape page):

| Variable | Purpose |
|----------|---------|
| `VPS_HOST` | SSH host for scrape worker |
| `VPS_USER` | SSH user (e.g. `root`) |
| `VPS_SSH_PASSWORD` | Password (optional if SSH keys work) |
| `VPS_REPO_ROOT` | Repo path on VPS (default `/root/hercule.dev`) |
| `HERCULE_DATA_ROOT` | Persistent data dir (default `/var/lib/hercule`) |
| `VPS_SCRAPER_SERVICE` | systemd unit name (default `hercule-scraper`) |

## Onboarding (Streamlit UI)

Two sidebar pages via **`st.navigation`** in [`app.py`](app.py) — **Onboarding** and **Scrape** (sidebar navigation).

### Onboarding (tabs 1–6)

| Tab | Action |
|-----|--------|
| **1 Config** | Select existing or **Create new** — full form, Save writes `configs/{id}_config.py` (no Instantly IDs yet) |
| **2 Liste** | Select or create Instantly lead list |
| **3 Campagne** | Select or create Instantly campaign (stays **draft**) |
| **4 2 emails** | Write 2 cold-email steps → PATCH campaign sequences |
| **5 E1–E3** | Write subsequence emails → Instantly + Supabase templates + webhook init |
| **6 Prompt buyer** | Write reply-agent buyer prompt → file + Supabase when campaign is active |

When tab 6 completes onboarding, a caption points to the **Scrape** page in the sidebar.

Technical defaults (Outscraper batch, SIRENE, target 5 000) come from [`configs/_bases/common.py`](configs/_bases/common.py).

### Scrape page (always accessible)

- Own preset dropdown — lists only presets with **completed onboarding** (tabs 1–6)
- If no preset is ready, the page stays open with an info message
- **Contrôles** bar at top: **Démarrer / Continuer**, **Pause**, **Actualiser** (worker start/stop via SSH/systemd or local)
- Live metrics panel auto-refreshes every 5s
- Read-only config summary (collapsed by default)
- **Push CSV to Instantly** and **Wipe local** in secondary sections

## CLI

```bash
python -m bootstrap list
python -m bootstrap validate
python -m bootstrap validate my_preset --dry-run
python -m bootstrap cleanup-empty-instantly          # dry-run: delete 0-lead lists/campaigns
python -m bootstrap cleanup-empty-instantly --execute
python main.py dry-run --preset <id>
python main.py scrape --preset <id> --target 5000 --push-instantly --resume
python main.py worker-loop --preset <id> --push-instantly   # loop until target progress ≥ TARGET_LEADS
python main.py heal --preset <id>                           # cron watchdog (resume if stale)
python main.py audit-filter --preset cabinets_expertise_comptable_vol   # analyze filter_audit.csv
python main.py sirene-build --check
```

`cleanup-empty-instantly` scans the **whole Instantly workspace** for lists/campaigns with 0 leads. Review dry-run output before `--execute`.

## Pipeline

1. **Scrape (Outscraper)** — email + website gates, dedup; optional **taxonomy gate** (`type` / `category` / `subtypes`); empty batches retry up to 3×
2. **Enrich** — website keyword include/exclude (skipped when `ENRICH_ENABLED=false`)
3. **SIRET / effectif** — `company_registry` (skipped when `PAPPERS_ENABLED=false`)
4. **Push (Instantly)** — target `TARGET_LEADS` (default 5 000)

Pass 2+ expands communes via [`commune_passes.py`](commune_passes.py).

**TARGET_MODE** (see [`scrape_state.py`](scrape_state.py)):

| Mode | Progress / worker stop |
|------|------------------------|
| `csv_saved` | Rows in `outscraper_leads.csv` |
| `instantly_pushed` | **Instantly live** list count (API) — pipe A comptable |
| `instantly_pushed_run` | **Checkpoint** `instantly_pushed` in `scrape_state.json` — pipe vol (shared list) |

Checkpoint `instantly_pushed` = pushes credited to **this preset run** only.

### Dual pipeline comptable (VPS)

Two workers can run in parallel on the same Instantly list:

| systemd unit | Preset | Filtering | Target |
|--------------|--------|-----------|--------|
| `hercule-scraper` | `cabinets_expertise_comptable` | Website enrich + registry | `instantly_pushed` (live list) |
| `hercule-scraper-comptable-vol` | `cabinets_expertise_comptable_vol` | Outscraper taxonomy only (`taxonomy_gate.py`) | `instantly_pushed_run` (10K checkpoint) |

Volume preset filters métier on Outscraper columns **`type`**, **`category`**, **`subtypes`** (concatenated via `category_filter.taxonomy_text`). No BeautifulSoup, no effectif gate. Same `INSTANTLY_LIST_ID`; dedup via `INSTANTLY_DEDUP_LIST_IDS` + `INSTANTLY_SKIP_IF_IN_LIST`.

Install volume worker:

```bash
sudo VPS_SCRAPER_SERVICE=hercule-scraper-comptable-vol \
     SCRAPER_PRESET=cabinets_expertise_comptable_vol \
     bash scripts/vps/install-scraper.sh
sudo systemctl start hercule-scraper-comptable-vol
```

Output is isolated per preset under `$HERCULE_DATA_ROOT/streamlit_scraper/output/{preset_id}/`. Heal cron is per-preset (`heal-{preset}.log`).

#### Funnel vol — taux d'acceptation et taxonomy

Le pipe vol peut afficher un **creux batch ~9–15%** (`accepted / (accepted + rejected)` dans `scrape.log`) alors que le **taux global** reste ~20–35%. Ce n'est en général **pas** un problème de taxonomy :

| Rejet (typique vol) | Part du total | Cause |
|---------------------|---------------|-------|
| `duplicate company (domain) or email` | ~50–55% | Dedup scrape + chevauchement pipe A (même requêtes / même liste Instantly) |
| `invalid or missing email` | ~15–20% | Données Google Maps incomplètes |
| `taxonomy_mismatch` | **~3–5%** | Gate métier sur `type` / `category` / `subtypes` uniquement |
| Autres | &lt;1% | Domaines exclus (Facebook, PagesJaunes…) |

**Taxonomy gate** ([`taxonomy_gate.py`](taxonomy_gate.py)) : les **CAC seuls** (`Commissaire aux comptes` sans mot-clé EC) restent **exclus volontairement**. La majorité des `taxonomy_mismatch` sont du bruit (huissier, assurance, recrutement, école, avocat).

Audit reproductible :

```bash
python main.py audit-filter --preset cabinets_expertise_comptable_vol
# → breakdown Reason, buckets taxonomy, taxonomy_review.csv (borderline), batch rates
```

Revue manuelle échantillon : [`docs/taxonomy_review_manual.md`](docs/taxonomy_review_manual.md).

**Throughput (si creux batch persistant)** — leviers hors taxonomy :

1. Laisser le vol avancer vers **pass communes** (`SCRAPE_START_QUERY_PASS: 2` → chunks `commune_passes`) pour réduire le chevauchement avec pipe A (pass 0–1).
2. `INSTANTLY_SKIP_IF_IN_LIST: true` réduit le ratio pushed/scraped quand la liste est déjà peuplée par pipe A — comportement attendu avec liste partagée.
3. Ne pas assouplir la taxonomy sur le **nom Google** ; les faux positifs recrutement / agence web restent fréquents.

## Resume / checkpoint

- `output/{preset}/scrape_state.json` — batch checkpoint
- `output/{preset}/scrape.log` — persistent worker log
- `output/{preset}/worker_heartbeat.json` — worker liveness (stale → heal)
- `incomplete` runs are **resumable** — use Continue / worker-loop
- Resume blocked only if config fingerprint changed (wipe local first)

## VPS worker

On the VPS (once repo is deployed):

```bash
export SCRAPER_PRESET=cabinets_expertise_comptable
export HERCULE_DATA_ROOT=/var/lib/hercule
sudo bash scripts/vps/install-scraper.sh
sudo systemctl start hercule-scraper
```

From your Mac: open sidebar **Scrape** → **Continue / Start worker**. Progress uses Instantly live count and won't reset to 0 on rerun.

Helper scripts: [`scripts/vps/install-scraper.sh`](../../scripts/vps/install-scraper.sh), `heal-scraper.sh`, `run-worker-loop.sh`.

## Output per preset

`output/{preset_id}/` — CSVs, audits, `scrape_state.json`, `scrape.log`, `worker_heartbeat.json`, `cron_events.jsonl`, `onboarding_state.json`

## Legacy

Older group-based presets and Typer `bootstrap create` wizard were removed. Use the Streamlit tabs for all new presets.
