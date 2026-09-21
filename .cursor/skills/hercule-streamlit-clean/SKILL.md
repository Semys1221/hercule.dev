---
name: hercule-streamlit-clean
description: >-
  Hercule.dev email list cleaner via MyEmailVerifier (lib/backend/streamlit_clean).
  Use when editing streamlit_clean, email verification pipeline, bulk verify,
  Instantly list purge, checkpoint recovery, or pnpm streamlit-clean.
---

# Streamlit Clean

MyEmailVerifier → Instantly email cleaning pipeline. Human reference: [lib/backend/streamlit_clean/README.md](../../lib/backend/streamlit_clean/README.md).

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

Load from repo root `.env`.

## 5-step funnel UI

| Step | Screen |
|------|--------|
| 1 | Source list selection |
| 2 | Target campaign selection |
| 3 | Run config (dry / test-50 / full / custom) |
| 4 | Execute |
| 5 | Results + optional push |

## Pipeline flow

```
Quick local pre-filter → MyEmailVerifier bulk verify
  → purge source list (Full Clean mode)
  → push valid leads to Instantly campaign (workspace duplicate check always on)
```

Run modes: `RUN_MODE_DRY`, `RUN_MODE_TEST_50`, `RUN_MODE_FULL`, `RUN_MODE_CUSTOM`.

## MEV CSV format

MyEmailVerifier reads the **first column** only. Required upload format:

```csv
email
user@example.com
```

- **Never** upload Instantly UI exports (first column is `id`).
- Manual export: step 1 **Download for MEV**, or `python cli.py export-mev --list-id <uuid>`.
- Pipeline auto-builds `{prefix}_mev_upload_0.csv` via `shared/mev_export.py`.

## Key files

| File | Role |
|------|------|
| `app.py` | 5-step Streamlit funnel |
| `pipeline.py` | `run_cleaning_pipeline`, credit/time estimates |
| `bulk_verifier.py` | MyEmailVerifier bulk upload + poll |
| `quick_verifier.py` | Local pre-filter |
| `checkpoint.py` | Save/resume partial runs |
| `recover_checkpoint.py` | Recover interrupted verification |
| `instantly_client.py` | List/campaign fetch, push |
| `core_logic.py` | API key helpers |
| `cli.py` | Headless run + `export-mev` / `audit-list` |
| `../../shared/mev_export.py` | Single-column MEV CSV helper |

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
