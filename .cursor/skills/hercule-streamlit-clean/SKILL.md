---
name: hercule-streamlit-clean
description: >-
  Hercule.dev email list cleaner via MyEmailVerifier (app/streamlit_clean).
  Use when editing streamlit_clean, email verification pipeline, bulk verify,
  Instantly list purge, checkpoint recovery, or pnpm streamlit-clean.
---

# Streamlit Clean

MyEmailVerifier → Instantly email cleaning pipeline. Human reference: [app/streamlit_clean/README.md](../../app/streamlit_clean/README.md).

## Quick start

```bash
pnpm streamlit-clean
```

**Always read** [myemailverifier skill](../myemailverifier/SKILL.md) for API patterns before implementing verification logic.

Use MCP `user-instantly` for list/campaign ops.

## Environment

| Variable | Required |
|----------|----------|
| `MYEMAILVERIFIER_API_KEY` | Yes |
| `INSTANTLY_API_KEY` | Yes |
| `CRON_SECRET` or `LINK_TRACKING_WEBHOOK_SECRET` | Yes (before campaign push with URLs) |
| `CRM_BACKEND_URL` | No (default prod) |
| `CLEAN_SKIP_PROVISION` | No (`1` to skip) |

Load from repo root `.env`.

## 5-step funnel UI

| Step | Screen |
|------|--------|
| 1 | Source list selection |
| 2 | Target campaign selection |
| 3 | Run config (dry / test-50 / full / custom) |
| 4 | Execute (detached subprocess + job monitor) |
| 5 | Results + optional push (loaded from disk artifacts) |

## Pipeline flow

```
Quick local pre-filter → MyEmailVerifier bulk verify
  → provision tracking URLs (POST /api/link-tracking/provision-leads; niche from campaign ID)
  → purge source list (Full Clean mode)
  → push valid leads to Instantly campaign (custom_variables merged; workspace duplicate check on)
```

Run modes: `RUN_MODE_DRY`, `RUN_MODE_TEST_50`, `RUN_MODE_FULL`, `RUN_MODE_CUSTOM`.

## Key files

| File | Role |
|------|------|
| `app.py` | 5-step Streamlit funnel + job monitor |
| `job_runner.py` | Spawn detached `cli.py` subprocess from UI |
| `job_state.py` | Job manifest, heartbeat, active job pointer (atomic writes) |
| `cli.py` | Headless entrypoint (Render cron + UI subprocess) |
| `pipeline.py` | `run_cleaning_pipeline`, `_provision_and_merge_urls`, credit/time estimates |
| `shared/link_provision_client.py` | Sync batch provision via Hercule API |
| `bulk_verifier.py` | MyEmailVerifier bulk upload + poll |
| `quick_verifier.py` | Local pre-filter |
| `checkpoint.py` | Save/resume partial MEV runs |
| `recover_checkpoint.py` | Recover interrupted verification |
| `instantly_client.py` | List/campaign fetch, push |
| `core_logic.py` | API key helpers |

## Background job workflow

1. UI step 4 calls `job_runner.start_job()` → `subprocess.Popen(cli.py run ...)`
2. `cli.py` writes `{prefix}_job.json`, `active_job.json`, tees stdout to `{prefix}_run.log`
3. `pipeline.py` updates `job_heartbeat.json` + MEV checkpoint on each chunk
4. UI polls `load_job_status()` — refresh-safe; cancel sends SIGTERM (checkpoint preserved)
5. On `status=completed`, UI loads `PipelineResult` from `{prefix}_verified.csv` via `result_loader.py`

```bash
python cli.py status
python cli.py run --list-id <uuid> --campaign-id <uuid> --job-prefix <prefix>
```

## Checkpoint recovery

If verification stops mid-run:

1. Check `list_checkpoints()` in UI
2. Resume from `partial_verified_path`
3. Re-run push step if verification completed

## Status handling

After MyEmailVerifier: `Valid` → push; `Invalid` → reject; `Catch All` / `Unknown` → review UI metrics.

## Cross-links

- MyEmailVerifier API details: `.cursor/skills/myemailverifier/reference.md`
- Upstream leads often from `streamlit_scraper` before cleaning
