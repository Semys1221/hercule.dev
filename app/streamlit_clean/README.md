# Streamlit Clean

## AI agents

Before editing this app, read:
1. [`.cursor/rules/streamlit-tools.mdc`](../../.cursor/rules/streamlit-tools.mdc) (enforced when this path is open)
2. [`.cursor/skills/hercule-streamlit/SKILL.md`](../../.cursor/skills/hercule-streamlit/SKILL.md) (router)
3. [`.cursor/skills/hercule-streamlit-clean/SKILL.md`](../../.cursor/skills/hercule-streamlit-clean/SKILL.md) (this app)

Human reference: sections below.

MyEmailVerifier email list cleaner → Instantly campaign push.

## Quick start

```bash
pnpm streamlit-clean
# or:
cd app/streamlit_clean && pip install -r requirements.txt && streamlit run app.py
```

### Headless CLI (Render / cron)

```bash
export PYTHONPATH=/path/to/repo
cd app/streamlit_clean
python cli.py credits
python cli.py status
python cli.py run --list-id <uuid> --campaign-id <uuid> --mode test_50
python cli.py checkpoints
```

See [doc/render-outreach.md](../../doc/render-outreach.md) for Render deployment.

## Environment

Requires in repo root `.env`:

| Variable | Purpose |
|----------|---------|
| `MYEMAILVERIFIER_API_KEY` | Bulk email verification |
| `INSTANTLY_API_KEY` | List fetch, purge, campaign push |
| `CRON_SECRET` or `LINK_TRACKING_WEBHOOK_SECRET` | Link provisioning before campaign push |
| `CRM_BACKEND_URL` | Hercule API base (default `https://www.hercule.dev`) |
| `CLEAN_SKIP_PROVISION` | Set `1` to skip link provisioning |

## Pipeline

1. Select source Instantly list
2. Select target campaign
3. Choose run mode (dry / test-50 / full / custom)
4. Execute: launches a **detached subprocess** (`cli.py`) — safe to refresh or close the browser; progress is saved on disk
5. Review results; workspace duplicate check always on during push

Niche for link provisioning is auto-resolved from the destination campaign ID.

## Background jobs (crash-resilient)

Long runs execute outside the Streamlit process via `job_runner.py` → `cli.py`.

| Artifact | Purpose |
|----------|---------|
| `{prefix}_job.json` | Job manifest (list, campaign, mode, status, pid) |
| `active_job.json` | Pointer to the current job |
| `job_heartbeat.json` | Liveness + phase for the UI monitor |
| `{prefix}_run.log` | CLI stdout log |
| `{prefix}_checkpoint.json` | MEV verification progress (resume) |

```bash
python cli.py status          # active job + recent checkpoints
python cli.py checkpoints     # all resumable MEV jobs
```

The Streamlit UI shows a job monitor on step 4 with refresh/cancel. On completion, results load from disk artifacts.

## Checkpoint recovery

Interrupted runs can resume via checkpoint UI. See `checkpoint.py` and `recover_checkpoint.py`.
