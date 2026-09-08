# Render outreach deployment

```
status: canonical
audience: ops + coding-agent
depends_on: doc/crm-deployment.md, app/streamlit_scraper/README.md, app/streamlit_clean/README.md
```

Headless Outscraper scraping and MyEmailVerifier cleaning run on **Render background workers** with persistent disks. The Next.js product, Resend booking sequences, and `/api/cron/*` routes stay on **Vercel** + [cron-job.org](https://cron-job.org) per [doc/crm-deployment.md](./crm-deployment.md).

## Workspace and auth (hercule, not lontis)

Outreach deploys must use the **hercule** Render workspace (`contact@hercule.dev`). The separate **lontis** workspace (marin-agency scrapers) is **out of scope** for this repo.

| Channel | Correct setup |
|---------|---------------|
| **Cursor Render MCP** | Sign in as **contact@hercule.dev** (Settings → MCP → Render plugin → sign out → sign in) |
| **Render CLI / scripts** | `RENDER_API_KEY` in repo `.env` from the hercule account |
| **Blueprint Apply** | Open Dashboard while logged in as contact@hercule.dev |

### Local env vars

| Variable | Purpose |
|----------|---------|
| `RENDER_API_KEY` | CLI + CI; must be from **contact@hercule.dev** |
| `RENDER_WORKSPACE_ID` | `tea-daf9ph2d0e5s73bfjia0` (hercule team) |
| `RENDER_WORKSPACE_NAME` | Guard in `load-render-env.sh` (default `hercule`) |

Verify before any deploy:

```bash
pnpm render-workspace-check
# → workspace=hercule id=tea-daf9ph2d0e5s73bfjia0 email=contact@hercule.dev
```

If the check fails or lists **lontis** / marin-agency services:

1. Regenerate API key at [Render API Keys](https://dashboard.render.com/u/*/settings#api-keys) while logged in as contact@hercule.dev
2. Update `RENDER_API_KEY` in `.env`
3. Re-run `pnpm render-workspace-check`

### MCP fallback (API key Bearer)

If OAuth cannot reach the hercule account, add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer <RENDER_API_KEY from .env>"
      }
    }
  }
}
```

Restart Cursor. Pass `workspaceId: "tea-daf9ph2d0e5s73bfjia0"` on MCP tool calls when required.

### CLI login alternative

```bash
render login                    # browser → contact@hercule.dev
render workspace set            # select hercule
```

When `RENDER_API_KEY` is exported, it takes precedence over the CLI login token.

## Deploy with Render plugin (Cursor)

Use the **Render plugin** MCP tools and CLI after pushing `render.yaml` to Git.

### 1. Validate Blueprint (CLI)

```bash
render whoami -o json
render blueprints validate render.yaml
```

YAML/schema errors appear in the output. `billing_suspended` means the Render account billing must be active before Apply — not a config bug.

IDE validation: associate `render.yaml` with schema `https://render.com/schema/render.yaml.json` (see Render **render-blueprints** skill).

### 2. Apply Blueprint (Dashboard)

After merge + push:

[Open Blueprint deploy for this repo](https://dashboard.render.com/blueprint/new?repo=https://github.com/Semys1221/hercule.dev)

1. Complete Git OAuth if prompted
2. Review three services + `hercule-outreach` env group
3. Fill `sync: false` secrets (`OUTSCRAPER_API_KEY`, `INSTANTLY_API_KEY`, `MYEMAILVERIFIER_API_KEY`, `SCRAPER_PRESET`, `CLEAN_LIST_ID`, `CLEAN_CAMPAIGN_ID`)
4. Click **Apply**
5. Suspend `hercule-outreach-ui` if Streamlit UI is not needed in production

### 3. Post-deploy ops (Render MCP)

Authenticate the Render plugin in Cursor as **contact@hercule.dev**, then confirm `list_workspaces()` shows **hercule** (not lontis):

| Tool | Use |
|------|-----|
| `list_workspaces` / `select_workspace` | Pick target workspace |
| `list_services` | Confirm `hercule-scraper-worker`, `hercule-clean-worker` are live |
| `list_deploys` | Check latest deploy status |
| `list_logs` | Tail worker errors (`level: error`) |
| `trigger_deploy` | Redeploy after env var changes |
| `update_environment_variables` | Set API keys without Dashboard |
| `get_metrics` | CPU/memory on workers |

### 4. One-time SIRENE + smoke (Render shell)

On `hercule-scraper-worker` shell:

```bash
export HERCULE_DATA_ROOT=/var/data PYTHONPATH=/opt/render/project/src
cd app/streamlit_scraper && python main.py sirene-build --check
python main.py dry-run --preset "$SCRAPER_PRESET"
```

Manual job (bypasses weekly cron):

```bash
bash /opt/render/project/src/scripts/render/run-scraper.sh
bash /opt/render/project/src/scripts/render/run-clean.sh
```

### 5. Troubleshooting

Install **render-debug** skill for deeper log/metrics triage. Common fixes:

- Worker restart loop → check `supercronic` path in logs; verify `scripts/render/worker-entrypoint.sh` is executable
- `ModuleNotFoundError: shared` → confirm `PYTHONPATH=/opt/render/project/src`
- Empty disk after deploy → confirm `HERCULE_DATA_ROOT=/var/data` matches disk `mountPath`

## What stays on Vercel

| Component | Location |
|-----------|----------|
| Booking email cron (`*/15`) | `GET /api/cron/booking-emails` |
| Instantly bypass cron (`*/10`) | `GET /api/cron/instantly-bypass-jobs` |
| Calendly / Stripe / Resend webhooks | `app/api/webhooks/*` |
| Booking orchestration | `lib/booking-communication/` |

Do **not** move these to Render.

## Render services

Defined in [`render.yaml`](../render.yaml) at repo root.

| Service | Type | Purpose |
|---------|------|---------|
| `hercule-scraper-worker` | Background worker + disk | Scheduled Outscraper scrape via supercronic |
| `hercule-clean-worker` | Background worker + disk | MEV bulk verify + Instantly push (on-demand schedule) |
| `hercule-outreach-ui` | Web service (optional) | Streamlit dashboard for ops |

### Why workers instead of cron jobs?

Render **cron jobs cannot attach persistent disks**. Checkpoints (`scrape_state.json`, MEV `_checkpoint.json`) and the SIRENE SQLite index must survive restarts. Workers run [supercronic](https://github.com/aptible/supercronic) with crontab files under `scripts/render/` so jobs are scheduled but still write to `/var/data`.

## Environment variables

Create a Render **Environment Group** `hercule-outreach` and attach it to all outreach services. Mirror placeholders in repo [`.env.example`](../.env.example) locally — never commit real keys.

### Platform

| Variable | Required | Purpose |
|----------|----------|---------|
| `HERCULE_DATA_ROOT` | Render: `/var/data` | Persistent disk mount (local: unset → app dirs) |
| `PYTHONPATH` | Render: `/opt/render/project/src` | Import `shared/instantly_client.py` from clean app |

### Scraper worker

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OUTSCRAPER_API_KEY` | Yes | — | Outscraper Google Maps API |
| `INSTANTLY_API_KEY` | Yes (if push) | — | Instantly upload |
| `SCRAPER_PRESET` | Yes | — | Preset id (`services_fm`, `comptables`, …) |
| `SCRAPER_TARGET` | No | `5000` | Target leads |
| `SCRAPER_PUSH_INSTANTLY` | No | `1` | Set `0` to scrape without push |
| `INSTANTLY_LIST_ID` | No | preset config | Override for `biggy_agency` |
| `INSTANTLY_LIST_ID_CONSEILLERS_FINANCIERS` | No | preset config | Override |
| `INSTANTLY_LIST_ID_COMPTABLES` | No | preset config | Override |
| `OUTSCRAPER_POLL_TIMEOUT_S` | No | `600` | Outscraper task timeout (seconds) |
| `OUTSCRAPER_BATCH_SIZE` | No | `200` | Queries per API request |
| `OUTSCRAPER_CONCURRENCY` | No | `6` | In-flight async tasks |
| `INSTANTLY_READ_TIMEOUT_S` | No | `180` | Dedup list query timeout |

### Clean worker

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MYEMAILVERIFIER_API_KEY` | Yes | — | Bulk email verification |
| `INSTANTLY_API_KEY` | Yes | — | List fetch + campaign push |
| `CLEAN_LIST_ID` | Yes | — | Source Instantly list UUID |
| `CLEAN_CAMPAIGN_ID` | Yes (unless skip) | — | Destination campaign UUID |
| `CLEAN_MODE` | No | `test_50` | `dry_run` \| `test_50` \| `full` |
| `CLEAN_SKIP_PUSH` | No | `0` | Set `1` for verify-only |
| `CLEAN_RESUME_PREFIX` | No | — | Resume MEV checkpoint prefix |
| `CLEAN_ALLOWED_STATUSES` | No | `Valid,Catch All` | Comma-separated keep list |

### Optional UI

| Variable | Default | Purpose |
|----------|---------|---------|
| `STREAMLIT_APP` | `streamlit_scraper` | `streamlit_scraper` or `streamlit_clean` |

**Security:** `MYEMAILVERIFIER_API_KEY` must only live in Render env groups (or local `.env`). Do not add it to Vercel public or client-side env.

## Canonical commands

### Scraper (production)

```bash
cd app/streamlit_scraper
python main.py dry-run --preset <preset>
python main.py scrape --preset <preset> --target 5000 --push-instantly --resume
```

Render wrapper (same as cron):

```bash
SCRAPER_PRESET=services_fm bash scripts/render/run-scraper.sh
```

### Clean

```bash
cd app/streamlit_clean
python cli.py credits
python cli.py run --list-id <uuid> --campaign-id <uuid> --mode test_50
python cli.py checkpoints
python cli.py run --list-id <uuid> --resume-prefix 20260902_104321 --skip-push
```

Render wrapper:

```bash
CLEAN_LIST_ID=<uuid> CLEAN_CAMPAIGN_ID=<uuid> CLEAN_MODE=test_50 bash scripts/render/run-clean.sh
```

### SIRENE index (one-time per disk)

Run in Render shell on `hercule-scraper-worker` before first large scrape:

```bash
export HERCULE_DATA_ROOT=/var/data PYTHONPATH=/opt/render/project/src
cd app/streamlit_scraper
python main.py sirene-build          # ~10–20 min, ~2.7 GB download
python main.py sirene-build --check
```

Index path: `$HERCULE_DATA_ROOT/streamlit_scraper/data/sirene.db`

## Cron schedules

Edit crontab files in `scripts/render/`:

| File | Default | Job |
|------|---------|-----|
| `scraper-crontab` | `0 5 * * 1` (Mon 05:00 UTC) | Weekly scrape |
| `clean-crontab` | empty (manual) | Add line when ready |

Example clean schedule (Sunday 08:00 UTC, after scrape):

```
0 8 * * 0 /opt/render/project/src/scripts/render/run-clean.sh
```

All cron expressions are **UTC**.

## Operational runbook

### First deploy

1. Link repo in Render → **New Blueprint** → select `render.yaml`
2. Create env group `hercule-outreach` with API keys; attach to all services
3. Set `SCRAPER_PRESET`, `CLEAN_LIST_ID`, `CLEAN_CAMPAIGN_ID` on respective workers
4. Suspend `hercule-outreach-ui` if ops does not need Streamlit in production
5. Open shell on `hercule-scraper-worker` → run `sirene-build` once
6. Smoke test (see checklist below)

### Manual run

1. Render Dashboard → service → **Shell**
2. Run `bash scripts/render/run-scraper.sh` or `run-clean.sh` with env vars set
3. Or edit crontab and redeploy worker

### Resume interrupted scrape

Artifacts under `$HERCULE_DATA_ROOT/streamlit_scraper/output/{preset}/`:

- `scrape_state.json` — batch index, counts, in-flight Outscraper task IDs
- `outscraper_leads.csv` — leads that passed scrape gates

```bash
python main.py scrape --preset <preset> --resume --push-instantly
```

Resume is **blocked** if keywords, locations, enrich keywords, or filters changed since the saved run — abort and restart per [scraper README](../app/streamlit_scraper/README.md).

### Resume interrupted MEV verify

Artifacts under `$HERCULE_DATA_ROOT/streamlit_clean/data/`:

- `{prefix}_checkpoint.json`
- `{prefix}_quick_clean.csv`
- `{prefix}_verified_partial.csv`

```bash
python cli.py checkpoints
python cli.py run --list-id <uuid> --resume-prefix <prefix> --skip-push
```

MEV 429 rate limits are retried with backoff in `bulk_verifier.py` (30s poll interval).

### Logs and output

| What | Where |
|------|-------|
| Worker stdout/stderr | Render Dashboard → Logs |
| Scraper CSVs | `/var/data/streamlit_scraper/output/{preset}/` |
| Clean artifacts | `/var/data/streamlit_clean/data/` |

## Local parity

```bash
export HERCULE_DATA_ROOT=/tmp/hercule-render-test
export PYTHONPATH=$PWD

pnpm render-scraper-dry-run
pnpm render-clean-credits
# With keys:
SCRAPER_PRESET=services_fm pnpm render-scraper-run
CLEAN_LIST_ID=<uuid> CLEAN_CAMPAIGN_ID=<uuid> pnpm render-clean-run
```

## Smoke test checklist

- [ ] `pnpm render-workspace-check` → workspace **hercule**, email contact@hercule.dev
- [ ] `list_workspaces()` (MCP) shows **hercule** (not lontis)
- [ ] `render services -o json` does **not** list `scraper-marin-agency` / `cleaner-marin-agency`
- [ ] `python main.py dry-run --preset <active_preset>` exits 0
- [ ] `python cli.py credits` prints MEV balance
- [ ] `python cli.py run --list-id <small_list> --mode test_50 --skip-push` writes artifacts under `data/`
- [ ] `python main.py sirene-build --check` passes on scraper worker disk
- [ ] Full scrape writes to `output/{preset}/outscraper_leads.csv`
- [ ] Clean `test_50` with push updates Instantly campaign (optional)

## Failure / retry policy

| Failure | Behavior |
|---------|----------|
| Outscraper timeout | `OUTSCRAPER_POLL_TIMEOUT_S` (default 600s); resume with `--resume` |
| MEV 429 | Exponential backoff in `bulk_verifier.py`, up to 4 retries |
| Worker crash mid-job | Re-run with `--resume` (scraper) or `--resume-prefix` (clean) |
| Config change mid-scrape | Resume blocked — abort + clear local state |

## Cost estimate (Render Starter)

| Resource | ~Monthly |
|----------|----------|
| `hercule-scraper-worker` | $7 |
| `hercule-clean-worker` | $7 |
| Scraper disk 10 GB | $2.50 |
| Clean disk 2 GB | $0.50 |
| `hercule-outreach-ui` (optional) | $7 + $0.50 disk |
| **Workers + disks (no UI)** | **~$17/mo** |

## PR / handoff notes

Service names for Render Dashboard: `hercule-scraper-worker`, `hercule-clean-worker`, `hercule-outreach-ui` (optional).

After merge, ops should:

1. Deploy blueprint to staging workspace
2. Run smoke checklist
3. Enable clean crontab line when scrape → clean handoff is ready
4. Keep Streamlit Cloud / local `pnpm streamlit-*` as dev UI if desired
